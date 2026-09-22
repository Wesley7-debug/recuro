import { Request, Response, NextFunction } from "express";
import { ApiError } from "../utils/apiError";
import { sendError } from "../utils/apiResponse";

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ApiError) {
    return sendError(res, err.message, err.statusCode);
  }
  console.error("Unhandled error:", err);
  return sendError(res, "Internal server error", 500);
}
