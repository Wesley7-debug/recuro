import "./mocks";
import { describe, it, expect, beforeEach, vi, beforeAll } from "vitest";
import request from "supertest";
import { createTestApp, createAuthenticatedAgent } from "./setup";
import { Subscription } from "../models/Subscription";

const app = createTestApp();

let agent: any;
let userId: string;

beforeAll(async () => {
  const result = await createAuthenticatedAgent(app);
  agent = result.agent;
  userId = result.userId;
});

describe("Subscription Routes", () => {
  beforeEach(async () => {
    await (Subscription as any).deleteMany({});
    vi.clearAllMocks();
  });

  const subData = {
    name: "Netflix",
    provider: "Netflix Inc",
    amount: 15.99,
    currency: "USD",
    billingCycle: "monthly",
    nextBillingDate: new Date(Date.now() + 10 * 86400000).toISOString(),
  };

  describe("POST /api/subscriptions", () => {
    it("creates a new subscription", async () => {
      const res = await agent.post("/api/subscriptions").send(subData);
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe("Netflix");
      expect(res.body.data.amount).toBe(15.99);
      expect(res.body.data.status).toBe("active");
      expect(res.body.data.userId).toBe(userId);
    });

    it("returns 400 when name is missing", async () => {
      const res = await agent.post("/api/subscriptions").send({
        provider: "Netflix Inc",
        amount: 15.99,
        billingCycle: "monthly",
        nextBillingDate: new Date().toISOString(),
      });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it("returns 400 when amount is negative", async () => {
      const res = await agent.post("/api/subscriptions").send({
        name: "Test",
        provider: "Test",
        amount: -5,
        billingCycle: "monthly",
        nextBillingDate: new Date().toISOString(),
      });
      expect(res.status).toBe(400);
    });

    it("returns 400 when billingCycle is invalid", async () => {
      const res = await agent.post("/api/subscriptions").send({
        name: "Test",
        provider: "Test",
        amount: 10,
        billingCycle: "biweekly",
        nextBillingDate: new Date().toISOString(),
      });
      expect(res.status).toBe(400);
    });

    it("returns 401 when not authenticated", async () => {
      const res = await request(app).post("/api/subscriptions").send(subData);
      expect(res.status).toBe(401);
    });

    it("defaults category to other and currency to USD", async () => {
      const res = await agent.post("/api/subscriptions").send({
        name: "Defaults",
        provider: "Test",
        amount: 5,
        billingCycle: "yearly",
        nextBillingDate: new Date().toISOString(),
      });
      expect(res.status).toBe(201);
      expect(res.body.data.category).toBe("other");
      expect(res.body.data.currency).toBe("USD");
    });
  });

  describe("GET /api/subscriptions", () => {
    it("returns empty array when no subscriptions", async () => {
      const res = await agent.get("/api/subscriptions");
      expect(res.status).toBe(200);
      expect(res.body.data).toEqual([]);
    });

    it("returns all user subscriptions", async () => {
      await agent.post("/api/subscriptions").send(subData);
      await agent.post("/api/subscriptions").send({
        ...subData,
        name: "Spotify",
        amount: 9.99,
      });

      const res = await agent.get("/api/subscriptions");
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(2);
    });

    it("filters by search term", async () => {
      await agent.post("/api/subscriptions").send(subData);
      await agent.post("/api/subscriptions").send({
        ...subData,
        name: "Spotify",
        provider: "Spotify AB",
        amount: 9.99,
      });

      const res = await agent.get("/api/subscriptions?search=netflix");
      expect(res.status).toBe(200);
      const names = res.body.data.map((s: any) => s.name);
      expect(names).toContain("Netflix");
      expect(names).not.toContain("Spotify");
    });
  });

  describe("GET /api/subscriptions/:id", () => {
    it("returns a specific subscription", async () => {
      const created = await agent.post("/api/subscriptions").send(subData);
      const id = created.body.data._id;

      const res = await agent.get(`/api/subscriptions/${id}`);
      expect(res.status).toBe(200);
      expect(res.body.data._id).toBe(id);
    });

    it("returns 404 for non-existent subscription", async () => {
      const res = await agent.get("/api/subscriptions/nonexistent-id");
      expect(res.status).toBe(404);
    });
  });

  describe("PATCH /api/subscriptions/:id", () => {
    it("updates subscription fields", async () => {
      const created = await agent.post("/api/subscriptions").send(subData);
      const id = created.body.data._id;

      const res = await agent.patch(`/api/subscriptions/${id}`).send({
        amount: 19.99,
        name: "Netflix Premium",
      });
      expect(res.status).toBe(200);
      expect(res.body.data.amount).toBe(19.99);
      expect(res.body.data.name).toBe("Netflix Premium");
    });

    it("returns 400 for invalid billing cycle", async () => {
      const created = await agent.post("/api/subscriptions").send(subData);
      const id = created.body.data._id;

      const res = await agent.patch(`/api/subscriptions/${id}`).send({
        billingCycle: "invalid",
      });
      expect(res.status).toBe(400);
    });

    it("returns 400 for invalid status", async () => {
      const created = await agent.post("/api/subscriptions").send(subData);
      const id = created.body.data._id;

      const res = await agent.patch(`/api/subscriptions/${id}`).send({
        status: "invalid",
      });
      expect(res.status).toBe(400);
    });
  });

  describe("DELETE /api/subscriptions/:id", () => {
    it("deletes a subscription", async () => {
      const created = await agent.post("/api/subscriptions").send(subData);
      const id = created.body.data._id;

      const res = await agent.delete(`/api/subscriptions/${id}`);
      expect(res.status).toBe(200);
      expect(res.body.data.message).toBe("Subscription deleted");
    });

    it("returns 404 for non-existent subscription", async () => {
      const res = await agent.delete("/api/subscriptions/nonexistent-id");
      expect(res.status).toBe(404);
    });
  });
});
