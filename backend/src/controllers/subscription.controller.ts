import { Request, Response, NextFunction } from "express";
import { Subscription } from "../models/Subscription";
import { ApiError } from "../utils/apiError";
import { sendSuccess } from "../utils/apiResponse";

export async function listSubscriptions(req: Request, res: Response, next: NextFunction) {
  try {
    const { search, status, category } = req.query;
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
    const { name, provider, category, amount, currency, billingCycle, nextBillingDate, status } = req.body;

    const sub = await Subscription.create({
      userId: req.userId,
      name,
      provider,
      category: category || "other",
      amount: parseFloat(amount),
      currency: currency || "USD",
      billingCycle,
      nextBillingDate: new Date(nextBillingDate),
      status: status || "active",
    });

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

    const { name, provider, category, amount, currency, billingCycle, nextBillingDate, status } = req.body;
    const update: Record<string, any> = {};
    if (name !== undefined) update.name = name;
    if (provider !== undefined) update.provider = provider;
    if (category !== undefined) update.category = category;
    if (amount !== undefined) update.amount = parseFloat(amount);
    if (currency !== undefined) update.currency = currency;
    if (billingCycle !== undefined) update.billingCycle = billingCycle;
    if (nextBillingDate !== undefined) update.nextBillingDate = new Date(nextBillingDate);
    if (status !== undefined) update.status = status;

    const updated = await Subscription.findByIdAndUpdate(req.params.id, update, { new: true });
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
    sendSuccess(res, { message: "Subscription deleted" });
  } catch (error) {
    next(error);
  }
}
