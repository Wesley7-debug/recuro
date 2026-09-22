import "./mocks";
import { describe, it, expect, beforeEach, vi, beforeAll } from "vitest";
import request from "supertest";
import { createTestApp, createAuthenticatedAgent } from "./setup";
import { Notification } from "../models/Notification";

const app = createTestApp();

let agent: any;
let userId: string;

beforeAll(async () => {
  const result = await createAuthenticatedAgent(app);
  agent = result.agent;
  userId = result.userId;
});

describe("Notification Routes", () => {
  beforeEach(async () => {
    await (Notification as any).deleteMany({});
    vi.clearAllMocks();
  });

  describe("GET /api/notifications", () => {
    it("returns empty array when no notifications", async () => {
      const res = await agent.get("/api/notifications");
      expect(res.status).toBe(200);
      expect(res.body.data).toEqual([]);
    });

    it("returns notifications sorted by newest first", async () => {
      await (Notification as any).create({
        userId,
        type: "renewal_reminder",
        title: "Old",
        message: "Old notification",
        read: false,
        createdAt: new Date("2026-01-01"),
      });
      await (Notification as any).create({
        userId,
        type: "renewal_reminder",
        title: "New",
        message: "New notification",
        read: false,
        createdAt: new Date("2026-09-19"),
      });

      const res = await agent.get("/api/notifications");
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(2);
      expect(res.body.data[0].title).toBe("New");
      expect(res.body.data[1].title).toBe("Old");
    });

    it("returns 401 when not authenticated", async () => {
      const res = await request(app).get("/api/notifications");
      expect(res.status).toBe(401);
    });
  });

  describe("PATCH /api/notifications/:id/read", () => {
    it("marks a notification as read", async () => {
      const notif = await (Notification as any).create({
        userId,
        type: "price_change",
        title: "Price Change",
        message: "Netflix increased",
        read: false,
      });

      const res = await agent.patch(`/api/notifications/${notif._id}/read`);
      expect(res.status).toBe(200);
      expect(res.body.data.message).toBe("Notification marked as read");
    });
  });

  describe("PATCH /api/notifications/read-all", () => {
    it("marks all notifications as read", async () => {
      await (Notification as any).create({
        userId,
        type: "renewal_reminder",
        title: "Notif 1",
        message: "msg",
        read: false,
      });
      await (Notification as any).create({
        userId,
        type: "price_change",
        title: "Notif 2",
        message: "msg",
        read: false,
      });

      const res = await agent.patch("/api/notifications/read-all");
      expect(res.status).toBe(200);
      expect(res.body.data.message).toBe("All notifications marked as read");
    });
  });
});
