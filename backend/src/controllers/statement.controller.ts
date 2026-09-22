import { Request, Response, NextFunction } from "express";
import multer from "multer";
import path from "path";
import crypto from "crypto";
import { Subscription } from "../models/Subscription";
import {
  processStatement,
  type DetectedSub,
} from "../services/statementProcessor.service";
import { predictNextDate } from "../services/recurringDetection.service";
import {
  normalizeMerchant,
  merchantSimilarity,
} from "../services/merchantNormalization.service";
import {
  applyAmountChange,
  initialPriceHistory,
  notifyPriceChange,
} from "../services/priceHistory.service";
import { checkAndAlertBudgets } from "../services/budgetAlert.service";
import { ApiError } from "../utils/apiError";
import { sendSuccess } from "../utils/apiResponse";

const MAX_FILE_SIZE = 10 * 1024 * 1024;

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new ApiError(400, "Only PDF files are accepted"));
    }
  },
});

export const uploadMiddleware = upload.single("statement");

const VALID_BILLING_CYCLES = [
  "weekly",
  "monthly",
  "quarterly",
  "yearly",
] as const;
type BillingCycle = (typeof VALID_BILLING_CYCLES)[number];

/**
 * Normalize a detected billing cycle to a value the Subscription schema
 * accepts. A detection can return "unknown" (or another irregular value)
 * when no cadence could be determined — default to "monthly", the most
 * common subscription cadence, instead of storing an invalid cycle.
 */
function normalizeBillingCycle(cycle: string | null | undefined): BillingCycle {
  return (VALID_BILLING_CYCLES as readonly string[]).includes(cycle as string)
    ? (cycle as BillingCycle)
    : "monthly";
}

// In-memory store for detection results (keyed by random ID)
const detectionStore = new Map<
  string,
  { userId: string; detected: DetectedSub[]; createdAt: number }
>();
const DETECTION_TTL = 60 * 60 * 1000; // 1 hour

// Cleanup expired entries every 10 minutes
setInterval(
  () => {
    const now = Date.now();
    for (const [key, entry] of detectionStore) {
      if (now - entry.createdAt > DETECTION_TTL) {
        detectionStore.delete(key);
      }
    }
  },
  10 * 60 * 1000,
);

export async function uploadStatement(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    if (!req.file) {
      throw new ApiError(400, "No file uploaded");
    }

    const result = await processStatement(req.userId!, req.file.buffer);

    // Mark existing subscriptions
    const existingSubs = await Subscription.find({ userId: req.userId });
    for (const sub of result.detected) {
      const normName = normalizeMerchant(sub.name).toLowerCase();
      const isDuplicate = existingSubs.some((es) => {
        const esNorm = normalizeMerchant(es.name).toLowerCase();
        const esProvider = normalizeMerchant(es.provider).toLowerCase();
        const simA = merchantSimilarity(sub.name, es.name);
        const simB = merchantSimilarity(sub.name, es.provider);
        return (
          esNorm === normName ||
          esProvider === normName ||
          simA > 0.7 ||
          simB > 0.7
        );
      });
      sub.status = isDuplicate ? "existing" : "new";
    }

    // Store in memory for confirm step
    const detectionId = crypto.randomBytes(16).toString("hex");
    detectionStore.set(detectionId, {
      userId: req.userId!,
      detected: result.detected,
      createdAt: Date.now(),
    });

    sendSuccess(
      res,
      {
        id: detectionId,
        status: "completed",
        filename: req.file.originalname,
        transactionsFound: result.transactionsFound,
        detected: result.detected,
      },
      201,
    );
  } catch (error) {
    next(error);
  }
}

export async function addDetectedSubscriptions(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { statementId, indices } = req.body as {
      statementId: string;
      indices: number[];
    };

    if (!statementId || !Array.isArray(indices) || indices.length === 0) {
      throw new ApiError(400, "statementId and indices array are required");
    }

    const entry = detectionStore.get(statementId);
    if (!entry || entry.userId !== req.userId) {
      throw new ApiError(404, "Detection results not found or expired");
    }

    const detected = entry.detected;
    const added: string[] = [];
    const updated: string[] = [];

    const existingSubs = await Subscription.find({ userId: req.userId });

    for (const idx of indices) {
      const sub = detected[idx];
      if (!sub) continue;

      const subName = normalizeMerchant(sub.name);

      const existing = existingSubs.find((es) => {
        const esNorm = normalizeMerchant(es.name).toLowerCase();
        const esProvider = normalizeMerchant(es.provider).toLowerCase();
        const targetNorm = subName.toLowerCase();
        const simA = merchantSimilarity(sub.name, es.name);
        const simB = merchantSimilarity(sub.name, es.provider);
        return (
          esNorm === targetNorm ||
          esProvider === targetNorm ||
          simA > 0.7 ||
          simB > 0.7
        );
      });

      if (existing) {
        // Price-hike detection: compare the re-parsed amount against the
        // previously stored one before overwriting.
        const prevAmount = existing.amount;
        const prevCurrency = existing.currency;
        const prevHistory = [...((existing.priceHistory as any[]) || [])];

        existing.amount = sub.amount;
        existing.currency = sub.currency;
        existing.billingCycle = normalizeBillingCycle(sub.billingCycle);
        existing.nextBillingDate = predictNextDate(
          [new Date(sub.lastDate)],
          existing.billingCycle,
        );

        const result = applyAmountChange({
          name: existing.name,
          prevAmount,
          prevCurrency,
          newAmount: sub.amount,
          newCurrency: sub.currency,
          history: prevHistory,
          source: "statement",
        });
        existing.priceHistory = result.history as any;
        await existing.save();

        if (result.notification && req.userId) {
          await notifyPriceChange(req.userId, result.notification);
        }

        updated.push(existing.name || existing.provider);
      } else {
        const cycle = normalizeBillingCycle(sub.billingCycle);
        const nextDate = predictNextDate([new Date(sub.lastDate)], cycle);
        await Subscription.create({
          userId: req.userId,
          name: sub.name,
          provider: sub.provider,
          category: "other",
          amount: sub.amount,
          currency: sub.currency,
          billingCycle: cycle,
          nextBillingDate: nextDate,
          status: "active",
          priceHistory: initialPriceHistory(sub.amount, sub.currency),
        });

        added.push(sub.name);
      }
    }

    // Cleanup
    detectionStore.delete(statementId);

    if (req.userId) {
      checkAndAlertBudgets(req.userId as string).catch(() => {});
    }

    sendSuccess(res, { added, updated, count: added.length + updated.length });
  } catch (error) {
    next(error);
  }
}
