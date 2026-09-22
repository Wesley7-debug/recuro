import { Request, Response, NextFunction } from "express";
import { ApiError } from "../utils/apiError";

declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  if (!req.isAuthenticated()) {
    return next(new ApiError(401, "Not authenticated"));
  }
  const user = req.user as any;
  req.userId = user._id.toString();
  next();
}
