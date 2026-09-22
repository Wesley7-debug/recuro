import {
  normalizeMerchant,
  merchantSimilarity,
  isExcludedMerchant,
  getNonSubscriptionCategory,
  getKnownSubscriptionCategory,
} from "./merchantNormalization.service";
import {
  type ParsedTransaction,
  type DetectionResult,
  type DetectionClassification,
  type BillingCycle,
  CADENCE_WINDOWS,
} from "./types";

/**
 * Legacy type kept for backward compatibility with controllers
 * that still reference DetectedRecurring.
 */
export type DetectedRecurring = {
  name: string;
  provider: string;
  amount: number;
  currency: string;
  billingCycle: BillingCycle;
  occurrences: number;
  lastDate: Date;
  avgIntervalDays: number;
  confidence: number;
};

// ─── Grouping ───────────────────────────────────────────────────────────

function groupByMerchant(
  transactions: ParsedTransaction[],
): Map<string, ParsedTransaction[]> {
  const groups = new Map<string, ParsedTransaction[]>();

  for (const tx of transactions) {
    if (tx.type !== "debit") continue;
    if (tx.status === "failed") continue;
    if (tx.amount <= 0) continue;

    const normalized = normalizeMerchant(tx.merchant);
    let matched = false;

    for (const [key, group] of groups) {
      const sim = merchantSimilarity(tx.merchant, group[0].merchant);
      const sameCurrency = tx.currency === group[0].currency;
      const amountDiff =
        Math.abs(tx.amount - group[0].amount) / Math.max(group[0].amount, 1);

      if (
        (normalized.toLowerCase() === key.toLowerCase() || sim > 0.7) &&
        sameCurrency &&
        amountDiff < 0.25
      ) {
        group.push(tx);
        matched = true;
        break;
      }
    }

    if (!matched) {
      groups.set(normalized, [tx]);
    }
  }

  return groups;
}

// ─── Cadence detection ──────────────────────────────────────────────────

type CadenceMatch = {
  cycle: BillingCycle;
  matchingIntervals: number;
  totalIntervals: number;
  ratio: number;
};

/**
 * Determine which cadence (if any) the intervals best match.
 * Requires a strict majority of intervals to fall within a single
 * cadence window.
 *
 * Returns null if no cadence has >= 50% matching intervals.
 */
function detectCadence(intervals: number[]): CadenceMatch | null {
  if (intervals.length === 0) return null;

  const cycles: BillingCycle[] = ["weekly", "monthly", "quarterly", "yearly"];
  let best: CadenceMatch | null = null;

  for (const cycle of cycles) {
    const { min, max } = CADENCE_WINDOWS[cycle];
    let matching = 0;
    for (const interval of intervals) {
      if (interval >= min && interval <= max) {
        matching++;
      }
    }
    const ratio = matching / intervals.length;
    if (ratio > 0.5 && (!best || ratio > best.ratio)) {
      best = { cycle, matchingIntervals: matching, totalIntervals: intervals.length, ratio };
    }
  }

  return best;
}

// ─── Amount consistency ─────────────────────────────────────────────────

/**
 * Calculate how consistent the amounts are.
 * Returns a value between 0 and 1 (1 = perfectly consistent).
 */
function amountConsistency(amounts: number[]): number {
  if (amounts.length <= 1) return 1;
  const avg = amounts.reduce((a, b) => a + b, 0) / amounts.length;
  if (avg === 0) return 0;
  const variance =
    amounts.reduce((sum, a) => sum + Math.abs(a - avg) / avg, 0) /
    amounts.length;
  // variance 0 → 1.0, variance 0.25 → 0.0
  return Math.max(0, 1 - variance * 4);
}

// ─── Confidence scoring ─────────────────────────────────────────────────

const SCORE_WEIGHTS = {
  MERCHANT_CONSISTENCY: 30,
  CADENCE_CONSISTENCY: 30,
  AMOUNT_CONSISTENCY: 15,
  MINIMUM_EVIDENCE: 10,
  KNOWN_SUBSCRIPTION: 10,
  NON_SUBSCRIPTION_PENALTY: -50,
  EXCLUDED_PENALTY: -100,
} as const;

const CONFIDENCE_THRESHOLDS = {
  STRONG: 80,
  CANDIDATE: 65,
} as const;

