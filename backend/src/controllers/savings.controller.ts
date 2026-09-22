import { Request, Response, NextFunction } from "express";
import { SavingsLog } from "../models/SavingsLog";
import { User } from "../models/User";
import { getExchangeRate, convertAmount } from "../services/exchangeRate.service";
import { round2 } from "../utils/money";
import { sendSuccess } from "../utils/apiResponse";

export async function getSavings(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await User.findById(req.userId);
    const preferred = user?.preferred_currency || "NGN";

    const entries = await SavingsLog.find({ userId: req.userId }).sort({
      date: -1,
    });

    let total = 0;
    for (const entry of entries) {
      if (entry.currency === preferred) {
        total += entry.amount;
      } else {
        const rate = await getExchangeRate(entry.currency, preferred);
        total += convertAmount(entry.amount, entry.currency, preferred, rate);
      }
    }

    sendSuccess(res, {
      total: round2(total),
      currency: preferred,
      entries,
    });
  } catch (error) {
    next(error);
  }
}
