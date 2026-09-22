import { Request, Response, NextFunction } from "express";
import { ApiError } from "../utils/apiError";
import { sendError } from "../utils/apiResponse";

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction) {
  // eslint-disable-next-line no-console
  console.error("[errorHandler]", err);
  if (err instanceof ApiError) {
    return sendError(res, err.message, err.statusCode);
  }
  // In production hide details, but log them; for Render debug show message
  const isProd = process.env.NODE_ENV === "production";
  const msg = isProd ? "Internal server error" : err.message || "Internal server error";
  return sendError(res, msg, 500);
}
