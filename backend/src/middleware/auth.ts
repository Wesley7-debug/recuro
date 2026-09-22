import { Request, Response, NextFunction } from "express";
import { ApiError } from "../utils/apiError";
import { verifyAuthToken } from "../utils/authToken";
import { User } from "../models/User";

declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

    if (bearerToken) {
      const payload = verifyAuthToken(bearerToken);
      if (!payload.sub) {
        return next(new ApiError(401, "Not authenticated"));
      }

      const user = await User.findById(payload.sub);
      if (!user) {
        return next(new ApiError(401, "Not authenticated"));
      }

      req.user = user;
      req.userId = user._id.toString();
      return next();
    }

    if (!req.isAuthenticated()) {
      return next(new ApiError(401, "Not authenticated"));
    }

    const user = req.user as any;
    req.userId = user._id.toString();
    next();
  } catch {
    next(new ApiError(401, "Not authenticated"));
  }
}
