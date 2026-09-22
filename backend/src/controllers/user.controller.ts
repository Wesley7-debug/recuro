import { Request, Response, NextFunction } from "express";
import { User } from "../models/User";
import { sendSuccess } from "../utils/apiResponse";

export async function updateProfile(req: Request, res: Response, next: NextFunction) {
  try {
    const { name, email, preferred_currency, email_notifications_enabled } = req.body;
    const update: Record<string, any> = {};
    if (name !== undefined) update.name = name;
    if (email !== undefined) update.email = email;
    if (preferred_currency !== undefined) update.preferred_currency = preferred_currency;
    if (email_notifications_enabled !== undefined) update.email_notifications_enabled = email_notifications_enabled;

    const user = await User.findByIdAndUpdate(req.userId, update, { new: true })
      .select("name email preferred_currency email_notifications_enabled provider createdAt updatedAt");

    sendSuccess(res, {
      id: user?._id,
      name: user?.name,
      email: user?.email,
      preferred_currency: user?.preferred_currency,
      email_notifications_enabled: user?.email_notifications_enabled,
      provider: user?.provider,
      created_at: user?.createdAt,
      updated_at: user?.updatedAt,
    });
  } catch (error) {
    next(error);
  }
}
