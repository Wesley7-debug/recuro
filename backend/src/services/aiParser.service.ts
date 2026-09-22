import { GoogleGenerativeAI } from "@google/generative-ai";
import { env } from "../config/env";
import { type ParsedTransaction } from "./types";

const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);

const EXTRACTION_PROMPT = `You are a bank statement parser. Extract every transaction from the text below.

Return ONLY a valid JSON array. No markdown. No explanation. Each object must have:
- "date": ISO date string (YYYY-MM-DD)
- "description": merchant/description text
- "amount": positive number
- "currency": NGN, USD, EUR, or GBP
- "type": "debit" or "credit"

Rules:
- Include ALL transactions, not just recurring ones
- Negative amounts should be positive with type "debit"
- Deposits/refunds are type "credit"
- If currency symbol is not explicit, infer from context or default to NGN
- Clean up descriptions: remove extra whitespace, keep it readable

Statement text:
`;

const DETECTION_PROMPT = `You are a subscription detection expert. Given a list of transactions, identify which ones are likely recurring subscriptions.

Return ONLY a valid JSON array. No markdown. No explanation. Each object must have:
- "name": clean subscription name (e.g. "Netflix", "Spotify", "ChatGPT Plus")
- "provider": company/provider name
- "amount": typical charge amount
- "currency": NGN, USD, EUR, or GBP
- "billingCycle": "weekly", "monthly", "quarterly", or "yearly"
- "occurrences": number of times this charge appeared
- "lastDate": most recent charge date (YYYY-MM-DD)
- "confidence": "high", "medium", or "low"

Rules:
- Only flag transactions that appear 2+ times with similar amounts
- Group charges from the same merchant together
- Detect billing cycle from the interval between charges
- If a charge appears only once, skip it (not enough evidence)
- Be conservative: only flag what you are confident about
- Consider common subscription services (streaming, SaaS, gym, insurance, etc.)

Transactions:
`;

export async function parseWithAI(
  rawText: string,
): Promise<ParsedTransaction[]> {
  if (!env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY not configured");
  }

  const model = genAI.getGenerativeModel({ model: "gemini-3.6-flash" });

  const truncated = rawText.slice(0, 30000);
  const result = await model.generateContent(EXTRACTION_PROMPT + truncated);
  const response = result.response.text().trim();

  const jsonStr = response
    .replace(/```json\n?/g, "")
    .replace(/```\n?/g, "")
    .trim();
  const parsed = JSON.parse(jsonStr);

  if (!Array.isArray(parsed)) {
    throw new Error("AI did not return an array of transactions");
  }

  return parsed
    .map((t: any) => {
      const date = new Date(String(t.date || ""));
      return {
        date,
        merchant: String(t.description || t.merchant || "Unknown"),
        amount: Number(t.amount) || 0,
        currency: String(t.currency || "NGN"),
        type: (t.type === "credit" ? "credit" : "debit") as "debit" | "credit",
        status: (t.status === "failed" ? "failed" : "success") as
          | "success"
          | "failed",
      };
    })
    .filter((t: ParsedTransaction) => t.amount > 0 && !isNaN(t.date.getTime()));
}

export type DetectedSub = {
  name: string;
  provider: string;
  amount: number;
  currency: string;
  billingCycle: string;
  occurrences: number;
  lastDate: string;
  confidence: string;
};

export async function detectWithAI(
  transactions: ParsedTransaction[],
): Promise<DetectedSub[]> {
  if (!env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY not configured");
  }

  const model = genAI.getGenerativeModel({ model: "gemini-3.6-flash" });

  const txSummary = transactions
    .map(
      (t) =>
        `${t.date.toISOString().slice(0, 10)} | ${t.type.toUpperCase()} | ${t.currency} ${t.amount} | ${t.merchant}`,
    )
    .join("\n");

  const truncated = txSummary.slice(0, 25000);
  const result = await model.generateContent(DETECTION_PROMPT + truncated);
  const response = result.response.text().trim();

  const jsonStr = response
    .replace(/```json\n?/g, "")
    .replace(/```\n?/g, "")
    .trim();
  const parsed = JSON.parse(jsonStr);

  if (!Array.isArray(parsed)) {
    return [];
  }

  return parsed
    .map((s: any) => ({
      name: String(s.name || "Unknown"),
      provider: String(s.provider || s.name || "Unknown"),
      amount: Number(s.amount) || 0,
      currency: String(s.currency || "NGN"),
      billingCycle: String(s.billingCycle || "monthly"),
      occurrences: Number(s.occurrences) || 0,
      lastDate: String(s.lastDate || ""),
      confidence: String(s.confidence || "medium"),
    }))
    .filter((s: DetectedSub) => s.amount > 0 && s.occurrences >= 2);
}
