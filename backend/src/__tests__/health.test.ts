import "./mocks";
import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { createTestApp } from "./setup";

const app = createTestApp();

describe("GET /api/health", () => {
  it("returns status ok", async () => {
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ok" });
  });
});
