import { User } from "../models/User";
import {
  extractRawText,
  parseStatementText,
  toCanonicalTransaction,
} from "./pdfParser.service";
import { detectSubscriptions } from "./recurringDetection.service";
import { normalizeMerchant } from "./merchantNormalization.service";
import { type ParsedTransaction, type DetectionClassification, type DetectedSub } from "./types";
export type { DetectedSub };
import { EmailService } from "../utils/email";
import { env } from "../config/env";

function mergeTransactions(
  primary: ParsedTransaction[],
  extra: ParsedTransaction[],
): ParsedTransaction[] {
  const seen = new Set<string>();
  const merged: ParsedTransaction[] = [];
  for (const tx of [...primary, ...extra]) {
    const key = `${tx.date.toISOString().slice(0, 10)}|${tx.amount}|${tx.currency}|${normalizeMerchant(tx.merchant).toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(tx);
  }
  return merged;
}

async function tryParseWithAI(rawText: string): Promise<ParsedTransaction[]> {
  if (!env.GEMINI_API_KEY || rawText.length < 30) return [];
  try {
    const { parseWithAI } = await import("./aiParser.service");
    return await parseWithAI(rawText);
  } catch (err: any) {
    console.error("AI parsing skipped:", err.message);
    return [];
  }
}

async function tryDetectWithAI(
  transactions: ParsedTransaction[],
): Promise<DetectedSub[] | null> {
  if (!env.GEMINI_API_KEY || transactions.length === 0) return null;

  try {
    const { detectWithAI } = await import("./aiParser.service");
    const result = await detectWithAI(transactions);
    return result.map((s) => ({
      name: normalizeMerchant(s.name),
      provider: normalizeMerchant(s.provider || s.name),
      amount: s.amount,
      currency: s.currency,
      billingCycle: s.billingCycle,
      occurrences: s.occurrences,
      lastDate: s.lastDate,
      confidence:
        s.confidence === "high" ? 85 : s.confidence === "medium" ? 60 : 35,
      status: "new" as const,
      classification: "subscription_candidate" as DetectionClassification,
      reasons: ["AI-detected subscription pattern"],
    }));
  } catch (err: any) {
    console.error("AI detection skipped:", err.message);
    return null;
  }
}

export async function processStatement(
  _userId: string,
  fileBuffer: Buffer,
): Promise<{ transactionsFound: number; detected: DetectedSub[] }> {
  const rawText = await extractRawText(fileBuffer);

  const parsedRaw = parseStatementText(rawText);
  const parsed = parsedRaw.map(toCanonicalTransaction);

  const aiParsed = await tryParseWithAI(rawText);

  const transactions = mergeTransactions(parsed, aiParsed);

  const detectionResults = detectSubscriptions(transactions);

  let detected: DetectedSub[] = detectionResults.map((r) => {
    const avgAmount =
      r.transactions.reduce((s, t) => s + t.amount, 0) /
      r.transactions.length;
    return {
      name: r.merchant,
      provider: r.merchant,
      amount: Math.round(avgAmount * 100) / 100,
      currency: r.transactions[0].currency,
      billingCycle: r.billingCycle ?? "unknown",
      occurrences: r.transactions.length,
      lastDate: r.transactions[r.transactions.length - 1].date.toISOString(),
      confidence: r.confidence,
      status: "new" as const,
      classification: r.classification,
      reasons: r.reasons,
    };
  });

  const aiDetected = await tryDetectWithAI(transactions);
  if (aiDetected && aiDetected.length > 0) {
    const existingNames = new Set(
      detected.map((d) => normalizeMerchant(d.name).toLowerCase()),
    );
    for (const ai of aiDetected) {
      const normName = normalizeMerchant(ai.name).toLowerCase();
      if (!existingNames.has(normName)) {
        detected.push(ai);
        existingNames.add(normName);
      }
    }
  }

  detected.sort((a, b) => b.confidence - a.confidence);

  const user = await User.findById(_userId);
  if (user?.email_notifications_enabled) {
    const candidates = detected.filter(
      (d) => d.classification === "subscription_candidate",
    );
    for (const sub of candidates.slice(0, 3)) {
      await EmailService.sendSubscriptionDetectedEmail(
        user.email,
        sub.name,
        sub.amount,
        sub.currency,
        sub.billingCycle,
      );
    }
  }

  return { transactionsFound: transactions.length, detected };
}
