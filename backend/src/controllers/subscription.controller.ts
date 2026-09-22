import { Request, Response, NextFunction } from "express";
import { Subscription } from "../models/Subscription";
import { Notification } from "../models/Notification";
import { SavingsLog } from "../models/SavingsLog";
import {
  applyAmountChange,
  initialPriceHistory,
  notifyPriceChange,
} from "../services/priceHistory.service";
import { monthlyEquivalent } from "../utils/money";
import { checkAndAlertBudgets } from "../services/budgetAlert.service";
import { ApiError } from "../utils/apiError";
import { sendSuccess } from "../utils/apiResponse";

const SAVINGS_STATUSES = ["cancelled", "paused"];

export async function listSubscriptions(req: Request, res: Response, next: NextFunction) {
  try {
    const { search, status, category, from, to } = req.query;
    const filter: any = { userId: req.userId };

    if (search && typeof search === "string") {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { provider: { $regex: search, $options: "i" } },
      ];
    }
    if (status && typeof status === "string") {
      filter.status = status;
    }
    if (category && typeof category === "string") {
      filter.category = category;
    }
    // Date-range filter for calendar view — filter by nextBillingDate or trialEndDate
    if ((from && typeof from === "string") || (to && typeof to === "string")) {
      const dateField = (req.query.dateField as string) === "trialEndDate" ? "trialEndDate" : "nextBillingDate";
      filter[dateField] = {};
      if (from && typeof from === "string") {
        const fromDate = new Date(from);
        if (!isNaN(fromDate.getTime())) filter[dateField].$gte = fromDate;
      }
      if (to && typeof to === "string") {
        const toDate = new Date(to);
        if (!isNaN(toDate.getTime())) filter[dateField].$lte = toDate;
      }
      if (Object.keys(filter[dateField]).length === 0) delete filter[dateField];
    }

    const subscriptions = await Subscription.find(filter).sort({ nextBillingDate: 1 });
    sendSuccess(res, subscriptions);
  } catch (error) {
    next(error);
  }
}

export async function getSubscription(req: Request, res: Response, next: NextFunction) {
  try {
    const sub = await Subscription.findOne({ _id: req.params.id, userId: req.userId });
    if (!sub) {
      throw new ApiError(404, "Subscription not found");
    }
    sendSuccess(res, sub);
  } catch (error) {
    next(error);
  }
}

export async function createSubscription(req: Request, res: Response, next: NextFunction) {
  try {
    const { name, provider, category, amount, currency, billingCycle, nextBillingDate, status, trialEndDate } = req.body;

    const subCurrency = currency || "USD";
    const sub = await Subscription.create({
      userId: req.userId,
      name,
      provider,
      category: category || "other",
      amount: parseFloat(amount),
      currency: subCurrency,
      billingCycle,
      nextBillingDate: new Date(nextBillingDate),
      status: status || "active",
      trialEndDate: trialEndDate ? new Date(trialEndDate) : null,
      priceHistory: initialPriceHistory(parseFloat(amount), subCurrency),
    });

    // Budget caps: if this new sub pushes category over cap, email + notification
    if (req.userId) {
      checkAndAlertBudgets(req.userId as string).catch(() => {});
    }

    sendSuccess(res, sub, 201);
  } catch (error) {
    next(error);
  }
}

export async function updateSubscription(req: Request, res: Response, next: NextFunction) {
  try {
    const sub = await Subscription.findOne({ _id: req.params.id, userId: req.userId });
    if (!sub) {
      throw new ApiError(404, "Subscription not found");
    }

    // Snapshot pre-update values before findByIdAndUpdate touches the doc
    const prev = {
      name: sub.name,
      amount: sub.amount,
      currency: sub.currency,
      billingCycle: sub.billingCycle,
      status: sub.status,
      priceHistory: [...((sub.priceHistory as any[]) || [])],
    };
    const { name, provider, category, amount, currency, billingCycle, nextBillingDate, status, trialEndDate } = req.body;
    const update: Record<string, any> = {};
    if (name !== undefined) update.name = name;
    if (provider !== undefined) update.provider = provider;
    if (category !== undefined) update.category = category;
    if (amount !== undefined) update.amount = parseFloat(amount);
    if (currency !== undefined) update.currency = currency;
    if (billingCycle !== undefined) update.billingCycle = billingCycle;
    if (nextBillingDate !== undefined) update.nextBillingDate = new Date(nextBillingDate);
    if (status !== undefined) update.status = status;
    if (trialEndDate !== undefined) update.trialEndDate = trialEndDate ? new Date(trialEndDate) : null;

    // Price-hike detection: compare against the previous amount, extend
    // price history on any change, notify only on an increase.
    let notification: { type: string; title: string; message: string } | null = null;
    if (amount !== undefined) {
      const newAmount = parseFloat(amount);
      const newCurrency = currency !== undefined ? currency : prev.currency;
      const result = applyAmountChange({
        name: prev.name,
        prevAmount: prev.amount,
        prevCurrency: prev.currency,
        newAmount,
        newCurrency,
        history: prev.priceHistory,
        source: "manual",
      });
      update.priceHistory = result.history;
      notification = result.notification;
    }

    const updated = await Subscription.findByIdAndUpdate(req.params.id, update, { new: true });

    if (notification && req.userId) {
      await notifyPriceChange(req.userId, notification);
    }

    // Savings counter: log the normalized monthly amount the first time a
    // subscription enters a cancelled/paused state. Reactivating (or later
    // edits while already in a savings state) do not create new entries.
    if (
      status !== undefined &&
      !SAVINGS_STATUSES.includes(prev.status) &&
      SAVINGS_STATUSES.includes(status) &&
      req.userId
    ) {
      await SavingsLog.create({
        userId: req.userId,
        subscriptionId: sub._id,
        name: prev.name,
        amount: monthlyEquivalent(prev.amount, prev.billingCycle),
        currency: prev.currency,
        status,
        date: new Date(),
      });
    }

    if (req.userId) {
      checkAndAlertBudgets(req.userId as string).catch(() => {});
    }

    sendSuccess(res, updated);
  } catch (error) {
    next(error);
  }
}

export async function deleteSubscription(req: Request, res: Response, next: NextFunction) {
  try {
    const sub = await Subscription.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    if (!sub) {
      throw new ApiError(404, "Subscription not found");
    }
    if (req.userId) {
      // Deletion can still leave other categories over cap (e.g., after bulk ops), re-check
      checkAndAlertBudgets(req.userId as string).catch(() => {});
    }
    sendSuccess(res, { message: "Subscription deleted" });
  } catch (error) {
    next(error);
  }
}
