import "./mocks";
import { describe, it, expect, beforeEach, vi, beforeAll } from "vitest";
import request from "supertest";
import { createTestApp, createAuthenticatedAgent, EmailService, runBillingReminders } from "./setup";
import { Subscription } from "../models/Subscription";
import { User } from "../models/User";
import { BillingReminder } from "../models/BillingReminder";

const app = createTestApp();

let agent: any;
let userId: string;

const DAY = 24 * 60 * 60 * 1000;

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
  nextBillingDate: new Date(Date.now() + 10 * DAY).toISOString(),
};

describe("Trial subscriptions", () => {
  beforeEach(async () => {
    await (Subscription as any).deleteMany({});
    await (BillingReminder as any).deleteMany({});
    vi.clearAllMocks();
  });

  describe("POST /api/subscriptions", () => {
    it("creates a trial subscription with a trial end date", async () => {
      const trialEndDate = new Date(Date.now() + 7 * DAY).toISOString();
      const res = await agent.post("/api/subscriptions").send({
        ...baseSub,
        status: "trial",
        trialEndDate,
      });

      expect(res.status).toBe(201);
      expect(res.body.data.status).toBe("trial");
      expect(new Date(res.body.data.trialEndDate).toISOString()).toBe(
        new Date(trialEndDate).toISOString()
      );
    });

    it("returns 400 when status is trial but trialEndDate is missing", async () => {
      const res = await agent.post("/api/subscriptions").send({
        ...baseSub,
        status: "trial",
      });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it("returns 400 for an invalid trial end date", async () => {
      const res = await agent.post("/api/subscriptions").send({
        ...baseSub,
        status: "trial",
        trialEndDate: "not-a-date",
      });

      expect(res.status).toBe(400);
    });
  });

  describe("PATCH /api/subscriptions/:id", () => {
    it("marks an existing subscription as a trial when trialEndDate is provided", async () => {
      const created = await agent.post("/api/subscriptions").send(baseSub);
      const id = created.body.data._id;
      const trialEndDate = new Date(Date.now() + 5 * DAY).toISOString();

      const res = await agent.patch(`/api/subscriptions/${id}`).send({
        status: "trial",
        trialEndDate,
      });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe("trial");
      expect(new Date(res.body.data.trialEndDate).toISOString()).toBe(
        new Date(trialEndDate).toISOString()
      );
    });

    it("returns 400 when setting status to trial without trialEndDate", async () => {
      const created = await agent.post("/api/subscriptions").send(baseSub);
      const id = created.body.data._id;

      const res = await agent.patch(`/api/subscriptions/${id}`).send({
        status: "trial",
      });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it("clears the trial end date when leaving trial status", async () => {
      const created = await agent.post("/api/subscriptions").send({
        ...baseSub,
        status: "trial",
        trialEndDate: new Date(Date.now() + 5 * DAY).toISOString(),
      });
      const id = created.body.data._id;

      const res = await agent.patch(`/api/subscriptions/${id}`).send({
        status: "active",
        trialEndDate: null,
      });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe("active");
      expect(res.body.data.trialEndDate).toBeNull();
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  //  TRIAL ENDING REMINDERS
  // ══════════════════════════════════════════════════════════════════════════
  describe("trial ending reminders", () => {
    async function createNotifiedUser(email: string) {
      const user = await (User as any).create({
        name: "trialuser",
        email,
        provider: "local",
        email_notifications_enabled: true,
        preferred_currency: "USD",
      });
      return user._id;
    }

    async function createTrial(userIdParam: string, daysUntilEnd: number, overrides: any = {}) {
      return (Subscription as any).create({
        userId: userIdParam,
        name: "Spotify Premium",
        provider: "Spotify AB",
        amount: 9.99,
        currency: "USD",
        billingCycle: "monthly",
        nextBillingDate: new Date(Date.now() + daysUntilEnd * DAY),
        status: "trial",
        trialEndDate: new Date(Date.now() + daysUntilEnd * DAY),
        ...overrides,
      });
    }

    it("sends a 3-day trial ending email when the trial ends in 3 days", async () => {
      const notifiedUserId = await createNotifiedUser("trial3@test.com");
      await createTrial(notifiedUserId, 3);

      await runBillingReminders();

      expect(EmailService.sendTrialEndingEmail).toHaveBeenCalledWith(
        "trial3@test.com",
        "Spotify Premium",
        9.99,
        "USD",
        "trial_3_days",
        expect.any(Date)
      );
      expect(EmailService.sendBillingReminder).not.toHaveBeenCalled();

      const reminder = await (BillingReminder as any).findOne({
        userId: notifiedUserId,
        reminderType: "trial_3_days",
      });
      expect(reminder).toBeTruthy();
    });

    it("sends a 1-day trial ending email when the trial ends tomorrow", async () => {
      const notifiedUserId = await createNotifiedUser("trial1@test.com");
      await createTrial(notifiedUserId, 1);

      await runBillingReminders();

      expect(EmailService.sendTrialEndingEmail).toHaveBeenCalledWith(
        "trial1@test.com",
        "Spotify Premium",
        9.99,
        "USD",
        "trial_1_days",
        expect.any(Date)
      );
    });

    it("does NOT send a trial email when the trial is 5 days away (outside windows)", async () => {
      const notifiedUserId = await createNotifiedUser("trial5@test.com");
      await createTrial(notifiedUserId, 5);

      await runBillingReminders();

      expect(EmailService.sendTrialEndingEmail).not.toHaveBeenCalled();
    });

    it("does NOT send billing reminder emails for trial subscriptions", async () => {
      const notifiedUserId = await createNotifiedUser("trialbilling@test.com");
      await createTrial(notifiedUserId, 3, {
        nextBillingDate: new Date(Date.now() + 3 * DAY),
      });

      await runBillingReminders();

      expect(EmailService.sendBillingReminder).not.toHaveBeenCalled();
      expect(EmailService.sendTrialEndingEmail).toHaveBeenCalledTimes(1);
    });

    it("does not send duplicate trial reminders on repeated runs", async () => {
      const notifiedUserId = await createNotifiedUser("trialidem@test.com");
      await createTrial(notifiedUserId, 3);

      await runBillingReminders();
      const firstCount = (EmailService.sendTrialEndingEmail as any).mock.calls.length;

      await runBillingReminders();
      const secondCount = (EmailService.sendTrialEndingEmail as any).mock.calls.length;

      expect(secondCount).toBe(firstCount);
      expect(secondCount).toBe(1);

      const reminders = await (BillingReminder as any).find({
        userId: notifiedUserId,
        reminderType: "trial_3_days",
      });
      expect(reminders.length).toBe(1);
    });

    it("skips trial reminders for users with email notifications disabled", async () => {
      // testUserId from setup has email_notifications_enabled=false
      await createTrial(userId, 3);

      await runBillingReminders();

      expect(EmailService.sendTrialEndingEmail).not.toHaveBeenCalled();
    });

    it("skips trials that already ended", async () => {
      const notifiedUserId = await createNotifiedUser("trialpast@test.com");
      await createTrial(notifiedUserId, -1);

      await runBillingReminders();

      expect(EmailService.sendTrialEndingEmail).not.toHaveBeenCalled();
    });
  });
});
