import "./mocks";
import { describe, it, expect, vi, beforeAll } from "vitest";
import request from "supertest";
import { createTestApp, createAuthenticatedAgent } from "./setup";

const app = createTestApp();

let agent: any;

beforeAll(async () => {
  const result = await createAuthenticatedAgent(app);
  agent = result.agent;
});

describe("User Routes", () => {
  describe("PATCH /api/user/profile", () => {
    it("updates user name", async () => {
      const res = await agent.patch("/api/user/profile").send({
        name: "New Name",
      });
      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe("New Name");
    });

    it("updates preferred currency", async () => {
      const res = await agent.patch("/api/user/profile").send({
        preferred_currency: "GBP",
      });
      expect(res.status).toBe(200);
      expect(res.body.data.preferred_currency).toBe("GBP");
    });

    it("updates email notifications toggle", async () => {
      const res = await agent.patch("/api/user/profile").send({
        email_notifications_enabled: true,
      });
      expect(res.status).toBe(200);
      expect(res.body.data.email_notifications_enabled).toBe(true);
    });

    it("returns 400 for invalid currency", async () => {
      const res = await agent.patch("/api/user/profile").send({
        preferred_currency: "XYZ",
      });
      expect(res.status).toBe(400);
    });

    it("returns 401 when not authenticated", async () => {
      const res = await request(app).patch("/api/user/profile").send({
        name: "Test",
      });
      expect(res.status).toBe(401);
    });
  });
});