function calculateConfidence(
  txCount: number,
  cadenceMatch: CadenceMatch | null,
  amountScore: number,
  isKnownSubscription: boolean,
  isNonSubscription: boolean,
  isExcluded: boolean,
): { score: number; reasons: string[] } {
  let score = 0;
  const reasons: string[] = [];

  // --- Exclusion (immediate reject) ---
  if (isExcluded) {
    reasons.push("Excluded merchant (fees, bank charges, etc.)");
    return { score: 0, reasons };
  }

  // --- Non-subscription merchant penalty ---
  if (isNonSubscription) {
    score += SCORE_WEIGHTS.NON_SUBSCRIPTION_PENALTY;
    reasons.push("Known non-subscription merchant category");
  }

  // --- Merchant consistency ---
  if (txCount >= 3) {
    score += SCORE_WEIGHTS.MERCHANT_CONSISTENCY;
    reasons.push("Three or more transactions from same merchant");
  } else if (txCount === 2) {
    const partial = Math.round(SCORE_WEIGHTS.MERCHANT_CONSISTENCY * 0.7);
    score += partial;
    reasons.push("Two transactions from same merchant");
  }

  // --- Cadence consistency ---
  if (cadenceMatch) {
    if (cadenceMatch.ratio >= 0.8) {
      score += SCORE_WEIGHTS.CADENCE_CONSISTENCY;
      reasons.push(
        `Payment interval fits ${cadenceMatch.cycle} cadence (${cadenceMatch.matchingIntervals}/${cadenceMatch.totalIntervals} intervals match)`,
      );
    } else if (cadenceMatch.ratio >= 0.6) {
      const partial = Math.round(SCORE_WEIGHTS.CADENCE_CONSISTENCY * 0.7);
      score += partial;
      reasons.push(
        `Partial ${cadenceMatch.cycle} cadence match (${cadenceMatch.matchingIntervals}/${cadenceMatch.totalIntervals})`,
      );
    } else {
      reasons.push("Payment intervals are inconsistent");
    }
  } else {
    reasons.push("No consistent billing cadence detected");
  }

  // --- Amount consistency ---
  const amountPoints = Math.round(SCORE_WEIGHTS.AMOUNT_CONSISTENCY * amountScore);
  score += amountPoints;
  if (amountScore > 0.9) {
    reasons.push("Amounts are highly consistent");
  } else if (amountScore > 0.7) {
    reasons.push("Amounts are mostly consistent");
  } else {
    reasons.push("Amounts vary significantly");
  }

  // --- Minimum evidence ---
  if (txCount >= 3) {
    score += SCORE_WEIGHTS.MINIMUM_EVIDENCE;
    reasons.push("Sufficient transaction history");
  } else if (txCount === 2) {
    const partial = Math.round(SCORE_WEIGHTS.MINIMUM_EVIDENCE * 0.5);
    score += partial;
    reasons.push("Limited transaction history (2 payments)");
  }

  // --- Known subscription merchant bonus ---
  if (isKnownSubscription) {
    score += SCORE_WEIGHTS.KNOWN_SUBSCRIPTION;
    reasons.push("Known subscription merchant");
  }

  return { score: Math.max(0, Math.min(score, 100)), reasons };
}

// ─── Main detection function ────────────────────────────────────────────

