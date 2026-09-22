import "./mocks";
import { describe, it, expect, beforeEach, vi } from "vitest";
import request from "supertest";
import { createTestApp } from "./setup";
import { User } from "../models/User";
import { MagicLink } from "../models/MagicLink";
import { EmailService } from "../utils/email";

const app = createTestApp();

describe("Auth Routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("POST /api/auth/magic-link", () => {
    it("sends a magic link for a valid email", async () => {
      const res = await request(app)
        .post("/api/auth/magic-link")
        .send({ email: "test@example.com" });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(EmailService.sendVerificationEmail).toHaveBeenCalledTimes(1);
      expect(EmailService.sendVerificationEmail).toHaveBeenCalledWith(
        "test@example.com",
        expect.any(String)
      );
    });

    it("stores email consent and currency metadata", async () => {
      await request(app)
        .post("/api/auth/magic-link")
        .send({
          email: "user@test.com",
          emailConsent: true,
          preferredCurrency: "GBP",
        });

      const link = await (MagicLink as any).findOne({ email: "user@test.com" });
      expect(link).toBeTruthy();
      expect(link.metadata).toBeDefined();
      expect(link.metadata.emailConsent).toBe(true);
      expect(link.metadata.preferredCurrency).toBe("GBP");
    });

    it("returns 400 when email is missing", async () => {
      const res = await request(app)
        .post("/api/auth/magic-link")
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it("deletes old unused magic links for the same email", async () => {
      const old = await (MagicLink as any).create({
        email: "dup@test.com",
        token: "old-token-aaa",
        expiresAt: new Date(Date.now() + 900000),
        used: false,
      });

      await request(app)
        .post("/api/auth/magic-link")
        .send({ email: "dup@test.com" });

      const oldLink = await (MagicLink as any).findOne({ token: "old-token-aaa" });
      expect(oldLink).toBeNull();

      const links = await (MagicLink as any).find({ email: "dup@test.com" });
      expect(links.length).toBe(1);
    });

    it("includes verification email with correct token", async () => {
      await request(app)
        .post("/api/auth/magic-link")
        .send({ email: "token@test.com" });

      const link = await (MagicLink as any).findOne({ email: "token@test.com" });
      expect(link).toBeTruthy();
      expect(link.token).toBeDefined();
      expect(link.token.length).toBe(64);
      expect(link.expiresAt.getTime()).toBeGreaterThan(Date.now());
    });
  });

  describe("GET /api/auth/verify", () => {
    it("creates a new user and redirects on valid token", async () => {
      await request(app)
        .post("/api/auth/magic-link")
        .send({ email: "newuser@test.com" });

      const link = await (MagicLink as any).findOne({ email: "newuser@test.com" });
      expect(link).toBeTruthy();

      const res = await request(app)
        .get(`/api/auth/verify?token=${link.token}`);

      expect(res.status).toBe(302);
      expect(res.headers.location).toContain("/auth/callback?token=");

      const authToken = new URL(res.headers.location).searchParams.get("token");
      expect(authToken).toBeTruthy();

      const meRes = await request(app)
        .get("/api/auth/me")
        .set("Authorization", `Bearer ${authToken}`);
      expect(meRes.status).toBe(200);
      expect(meRes.body.data.email).toBe("newuser@test.com");

      const user = await (User as any).findOne({ email: "newuser@test.com" });
      expect(user).toBeTruthy();
      expect(user.name).toBe("newuser");
      expect(EmailService.sendWelcomeEmail).toHaveBeenCalledWith(
        "newuser@test.com",
        "newuser"
      );
    });

    it("returns 400 for invalid token", async () => {
      const res = await request(app)
        .get("/api/auth/verify?token=invalid-token");

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it("returns 400 for expired token", async () => {
      await (MagicLink as any).create({
        email: "expired@test.com",
        token: "expired-token-123",
        expiresAt: new Date(Date.now() - 1000),
        used: false,
      });

      const res = await request(app)
        .get("/api/auth/verify?token=expired-token-123");

      expect(res.status).toBe(400);
    });

    it("returns 400 for already used token", async () => {
      await (MagicLink as any).create({
        email: "used@test.com",
        token: "used-token-456",
        expiresAt: new Date(Date.now() + 900000),
        used: true,
      });

      const res = await request(app)
        .get("/api/auth/verify?token=used-token-456");

      expect(res.status).toBe(400);
    });

    it("returns 400 when token is missing", async () => {
      const res = await request(app).get("/api/auth/verify");
      expect(res.status).toBe(400);
    });

    it("marks the magic link as used after verification", async () => {
      await request(app)
        .post("/api/auth/magic-link")
        .send({ email: "markused@test.com" });

      const link = await (MagicLink as any).findOne({ email: "markused@test.com" });

      await request(app).get(`/api/auth/verify?token=${link.token}`);

      const updated = await (MagicLink as any).findOne({ token: link.token });
      expect(updated.used).toBe(true);
    });

    it("reuses existing user on second verification", async () => {
      await request(app)
        .post("/api/auth/magic-link")
        .send({ email: "reuse@test.com" });
      const link1 = await (MagicLink as any).findOne({ email: "reuse@test.com" });

      await request(app).get(`/api/auth/verify?token=${link1.token}`);

      vi.clearAllMocks();

      await request(app)
        .post("/api/auth/magic-link")
        .send({ email: "reuse@test.com" });
      const link2 = await (MagicLink as any).findOne({ email: "reuse@test.com" });

      await request(app).get(`/api/auth/verify?token=${link2.token}`);

      const users = await (User as any).find({ email: "reuse@test.com" });
      expect(users.length).toBe(1);

      expect(EmailService.sendWelcomeEmail).not.toHaveBeenCalled();
    });

    it("applies metadata preferences on first-time user creation", async () => {
      await request(app)
        .post("/api/auth/magic-link")
        .send({
          email: "pref@test.com",
          emailConsent: true,
          preferredCurrency: "EUR",
        });

      const link = await (MagicLink as any).findOne({ email: "pref@test.com" });
      await request(app).get(`/api/auth/verify?token=${link.token}`);

      const user = await (User as any).findOne({ email: "pref@test.com" });
      expect(user).toBeTruthy();
      expect(user.email_notifications_enabled).toBe(true);
      expect(user.preferred_currency).toBe("EUR");
    });
  });

  describe("GET /api/auth/me", () => {
    it("returns 401 when not authenticated", async () => {
      const res = await request(app).get("/api/auth/me");
      expect(res.status).toBe(401);
    });
  });

  describe("POST /api/auth/logout", () => {
    it("returns 200 and success message", async () => {
      const agent = request.agent(app);
      const res = await agent.post("/api/auth/logout");
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
