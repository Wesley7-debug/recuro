import { Subscription } from "../models/Subscription";
import { User } from "../models/User";
import { Notification } from "../models/Notification";
import { EmailService } from "../utils/email";
import { getExchangeRate, convertAmount } from "./exchangeRate.service";
import { monthlyEquivalent, round2 } from "../utils/money";

function toPlainCaps(raw: any): Record<string, number> {
  if (!raw) return {};
  if (raw instanceof Map) return Object.fromEntries(raw as any);
  // Mongoose Map may be object with internal structure; handle plain object
  if (typeof raw === "object") {
    // If it's a Mongoose Map, it may have .get but Object.entries will not work; check
    if (typeof (raw as any).get === "function" && typeof (raw as any).entries === "function") {
      return Object.fromEntries((raw as any).entries());
    }
    return raw as Record<string, number>;
  }
  return {};
}

/**
 * Check all budget caps for a user and send email+notification for any
 * category where monthly spend > cap. De-duplicates by checking for an
 * existing unread budget_exceeded notification for that category created today.
 */
export async function checkAndAlertBudgets(userId: string): Promise<void> {
  const user: any = await User.findById(userId);
  if (!user) return;
  const rawCaps = (user as any).budgetCaps || (user as any).budget_caps;
  const caps = toPlainCaps(rawCaps);
  const categories = Object.keys(caps).filter((k) => Number(caps[k]) > 0);
  if (categories.length === 0) return;

  const preferred = user.preferred_currency || "NGN";

  // Fetch active subscriptions (active + trial count toward spend? Use active only to match dashboard)
  const subs = await Subscription.find({ userId, status: { $in: ["active", "trial"] } });

  // Compute monthly total per category in preferred currency
  const totals: Record<string, number> = {};
  for (const sub of subs) {
    const cat = sub.category || "other";
    if (!categories.includes(cat)) continue;
    let amountInPreferred = sub.amount;
    if (sub.currency !== preferred) {
      const rate = await getExchangeRate(sub.currency, preferred);
      amountInPreferred = convertAmount(sub.amount, sub.currency, preferred, rate);
    }
    const monthly = monthlyEquivalent(amountInPreferred, sub.billingCycle);
    totals[cat] = (totals[cat] || 0) + monthly;
  }

  for (const cat of categories) {
    const cap = Number(caps[cat]);
    const total = round2(totals[cat] || 0);
    if (total <= cap) continue;

    // Deduplicate: if we already sent a budget_exceeded notification for this category today, skip
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const existing = await Notification.findOne({
      userId,
      type: "budget_exceeded",
      // message contains category name; check via title/message pattern
      title: `Budget exceeded: ${cat}`,
      createdAt: { $gte: startOfDay },
    } as any);
    if (existing) continue;

    const catLabel = cat.charAt(0).toUpperCase() + cat.slice(1);
    const message = `You've exceeded your ${catLabel} budget: ${total.toFixed(2)}/${cap.toFixed(2)} ${preferred} for the month`;

    await Notification.create({
      userId,
      type: "budget_exceeded",
      title: `Budget exceeded: ${cat}`,
      message,
      read: false,
    });

    if (user.email_notifications_enabled) {
      await EmailService.sendBudgetExceededEmail(user.email, cat, total, cap, preferred);
    }
  }
}
