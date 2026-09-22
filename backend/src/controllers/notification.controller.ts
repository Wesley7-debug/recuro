import { Request, Response, NextFunction } from "express";
import { Notification } from "../models/Notification";
import { sendSuccess } from "../utils/apiResponse";

export async function listNotifications(req: Request, res: Response, next: NextFunction) {
  try {
    const notifications = await Notification.find({ userId: req.userId })
      .sort({ createdAt: -1 })
      .limit(50);
    sendSuccess(res, notifications);
  } catch (error) {
    next(error);
  }
}

export async function markAsRead(req: Request, res: Response, next: NextFunction) {
  try {
    await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { read: true }
    );
    sendSuccess(res, { message: "Notification marked as read" });
  } catch (error) {
    next(error);
  }
}

export async function markAllAsRead(req: Request, res: Response, next: NextFunction) {
  try {
    await Notification.updateMany(
      { userId: req.userId, read: false },
      { read: true }
    );
    sendSuccess(res, { message: "All notifications marked as read" });
  } catch (error) {
    next(error);
  }
}
