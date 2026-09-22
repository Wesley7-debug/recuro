/**
 * Canonical transaction shape. Every parser (deterministic and AI) MUST
 * produce this exact structure so downstream grouping/detection stays
 * independent of any individual parser's output format.
 */
export type ParsedTransaction = {
  date: Date;
  merchant: string;
  amount: number;
  currency: string;
  type: "debit" | "credit";
  status: "success" | "failed";
};

/**
 * Deterministic classification for every merchant group.
 * - "subscription_candidate": strong evidence of a recurring subscription
 * - "recurring_non_subscription": repeated merchant but NOT a subscription
 * - "excluded": hard-excluded (fees, noise, etc.)
 */
export type DetectionClassification =
  | "subscription_candidate"
  | "recurring_non_subscription"
  | "excluded";

/**
 * Cadence windows (in days) for validating billing intervals.
 * Each cadence has a min/max range. Intervals must fall within at
 * least one pair of consecutive intervals to match a cadence.
 */
export type BillingCycle = "weekly" | "monthly" | "quarterly" | "yearly";

export const CADENCE_WINDOWS: Record<BillingCycle, { min: number; max: number }> = {
  weekly:    { min: 5,  max: 10 },
  monthly:   { min: 25, max: 35 },
  quarterly: { min: 80, max: 100 },
  yearly:    { min: 340, max: 390 },
};

/**
 * The full output of the deterministic detection engine.
 */
export type DetectionResult = {
  merchant: string;
  classification: DetectionClassification;
  confidence: number;
  billingCycle: BillingCycle | null;
  transactions: ParsedTransaction[];
  reasons: string[];
};

/**
 * API-facing detected subscription shape (what gets sent to the frontend).
 */
export type DetectedSub = {
  name: string;
  provider: string;
  amount: number;
  currency: string;
  billingCycle: string;
  occurrences: number;
  lastDate: string;
  confidence: number;
  status: "new" | "existing";
  classification: DetectionClassification;
  reasons: string[];
};