export function detectSubscriptions(
  transactions: ParsedTransaction[],
): DetectionResult[] {
  const groups = groupByMerchant(transactions);
  const results: DetectionResult[] = [];

  for (const [merchantKey, txs] of groups) {
    const reasons: string[] = [];
    const sorted = [...txs].sort(
      (a, b) => a.date.getTime() - b.date.getTime(),
    );
    const canonical = normalizeMerchant(sorted[0].merchant);

    // --- Step 1: Hard exclusion check ---
    const excluded = isExcludedMerchant(canonical);
    if (excluded) {
      results.push({
        merchant: canonical,
        classification: "excluded",
        confidence: 0,
        billingCycle: null,
        transactions: sorted,
        reasons: ["Excluded merchant (fees, bank charges, etc.)"],
      });
      continue;
    }

    // --- Step 2: Non-subscription merchant check ---
    const nonSubCategory = getNonSubscriptionCategory(canonical);

    // --- Step 3: Calculate intervals ---
    const intervals: number[] = [];
    for (let i = 1; i < sorted.length; i++) {
      const diffMs =
        sorted[i].date.getTime() - sorted[i - 1].date.getTime();
      intervals.push(diffMs / (1000 * 60 * 60 * 24));
    }

    // --- Step 4: Detect cadence ---
    const cadenceMatch = detectCadence(intervals);

    // --- Step 5: Amount consistency ---
    const amounts = sorted.map((t) => t.amount);
    const amountScore = amountConsistency(amounts);

    // --- Step 6: Known subscription check ---
    const knownSubCategory = getKnownSubscriptionCategory(canonical);

    // --- Step 7: Calculate confidence ---
    const { score, reasons: scoreReasons } = calculateConfidence(
      sorted.length,
      cadenceMatch,
      amountScore,
      !!knownSubCategory,
      !!nonSubCategory,
      false, // already handled excluded above
    );

    // Add merchant identity reason
    reasons.push("Same normalized merchant");

    // Add successful debit reason
    const successCount = sorted.filter((t) => t.status === "success").length;
    if (successCount === sorted.length) {
      reasons.push(`${successCount} successful payment${sorted.length > 1 ? "s" : ""}`);
    } else {
      reasons.push(`${successCount}/${sorted.length} successful payments`);
    }

    reasons.push(...scoreReasons);

    // --- Step 8: Classify ---
    let classification: DetectionClassification;
    if (nonSubCategory) {
      classification = "recurring_non_subscription";
    } else if (score >= CONFIDENCE_THRESHOLDS.STRONG) {
      classification = "subscription_candidate";
    } else if (score >= CONFIDENCE_THRESHOLDS.CANDIDATE) {
      classification = "subscription_candidate";
    } else {
      classification = "recurring_non_subscription";
    }

    const avgInterval =
      intervals.length > 0
        ? intervals.reduce((a, b) => a + b, 0) / intervals.length
        : null;

    results.push({
      merchant: canonical,
      classification,
      confidence: score,
      billingCycle: cadenceMatch?.cycle ?? null,
      transactions: sorted,
      reasons,
    });
  }

  return results.sort((a, b) => b.confidence - a.confidence);
}

/**
 * Legacy wrapper: returns DetectedRecurring[] for any code that
 * still references the old detectRecurring function.
 */
export function detectRecurring(
  transactions: ParsedTransaction[],
): DetectedRecurring[] {
  const results = detectSubscriptions(transactions);
  return results
    .filter((r) => r.classification === "subscription_candidate")
    .map((r) => ({
      name: r.merchant,
      provider: r.merchant,
      amount:
        Math.round(
          (r.transactions.reduce((s, t) => s + t.amount, 0) /
            r.transactions.length) *
            100,
        ) / 100,
      currency: r.transactions[0].currency,
      billingCycle: r.billingCycle ?? "monthly",
      occurrences: r.transactions.length,
      lastDate: r.transactions[r.transactions.length - 1].date,
      avgIntervalDays:
        r.transactions.length > 1
          ? Math.round(
              (() => {
                const sorted = [...r.transactions].sort(
                  (a, b) => a.date.getTime() - b.date.getTime(),
                );
                const intervals: number[] = [];
                for (let i = 1; i < sorted.length; i++) {
                  intervals.push(
                    (sorted[i].date.getTime() -
                      sorted[i - 1].date.getTime()) /
                      (1000 * 60 * 60 * 24),
                  );
                }
                return intervals.reduce((a, b) => a + b, 0) / intervals.length;
              })(),
            )
          : 0,
      confidence: r.confidence,
    }));
}

export function predictNextDate(dates: Date[], cycle: string): Date {
  const sorted = [...dates].sort((a, b) => b.getTime() - a.getTime());
  const next = new Date(sorted[0]);
  switch (cycle) {
    case "weekly":
      next.setDate(next.getDate() + 7);
      break;
    case "monthly":
      next.setMonth(next.getMonth() + 1);
      break;
    case "quarterly":
      next.setMonth(next.getMonth() + 3);
      break;
    case "yearly":
      next.setFullYear(next.getFullYear() + 1);
      break;
  }
  return next;
}
