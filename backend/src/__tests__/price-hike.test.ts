import "./mocks";
import { describe, it, expect, beforeEach, vi, beforeAll } from "vitest";
import { createTestApp, createAuthenticatedAgent } from "./setup";
import { Subscription } from "../models/Subscription";
import { Notification } from "../models/Notification";
import {
  uploadStatement,
  addDetectedSubscriptions,
} from "../controllers/statement.controller";
import { processStatement } from "../services/statementProcessor.service";
import type { Response } from "express";

const app = createTestApp();

let agent: any;
let userId: string;

beforeAll(async () => {
  const result = await createAuthenticatedAgent(app);
  agent = result.agent;
  userId = result.userId;
});

function makeRes() {
  const res: any = {
    statusCode: 200,
    payload: undefined as any,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(body: any) {
      this.payload = body;
      return this;
    },
  };
  return res as Response & { statusCode: number; payload: any };
}

const baseSub = {
  name: "Netflix",
  provider: "Netflix Inc",
  amount: 15.99,
  currency: "USD",
  billingCycle: "monthly",
  nextBillingDate: new Date(Date.now() + 10 * 86400000).toISOString(),
};

describe("Price-hike detection", () => {
  beforeEach(async () => {
    await (Subscription as any).deleteMany({});
    await (Notification as any).deleteMany({});
    vi.clearAllMocks();
  });

  describe("price history seeding", () => {
    it("seeds price history on manual creation", async () => {
      const res = await agent.post("/api/subscriptions").send(baseSub);
      expect(res.status).toBe(201);
      const history = res.body.data.priceHistory;
      expect(history).toHaveLength(1);
      expect(history[0].amount).toBe(15.99);
      expect(history[0].currency).toBe("USD");
      expect(history[0].source).toBe("initial");
    });
  });

  describe("manual amount edit (PATCH /api/subscriptions/:id)", () => {
    it("detects a price hike and creates a price_change notification", async () => {
      const created = await agent.post("/api/subscriptions").send(baseSub);
      const id = created.body.data._id;

      const res = await agent.patch(`/api/subscriptions/${id}`).send({
        amount: 19.99,
      });
      expect(res.status).toBe(200);
      expect(res.body.data.amount).toBe(19.99);

      const history = res.body.data.priceHistory;
      expect(history).toHaveLength(2);
      expect(history[1].amount).toBe(19.99);
      expect(history[1].source).toBe("manual");

      const notifs = await (Notification as any).find({ userId });
      expect(notifs).toHaveLength(1);
      expect(notifs[0].type).toBe("price_change");
      expect(notifs[0].message).toContain("Netflix increased from");
      expect(notifs[0].message).toContain("$15.99");
      expect(notifs[0].message).toContain("$19.99");
      expect(notifs[0].message).toContain("+25%");
      expect(notifs[0].read).toBe(false);
    });

    it("does NOT notify when amount is unchanged, and history is untouched", async () => {
      const created = await agent.post("/api/subscriptions").send(baseSub);
      const id = created.body.data._id;

      const res = await agent.patch(`/api/subscriptions/${id}`).send({
        amount: 15.99,
      });
      expect(res.status).toBe(200);
      expect(res.body.data.priceHistory).toHaveLength(1);

      const notifs = await (Notification as any).find({ userId });
      expect(notifs).toHaveLength(0);
    });

    it("does NOT notify when amount decreases, but still updates history", async () => {
      const created = await agent.post("/api/subscriptions").send(baseSub);
      const id = created.body.data._id;

      const res = await agent.patch(`/api/subscriptions/${id}`).send({
        amount: 9.99,
      });
      expect(res.status).toBe(200);

      const history = res.body.data.priceHistory;
      expect(history).toHaveLength(2);
      expect(history[1].amount).toBe(9.99);
      expect(history[1].source).toBe("manual");

      const notifs = await (Notification as any).find({ userId });
      expect(notifs).toHaveLength(0);
    });

    it("does NOT notify for non-amount edits", async () => {
      const created = await agent.post("/api/subscriptions").send(baseSub);
      const id = created.body.data._id;

      const res = await agent.patch(`/api/subscriptions/${id}`).send({
        name: "Netflix Standard",
      });
      expect(res.status).toBe(200);
      expect(res.body.data.priceHistory).toHaveLength(1);

      const notifs = await (Notification as any).find({ userId });
      expect(notifs).toHaveLength(0);
    });
  });

  describe("statement re-upload (confirm flow)", () => {
    async function confirmStatement(detected: any[]) {
      vi.mocked(processStatement).mockResolvedValueOnce({
        transactionsFound: detected.length,
        detected,
      } as any);

      const uploadRes = makeRes();
      const uploadNext = vi.fn();
      await uploadStatement(
        { userId, file: { buffer: Buffer.from("%PDF-1.4"), originalname: "s.pdf" } } as any,
        uploadRes,
        uploadNext,
      );
      expect(uploadNext).not.toHaveBeenCalled();
      const statementId = uploadRes.payload?.data?.id;
      expect(statementId).toBeTruthy();

      const confirmRes = makeRes();
      const confirmNext = vi.fn();
      await addDetectedSubscriptions(
        { userId, body: { statementId, indices: [0] } } as any,
        confirmRes,
        confirmNext,
      );
      expect(confirmNext).not.toHaveBeenCalled();
      return confirmRes;
    }

    it("detects a price hike when re-uploaded statement shows a higher amount", async () => {
      await agent.post("/api/subscriptions").send(baseSub);

      await confirmStatement([
        {
          name: "Netflix",
          provider: "Netflix",
          amount: 25.99,
          currency: "USD",
          billingCycle: "monthly",
          occurrences: 3,
          lastDate: new Date().toISOString(),
          confidence: 90,
          status: "new",
          classification: "subscription_candidate",
          reasons: [],
        },
      ]);

      const subs = await (Subscription as any).find({ userId });
      expect(subs).toHaveLength(1);
      expect(subs[0].amount).toBe(25.99);
      expect(subs[0].priceHistory).toHaveLength(2);
      expect(subs[0].priceHistory[1].amount).toBe(25.99);
      expect(subs[0].priceHistory[1].source).toBe("statement");

      const notifs = await (Notification as any).find({ userId });
      expect(notifs).toHaveLength(1);
      expect(notifs[0].type).toBe("price_change");
      expect(notifs[0].message).toContain("$15.99");
      expect(notifs[0].message).toContain("$25.99");
    });

    it("does NOT notify when re-uploaded amount is unchanged", async () => {
      await agent.post("/api/subscriptions").send(baseSub);

      await confirmStatement([
        {
          name: "Netflix",
          provider: "Netflix",
          amount: 15.99,
          currency: "USD",
          billingCycle: "monthly",
          occurrences: 3,
          lastDate: new Date().toISOString(),
          confidence: 90,
          status: "new",
          classification: "subscription_candidate",
          reasons: [],
        },
      ]);

      const subs = await (Subscription as any).find({ userId });
      expect(subs[0].amount).toBe(15.99);
      expect(subs[0].priceHistory).toHaveLength(1);

      const notifs = await (Notification as any).find({ userId });
      expect(notifs).toHaveLength(0);
    });

    it("does NOT notify when re-uploaded amount is lower, but history updates", async () => {
      await agent.post("/api/subscriptions").send({ ...baseSub, amount: 25.99 });

      await confirmStatement([
        {
          name: "Netflix",
          provider: "Netflix",
          amount: 15.99,
          currency: "USD",
          billingCycle: "monthly",
          occurrences: 3,
          lastDate: new Date().toISOString(),
          confidence: 90,
          status: "new",
          classification: "subscription_candidate",
          reasons: [],
        },
      ]);

      const subs = await (Subscription as any).find({ userId });
      expect(subs[0].amount).toBe(15.99);
      expect(subs[0].priceHistory).toHaveLength(2);
      expect(subs[0].priceHistory[1].amount).toBe(15.99);

      const notifs = await (Notification as any).find({ userId });
      expect(notifs).toHaveLength(0);
    });
  });
});
