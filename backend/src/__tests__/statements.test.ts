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

describe("Statement Routes", () => {
  describe("POST /api/transactions/statements", () => {
    it("returns 400 when no file is uploaded", async () => {
      const res = await agent.post("/api/transactions/statements");
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it("returns 401 when not authenticated", async () => {
      const fakePdf = Buffer.from("%PDF-1.4 fake content");
      const res = await request(app)
        .post("/api/transactions/statements")
        .attach("statement", fakePdf, {
          filename: "test.pdf",
          contentType: "application/pdf",
        });
      expect(res.status).toBe(401);
    });
  });

  describe("POST /api/transactions/statements/confirm", () => {
    it("returns 400 when statementId is missing", async () => {
      const res = await agent
        .post("/api/transactions/statements/confirm")
        .send({ indices: [0] });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it("returns 400 when indices is not an array", async () => {
      const res = await agent
        .post("/api/transactions/statements/confirm")
        .send({ statementId: "abc", indices: "not-array" });
      expect(res.status).toBe(400);
    });

    it("returns 400 when indices is empty", async () => {
      const res = await agent
        .post("/api/transactions/statements/confirm")
        .send({ statementId: "abc", indices: [] });
      expect(res.status).toBe(400);
    });

    it("returns 404 for non-existent statementId", async () => {
      const res = await agent
        .post("/api/transactions/statements/confirm")
        .send({ statementId: "nonexistent", indices: [0] });
      expect(res.status).toBe(404);
    });
  });
});
