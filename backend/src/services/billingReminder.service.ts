import { Subscription } from "../models/Subscription";
import { User } from "../models/User";
import { BillingReminder } from "../models/BillingReminder";
import { EmailService } from "../utils/email";
import { getExchangeRate, convertAmount } from "./exchangeRate.service";

const REMINDER_CONFIGS = [
  { days: 7, type: "7_days" as const },
  { days: 3, type: "3_days" as const },
  { days: 1, type: "1_day" as const },
];

// Days-remaining window each reminder type is allowed to fire in.
// The unique index on (subscriptionId, billingDate, reminderType) keeps
// each reminder idempotent even if the job runs repeatedly.
const REMINDER_WINDOWS: Record<
  "7_days" | "3_days" | "1_day",
  [number, number]
> = {
  "7_days": [4, 7],
  "3_days": [2, 3],
  "1_day": [1, 1],
};

const TRIAL_CONFIGS = [
  { type: "trial_3_days" as const, window: [2, 3] as [number, number] },
  { type: "trial_1_days" as const, window: [1, 1] as [number, number] },
];

async function runTrialReminders(now: Date): Promise<void> {
  const upcomingTrials = await Subscription.find({
    status: "trial",
    trialEndDate: {
      $ne: null,
      $gte: now,
      $lte: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  for (const sub of upcomingTrials) {
    if (!sub.trialEndDate) continue;
    const user = await User.findById(sub.userId);
    if (!user) continue;
    if (!user.email_notifications_enabled) continue;

    const daysUntil = Math.ceil(
      (sub.trialEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
    );

    const preferred = user.preferred_currency || sub.currency || "USD";
    let displayAmount = sub.amount;
    let displayCurrency = sub.currency;
    if (preferred !== sub.currency) {
      const rate = await getExchangeRate(sub.currency, preferred);
      displayAmount = convertAmount(sub.amount, sub.currency, preferred, rate);
      displayCurrency = preferred;
    }

    for (const config of TRIAL_CONFIGS) {
      const [minDays, maxDays] = config.window;
      if (daysUntil < minDays || daysUntil > maxDays) continue;

      const existing = await BillingReminder.findOne({
        subscriptionId: sub._id,
        billingDate: sub.trialEndDate,
        reminderType: config.type,
      });
      if (existing) continue;

      await EmailService.sendTrialEndingEmail(
        user.email,
        sub.name,
        displayAmount,
        displayCurrency,
        config.type,
        sub.trialEndDate,
      );

      try {
        await BillingReminder.create({
          userId: user._id,
          subscriptionId: sub._id,
          billingDate: sub.trialEndDate,
          reminderType: config.type,
          sentAt: new Date(),
        });
      } catch (err: any) {
        if (err?.code !== 11000) throw err;
      }
    }
  }
}

export async function runBillingReminders(): Promise<void> {
  const now = new Date();

  // Find active subscriptions billing in the next 7 days
  const upcoming = await Subscription.find({
    status: "active",
    nextBillingDate: {
      $gte: now,
      $lte: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  for (const sub of upcoming) {
    const user = await User.findById(sub.userId);
    if (!user) continue;

    // Skip users who opted out of email notifications
    if (!user.email_notifications_enabled) continue;

    const daysUntil = Math.ceil(
      (sub.nextBillingDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
    );

    // Display the amount in the user's preferred currency (original is untouched)
    const preferred = user.preferred_currency || sub.currency || "USD";
    let displayAmount = sub.amount;
    let displayCurrency = sub.currency;
    if (preferred !== sub.currency) {
      const rate = await getExchangeRate(sub.currency, preferred);
      displayAmount = convertAmount(sub.amount, sub.currency, preferred, rate);
      displayCurrency = preferred;
    }

    for (const config of REMINDER_CONFIGS) {
      const [minDays, maxDays] = REMINDER_WINDOWS[config.type];
      if (daysUntil < minDays || daysUntil > maxDays) continue;

      // Check if already sent (idempotent)
      const existing = await BillingReminder.findOne({
        subscriptionId: sub._id,
        billingDate: sub.nextBillingDate,
        reminderType: config.type,
      });
      if (existing) continue;

      // Send the reminder
      await EmailService.sendBillingReminder(
        user.email,
        sub.name,
        displayAmount,
        displayCurrency,
        config.type,
        sub.nextBillingDate,
      );

      // Record delivery — the unique index also guards against duplicate
      // sends if two jobs race, so a duplicate-key error is safe to ignore.
      try {
        await BillingReminder.create({
          userId: user._id,
          subscriptionId: sub._id,
          billingDate: sub.nextBillingDate,
          reminderType: config.type,
          sentAt: new Date(),
        });
      } catch (err: any) {
        if (err?.code !== 11000) throw err;
      }
    }
  }

  await runTrialReminders(now);
}
