import { Request, Response, NextFunction } from "express";
import { User } from "../models/User";
import { checkAndAlertBudgets } from "../services/budgetAlert.service";
import { sendSuccess } from "../utils/apiResponse";

export async function updateProfile(req: Request, res: Response, next: NextFunction) {
  try {
    const { name, email, preferred_currency, email_notifications_enabled, budgetCaps, budget_caps } = req.body;
    const update: Record<string, any> = {};
    if (name !== undefined) update.name = name;
    if (email !== undefined) update.email = email;
    if (preferred_currency !== undefined) update.preferred_currency = preferred_currency;
    if (email_notifications_enabled !== undefined) update.email_notifications_enabled = email_notifications_enabled;
    const incomingCaps = budgetCaps !== undefined ? budgetCaps : budget_caps;
    if (incomingCaps !== undefined) {
      // sanitize: keep only known categories, coerce to numbers, drop invalid/negative
      const sanitized: Record<string, number> = {};
      for (const [k, v] of Object.entries(incomingCaps as Record<string, any>)) {
        const n = Number(v);
        if (!Number.isNaN(n) && n >= 0) sanitized[k] = n;
        if (v === null || v === 0) sanitized[k] = 0;
      }
      // allow clearing a cap by setting 0 or null -> delete key (0 means no cap)
      // keep 0 as explicit deletion: remove keys where value === 0
      for (const k of Object.keys(sanitized)) {
        if (sanitized[k] === 0) delete sanitized[k];
      }
      update.budgetCaps = sanitized;
    }

    const user = await User.findByIdAndUpdate(req.userId, update, { new: true }) as any;

    if (incomingCaps !== undefined && req.userId) {
      checkAndAlertBudgets(req.userId as string).catch(() => {});
    }

    sendSuccess(res, {
      id: user?._id,
      name: user?.name,
      email: user?.email,
      preferred_currency: user?.preferred_currency,
      email_notifications_enabled: user?.email_notifications_enabled,
      budgetCaps: user?.budgetCaps || {},
      budget_caps: user?.budgetCaps || {},
      provider: user?.provider,
      created_at: user?.createdAt,
      updated_at: user?.updatedAt,
    });
  } catch (error) {
    next(error);
  }
}
