import "./mocks";
import { describe, it, expect, beforeEach, vi, beforeAll } from "vitest";
import request from "supertest";
import { createTestApp, createAuthenticatedAgent, EmailService, runBillingReminders } from "./setup";
import { Subscription } from "../models/Subscription";
import { User } from "../models/User";
import { BillingReminder } from "../models/BillingReminder";

const app = createTestApp();

let agent: any;
let testUserId: string;

beforeAll(async () => {
  const result = await createAuthenticatedAgent(app);
  agent = result.agent;
  testUserId = result.userId;
});

describe("Billing Reminder Service — 7/3/1 Day Notifications", () => {
  beforeEach(async () => {
    await (Subscription as any).deleteMany({});
    await (BillingReminder as any).deleteMany({});
    vi.clearAllMocks();
  });

  // ── Helper: create a user with email notifications enabled ──
  async function createNotifiedUser(email: string) {
    const user = await (User as any).create({
      name: "notifieduser",
      email,
      provider: "local",
      email_notifications_enabled: true,
      preferred_currency: "USD",
    });
    return user._id;
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  7-DAY REMINDER
  // ══════════════════════════════════════════════════════════════════════════
  describe("7-day reminder", () => {
    it("sends a 7-day email reminder for subscription billing in 7 days", async () => {
      const notifiedUserId = await createNotifiedUser("notify7@test.com");
      const nextBilling = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      await (Subscription as any).create({
        userId: notifiedUserId,
        name: "Netflix",
        provider: "Netflix Inc",
        amount: 15.99,
        currency: "USD",
        billingCycle: "monthly",
        nextBillingDate: nextBilling,
        status: "active",
      });

      await runBillingReminders();

      expect(EmailService.sendBillingReminder).toHaveBeenCalledWith(
        "notify7@test.com",
        "Netflix",
        15.99,
        "USD",
        "7_days",
        expect.any(Date)
      );

      const reminder = await (BillingReminder as any).findOne({
        userId: notifiedUserId,
        reminderType: "7_days",
      });
      expect(reminder).toBeTruthy();
      expect(reminder.reminderType).toBe("7_days");
    });

    it("sends 7-day reminder when billing is 5 days away (within window)", async () => {
      const notifiedUserId = await createNotifiedUser("notify7b@test.com");
      const nextBilling = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);

      await (Subscription as any).create({
        userId: notifiedUserId,
        name: "Spotify",
        provider: "Spotify AB",
        amount: 9.99,
        currency: "USD",
        billingCycle: "monthly",
        nextBillingDate: nextBilling,
        status: "active",
      });

      await runBillingReminders();

      expect(EmailService.sendBillingReminder).toHaveBeenCalledWith(
        "notify7b@test.com",
        "Spotify",
        9.99,
        "USD",
        "7_days",
        expect.any(Date)
      );
    });

    it("does NOT send 7-day reminder when billing is 3 days away", async () => {
      const notifiedUserId = await createNotifiedUser("notify7c@test.com");
      const nextBilling = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);

      await (Subscription as any).create({
        userId: notifiedUserId,
        name: "Test Sub",
        provider: "Test",
        amount: 10,
        currency: "USD",
        billingCycle: "monthly",
        nextBillingDate: nextBilling,
        status: "active",
      });

      await runBillingReminders();

      expect(EmailService.sendBillingReminder).not.toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.anything(),
        expect.anything(),
        "7_days",
        expect.anything()
      );
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  //  3-DAY REMINDER
  // ══════════════════════════════════════════════════════════════════════════
  describe("3-day reminder", () => {
    it("sends a 3-day email reminder for subscription billing in 3 days", async () => {
      const notifiedUserId = await createNotifiedUser("notify3@test.com");
      const nextBilling = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);

      await (Subscription as any).create({
        userId: notifiedUserId,
        name: "YouTube Premium",
        provider: "Google",
        amount: 13.99,
        currency: "USD",
        billingCycle: "monthly",
        nextBillingDate: nextBilling,
        status: "active",
      });

      await runBillingReminders();

      expect(EmailService.sendBillingReminder).toHaveBeenCalledWith(
        "notify3@test.com",
        "YouTube Premium",
        13.99,
        "USD",
        "3_days",
        expect.any(Date)
      );

      const reminder = await (BillingReminder as any).findOne({
        userId: notifiedUserId,
        reminderType: "3_days",
      });
      expect(reminder).toBeTruthy();
    });

    it("sends 3-day reminder when billing is 2 days away", async () => {
      const notifiedUserId = await createNotifiedUser("notify3b@test.com");
      const nextBilling = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);

      await (Subscription as any).create({
        userId: notifiedUserId,
        name: "ChatGPT Plus",
        provider: "OpenAI",
        amount: 20,
        currency: "USD",
        billingCycle: "monthly",
        nextBillingDate: nextBilling,
        status: "active",
      });

      await runBillingReminders();

      expect(EmailService.sendBillingReminder).toHaveBeenCalledWith(
        "notify3b@test.com",
        "ChatGPT Plus",
        20,
        "USD",
        "3_days",
        expect.any(Date)
      );
    });

    it("does NOT send 3-day reminder when billing is 7 days away", async () => {
      const notifiedUserId = await createNotifiedUser("notify3c@test.com");
      const nextBilling = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      await (Subscription as any).create({
        userId: notifiedUserId,
        name: "Far Away",
        provider: "Test",
        amount: 5,
        currency: "USD",
        billingCycle: "monthly",
        nextBillingDate: nextBilling,
        status: "active",
      });

      await runBillingReminders();

      expect(EmailService.sendBillingReminder).not.toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.anything(),
        expect.anything(),
        "3_days",
        expect.anything()
      );
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  //  1-DAY REMINDER
  // ══════════════════════════════════════════════════════════════════════════
  describe("1-day reminder", () => {
    it("sends a 1-day email reminder for subscription billing tomorrow", async () => {
      const notifiedUserId = await createNotifiedUser("notify1@test.com");
      const nextBilling = new Date(Date.now() + 1 * 24 * 60 * 60 * 1000);

      await (Subscription as any).create({
        userId: notifiedUserId,
        name: "Adobe CC",
        provider: "Adobe",
        amount: 54.99,
        currency: "USD",
        billingCycle: "monthly",
        nextBillingDate: nextBilling,
        status: "active",
      });

      await runBillingReminders();

      expect(EmailService.sendBillingReminder).toHaveBeenCalledWith(
        "notify1@test.com",
        "Adobe CC",
        54.99,
        "USD",
        "1_day",
        expect.any(Date)
      );

      const reminder = await (BillingReminder as any).findOne({
        userId: notifiedUserId,
        reminderType: "1_day",
      });
      expect(reminder).toBeTruthy();
    });

    it("does NOT send 1-day reminder when billing is 2 days away", async () => {
      const notifiedUserId = await createNotifiedUser("notify1b@test.com");
      const nextBilling = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);

      await (Subscription as any).create({
        userId: notifiedUserId,
        name: "Test Sub",
        provider: "Test",
        amount: 10,
        currency: "USD",
        billingCycle: "monthly",
        nextBillingDate: nextBilling,
        status: "active",
      });

      await runBillingReminders();

      expect(EmailService.sendBillingReminder).not.toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.anything(),
        expect.anything(),
        "1_day",
        expect.anything()
      );
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  //  COMBINED: All three reminders at once
  // ══════════════════════════════════════════════════════════════════════════
  describe("combined: all three reminders for multiple subscriptions", () => {
    it("sends correct reminders for subscriptions at 7, 3, and 1 day intervals", async () => {
      const notifiedUserId = await createNotifiedUser("notifyall@test.com");
      const billing7 = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const billing3 = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
      const billing1 = new Date(Date.now() + 1 * 24 * 60 * 60 * 1000);

      await (Subscription as any).insertMany([
        {
          userId: notifiedUserId,
          name: "Netflix",
          provider: "Netflix Inc",
          amount: 15.99,
          currency: "USD",
          billingCycle: "monthly",
          nextBillingDate: billing7,
          status: "active",
        },
        {
          userId: notifiedUserId,
          name: "Spotify",
          provider: "Spotify AB",
          amount: 9.99,
          currency: "USD",
          billingCycle: "monthly",
          nextBillingDate: billing3,
          status: "active",
        },
        {
          userId: notifiedUserId,
          name: "Adobe CC",
          provider: "Adobe",
          amount: 54.99,
          currency: "USD",
          billingCycle: "monthly",
          nextBillingDate: billing1,
          status: "active",
        },
      ]);

      await runBillingReminders();

      const calls = (EmailService.sendBillingReminder as any).mock.calls;
      expect(calls.length).toBe(3);

      const types = calls.map((c: any[]) => c[4]);
      expect(types).toContain("7_days");
      expect(types).toContain("3_days");
      expect(types).toContain("1_day");

      const reminders = await (BillingReminder as any).find({ userId: notifiedUserId });
      expect(reminders.length).toBe(3);
      const reminderTypes = reminders.map((r: any) => r.reminderType);
      expect(reminderTypes).toContain("7_days");
      expect(reminderTypes).toContain("3_days");
      expect(reminderTypes).toContain("1_day");
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  //  IDEMPOTENCY
  // ══════════════════════════════════════════════════════════════════════════
  describe("idempotency", () => {
    it("does not send duplicate reminders on repeated runs", async () => {
      const notifiedUserId = await createNotifiedUser("notifyidempotent@test.com");
      const nextBilling = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      await (Subscription as any).create({
        userId: notifiedUserId,
        name: "Netflix",
        provider: "Netflix Inc",
        amount: 15.99,
        currency: "USD",
        billingCycle: "monthly",
        nextBillingDate: nextBilling,
        status: "active",
      });

      await runBillingReminders();
      const firstCallCount = (EmailService.sendBillingReminder as any).mock.calls.length;

      await runBillingReminders();
      const secondCallCount = (EmailService.sendBillingReminder as any).mock.calls.length;

      expect(secondCallCount).toBe(firstCallCount);

      const reminders = await (BillingReminder as any).find({
        userId: notifiedUserId,
        reminderType: "7_days",
      });
      expect(reminders.length).toBe(1);
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  //  SKIP CONDITIONS
  // ══════════════════════════════════════════════════════════════════════════
  describe("skip conditions", () => {
    it("skips users with email_notifications_enabled=false", async () => {
      const nextBilling = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      await (Subscription as any).create({
        userId: testUserId,
        name: "Test Sub",
        provider: "Test",
        amount: 10,
        currency: "USD",
        billingCycle: "monthly",
        nextBillingDate: nextBilling,
        status: "active",
      });

      await runBillingReminders();

      expect(EmailService.sendBillingReminder).not.toHaveBeenCalled();
    });

    it("skips cancelled subscriptions", async () => {
      const notifiedUserId = await createNotifiedUser("notifskip1@test.com");
      const nextBilling = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      await (Subscription as any).create({
        userId: notifiedUserId,
        name: "Cancelled Sub",
        provider: "Test",
        amount: 10,
        currency: "USD",
        billingCycle: "monthly",
        nextBillingDate: nextBilling,
        status: "cancelled",
      });

      await runBillingReminders();

      expect(EmailService.sendBillingReminder).not.toHaveBeenCalled();
    });

    it("skips paused subscriptions", async () => {
      const notifiedUserId = await createNotifiedUser("notifskip2@test.com");
      const nextBilling = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      await (Subscription as any).create({
        userId: notifiedUserId,
        name: "Paused Sub",
        provider: "Test",
        amount: 10,
        currency: "USD",
        billingCycle: "monthly",
        nextBillingDate: nextBilling,
        status: "paused",
      });

      await runBillingReminders();

      expect(EmailService.sendBillingReminder).not.toHaveBeenCalled();
    });

    it("skips subscriptions billing more than 7 days away", async () => {
      const notifiedUserId = await createNotifiedUser("notifskip3@test.com");
      const nextBilling = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000);

      await (Subscription as any).create({
        userId: notifiedUserId,
        name: "Far Away",
        provider: "Test",
        amount: 10,
        currency: "USD",
        billingCycle: "monthly",
        nextBillingDate: nextBilling,
        status: "active",
      });

      await runBillingReminders();

      expect(EmailService.sendBillingReminder).not.toHaveBeenCalled();
    });

    it("skips past-due subscriptions (nextBillingDate in the past)", async () => {
      const notifiedUserId = await createNotifiedUser("notifskip4@test.com");
      const nextBilling = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000);

      await (Subscription as any).create({
        userId: notifiedUserId,
        name: "Past Due",
        provider: "Test",
        amount: 10,
        currency: "USD",
        billingCycle: "monthly",
        nextBillingDate: nextBilling,
        status: "active",
      });

      await runBillingReminders();

      expect(EmailService.sendBillingReminder).not.toHaveBeenCalled();
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  //  CURRENCY CONVERSION
  // ══════════════════════════════════════════════════════════════════════════
  describe("currency conversion", () => {
    it("converts amount when user currency differs from subscription currency", async () => {
      const notifiedUserId = await createNotifiedUser("notifcurrency@test.com");
      const nextBilling = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      await (User as any).findByIdAndUpdate(notifiedUserId, {
        preferred_currency: "NGN",
      });

      const { getExchangeRate } = await import("../services/exchangeRate.service");
      (getExchangeRate as any).mockResolvedValueOnce(1550);

      await (Subscription as any).create({
        userId: notifiedUserId,
        name: "Netflix",
        provider: "Netflix Inc",
        amount: 15.99,
        currency: "USD",
        billingCycle: "monthly",
        nextBillingDate: nextBilling,
        status: "active",
      });

      await runBillingReminders();

      expect(getExchangeRate).toHaveBeenCalledWith("USD", "NGN");
      expect(EmailService.sendBillingReminder).toHaveBeenCalledWith(
        "notifcurrency@test.com",
        "Netflix",
        expect.any(Number),
        "NGN",
        "7_days",
        expect.any(Date)
      );
    });
  });
});

// ══════════════════════════════════════════════════════════════════════════════
//  API ROUTE: POST /api/billing-reminders/run
// ══════════════════════════════════════════════════════════════════════════════
describe("POST /api/billing-reminders/run (manual trigger route)", () => {
  let agent: any;

  beforeAll(async () => {
    const result = await createAuthenticatedAgent(app);
    agent = result.agent;
  });

  it("triggers billing reminders via API endpoint", async () => {
    const res = await agent.post("/api/billing-reminders/run");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.message).toBe("Reminders processed");
  });

  it("returns 401 when not authenticated", async () => {
    const res = await request(app).post("/api/billing-reminders/run");
    expect(res.status).toBe(401);
  });
});
