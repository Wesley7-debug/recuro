import "./mocks";
import { describe, it, expect, beforeEach, vi, beforeAll } from "vitest";
import request from "supertest";
import { createTestApp, createAuthenticatedAgent } from "./setup";
import { Subscription } from "../models/Subscription";
import { SavingsLog } from "../models/SavingsLog";
import { User } from "../models/User";
import { getExchangeRate } from "../services/exchangeRate.service";

const app = createTestApp();

let agent: any;
let userId: string;

beforeAll(async () => {
  const result = await createAuthenticatedAgent(app);
  agent = result.agent;
  userId = result.userId;
});

const baseSub = {
  name: "Netflix",
  provider: "Netflix Inc",
  amount: 15.99,
  currency: "USD",
  billingCycle: "monthly",
  nextBillingDate: new Date(Date.now() + 10 * 86400000).toISOString(),
};

describe("Savings counter", () => {
  beforeEach(async () => {
    await (Subscription as any).deleteMany({});
    await (SavingsLog as any).deleteMany({});
    vi.clearAllMocks();
  });

  describe("logging on status change", () => {
    it("logs a savings entry when a subscription is cancelled", async () => {
      const created = await agent.post("/api/subscriptions").send(baseSub);
      const id = created.body.data._id;

      const res = await agent.patch(`/api/subscriptions/${id}`).send({
        status: "cancelled",
      });
      expect(res.status).toBe(200);

      const logs = await (SavingsLog as any).find({ userId });
      expect(logs).toHaveLength(1);
      expect(logs[0].name).toBe("Netflix");
      expect(logs[0].amount).toBe(15.99);
      expect(logs[0].currency).toBe("USD");
      expect(logs[0].status).toBe("cancelled");
      expect(logs[0].subscriptionId).toBe(id);
    });

    it("logs a savings entry when a subscription is paused", async () => {
      const created = await agent.post("/api/subscriptions").send(baseSub);
      const id = created.body.data._id;

      await agent.patch(`/api/subscriptions/${id}`).send({ status: "paused" });

      const logs = await (SavingsLog as any).find({ userId });
      expect(logs).toHaveLength(1);
      expect(logs[0].status).toBe("paused");
    });

    it("stores the normalized monthly amount (yearly → monthly)", async () => {
      const created = await agent.post("/api/subscriptions").send({
        ...baseSub,
        name: "Amazon Prime",
        amount: 139,
        billingCycle: "yearly",
      });
      const id = created.body.data._id;

      await agent.patch(`/api/subscriptions/${id}`).send({ status: "cancelled" });

      const logs = await (SavingsLog as any).find({ userId });
      expect(logs).toHaveLength(1);
      expect(logs[0].amount).toBeCloseTo(139 / 12, 5);
    });

    it("normalizes quarterly and weekly amounts", async () => {
      const created = await agent.post("/api/subscriptions").send({
        ...baseSub,
        name: "Quarterly Sub",
        amount: 90,
        billingCycle: "quarterly",
      });
      await agent
        .patch(`/api/subscriptions/${created.body.data._id}`)
        .send({ status: "paused" });

      const logs = await (SavingsLog as any).find({ userId });
      expect(logs[0].amount).toBe(30);
    });

    it("does NOT log when status does not change to a savings state", async () => {
      const created = await agent.post("/api/subscriptions").send(baseSub);
      const id = created.body.data._id;

      await agent.patch(`/api/subscriptions/${id}`).send({ name: "Netflix 4K" });

      const logs = await (SavingsLog as any).find({ userId });
      expect(logs).toHaveLength(0);
    });

    it("does NOT create a duplicate entry for repeated edits while cancelled", async () => {
      const created = await agent.post("/api/subscriptions").send(baseSub);
      const id = created.body.data._id;

      await agent.patch(`/api/subscriptions/${id}`).send({ status: "cancelled" });
      await agent.patch(`/api/subscriptions/${id}`).send({ name: "Netflix Renamed" });
      await agent.patch(`/api/subscriptions/${id}`).send({ status: "cancelled" });

      const logs = await (SavingsLog as any).find({ userId });
      expect(logs).toHaveLength(1);
    });

    it("keeps the historical entry after reactivation (cancelled → active)", async () => {
      const created = await agent.post("/api/subscriptions").send(baseSub);
      const id = created.body.data._id;

      await agent.patch(`/api/subscriptions/${id}`).send({ status: "cancelled" });
      await agent.patch(`/api/subscriptions/${id}`).send({ status: "active" });

      const logs = await (SavingsLog as any).find({ userId });
      expect(logs).toHaveLength(1);

      // Reactivated — no new entry counted going forward
      const res = await agent.get("/api/savings");
      expect(res.status).toBe(200);
      expect(res.body.data.entries).toHaveLength(1);
    });

    it("logs a new entry if a reactivated subscription is cancelled again", async () => {
      const created = await agent.post("/api/subscriptions").send(baseSub);
      const id = created.body.data._id;

      await agent.patch(`/api/subscriptions/${id}`).send({ status: "cancelled" });
      await agent.patch(`/api/subscriptions/${id}`).send({ status: "active" });
      await agent.patch(`/api/subscriptions/${id}`).send({ status: "cancelled" });

      const logs = await (SavingsLog as any).find({ userId });
      expect(logs).toHaveLength(2);
    });

    it("does not log when a new subscription is created with a savings status", async () => {
      await agent.post("/api/subscriptions").send({
        ...baseSub,
        status: "cancelled",
      });

      const logs = await (SavingsLog as any).find({ userId });
      expect(logs).toHaveLength(0);
    });
  });

  describe("GET /api/savings", () => {
    it("returns 401 when not authenticated", async () => {
      const res = await request(app).get("/api/savings");
      expect(res.status).toBe(401);
    });

    it("returns an empty total when there are no entries", async () => {
      const res = await agent.get("/api/savings");
      expect(res.status).toBe(200);
      expect(res.body.data.total).toBe(0);
      expect(res.body.data.currency).toBe("NGN");
      expect(res.body.data.entries).toEqual([]);
    });

    it("returns lifetime total and entries (same currency, no conversion)", async () => {
      await (User as any).findByIdAndUpdate(userId, {
        preferred_currency: "USD",
      });

      const a = await agent.post("/api/subscriptions").send(baseSub);
      await agent.patch(`/api/subscriptions/${a.body.data._id}`).send({
        status: "cancelled",
      });
      const b = await agent.post("/api/subscriptions").send({
        ...baseSub,
        name: "Spotify",
        amount: 9.99,
      });
      await agent.patch(`/api/subscriptions/${b.body.data._id}`).send({
        status: "paused",
      });

      const res = await agent.get("/api/savings");
      expect(res.status).toBe(200);
      expect(res.body.data.currency).toBe("USD");
      expect(res.body.data.total).toBeCloseTo(25.98, 2);
      expect(res.body.data.entries).toHaveLength(2);

      await (User as any).findByIdAndUpdate(userId, {
        preferred_currency: "NGN",
      });
    });

    it("converts entries to the user's preferred currency", async () => {
      // preferred currency is NGN (default from setup), entry is USD
      (getExchangeRate as any).mockResolvedValueOnce(1550);

      const created = await agent.post("/api/subscriptions").send(baseSub);
      await agent.patch(`/api/subscriptions/${created.body.data._id}`).send({
        status: "cancelled",
      });

      const res = await agent.get("/api/savings");
      expect(res.status).toBe(200);
      expect(getExchangeRate).toHaveBeenCalledWith("USD", "NGN");
      expect(res.body.data.currency).toBe("NGN");
      expect(res.body.data.total).toBeCloseTo(15.99 * 1550, 1);
    });

    it("returns entries sorted newest first", async () => {
      const first = await agent.post("/api/subscriptions").send(baseSub);
      await agent.patch(`/api/subscriptions/${first.body.data._id}`).send({
        status: "cancelled",
      });
      const second = await agent.post("/api/subscriptions").send({
        ...baseSub,
        name: "Spotify",
        amount: 9.99,
      });
      await agent.patch(`/api/subscriptions/${second.body.data._id}`).send({
        status: "paused",
      });

      const res = await agent.get("/api/savings");
      expect(res.body.data.entries).toHaveLength(2);
      expect(res.body.data.entries[0].name).toBe("Spotify");
      expect(res.body.data.entries[1].name).toBe("Netflix");
    });
  });
});
