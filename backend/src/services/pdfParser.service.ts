// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require("pdf-parse");
import { normalizeMerchant } from "./merchantNormalization.service";
import { type ParsedTransaction } from "./types";

/**
 * Parser output — deliberately richer than the canonical type used by the
 * detection engine. Keeping both `merchant_raw` and `merchant_normalized`
 * makes it possible to debug provider-matching without losing the original
 * descriptor text.
 */
export type ParsedStatementTransaction = {
  date: string; // ISO date, YYYY-MM-DD
  merchant_raw: string;
  merchant_normalized: string;
  amount: number;
  currency: string;
  type: "debit" | "credit";
  status: "success" | "failed";
};

const MONTHS: Record<string, number> = {
  jan: 0,
  feb: 1,
  mar: 2,
  apr: 3,
  may: 4,
  jun: 5,
  jul: 6,
  aug: 7,
  sep: 8,
  oct: 9,
  nov: 10,
  dec: 11,
};

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function isoDate(year: number, month: number, day: number): string | null {
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  return `${year}-${pad(month)}-${pad(day)}`;
}

type DateMatch = { iso: string; raw: string; index: number };

/** Order matters — ISO dates must be checked before day-first slash dates. */
const DATE_PATTERNS: {
  re: RegExp;
  build: (m: RegExpExecArray) => string | null;
}[] = [
  // 2025-03-12
  {
    re: /\b(\d{4})-(\d{1,2})-(\d{1,2})\b/,
    build: (m) => isoDate(Number(m[1]), Number(m[2]), Number(m[3])),
  },
  // 12/03/2025 or 12-03-2025 (day first)
  {
    re: /\b(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})\b/,
    build: (m) => {
      let year = Number(m[3]);
      if (year < 100) year += 2000;
      return isoDate(year, Number(m[2]), Number(m[1]));
    },
  },
  // 12 Mar 2025
  {
    re: /\b(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?,?\s+(\d{4})\b/i,
    build: (m) =>
      isoDate(
        Number(m[3]),
        MONTHS[m[2].toLowerCase().slice(0, 3)] + 1,
        Number(m[1]),
      ),
  },
  // Mar 12 2025
  {
    re: /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+(\d{1,2}),?\s+(\d{4})\b/i,
    build: (m) =>
      isoDate(
        Number(m[3]),
        MONTHS[m[1].toLowerCase().slice(0, 3)] + 1,
        Number(m[2]),
      ),
  },
];

function findDate(line: string): DateMatch | null {
  for (const { re, build } of DATE_PATTERNS) {
    const m = re.exec(line);
    if (m) {
      const iso = build(m);
      if (iso) return { iso, raw: m[0], index: m.index };
    }
  }
  return null;
}

function detectCurrency(text: string): string {
  if (/₦|NGN|naira/i.test(text)) return "NGN";
  if (/\$|USD/i.test(text)) return "USD";
  if (/€|EUR/i.test(text)) return "EUR";
  if (/£|GBP/i.test(text)) return "GBP";
  return "USD";
}

function normalizeAmount(raw: string): number | null {
  const n = parseFloat(raw.replace(/,/g, ""));
  if (isNaN(n) || n <= 0) return null;
  // Neutralize floating-point noise from PDF extraction (5.3000001 → 5.30)
  return Math.round(n * 100) / 100;
}

export function extractAmount(
  text: string,
): { amount: number; currency: string } | null {
  // Currency symbol before the number: ₦800, $5.30
  const symbolPatterns: { re: RegExp; cur: string }[] = [
    { re: /₦\s*([\d,]+(?:\.\d+)?)/, cur: "NGN" },
    { re: /\$\s*([\d,]+(?:\.\d+)?)/, cur: "USD" },
    { re: /€\s*([\d,]+(?:\.\d+)?)/, cur: "EUR" },
    { re: /£\s*([\d,]+(?:\.\d+)?)/, cur: "GBP" },
  ];
  for (const { re, cur } of symbolPatterns) {
    const m = text.match(re);
    if (m) {
      const amount = normalizeAmount(m[1]);
      if (amount !== null) return { amount, currency: cur };
    }
  }

  // Number followed by a currency code: "5.30 USD", "800 NGN"
  const after = text.match(/([\d,]+(?:\.\d+)?)\s*(NGN|USD|EUR|GBP)\b/i);
  if (after) {
    const amount = normalizeAmount(after[1]);
    if (amount !== null) return { amount, currency: after[2].toUpperCase() };
  }

  // Currency code followed by a number: "USD 5.30", "NGN 800"
  const before = text.match(/(NGN|USD|EUR|GBP)\s*([\d,]+(?:\.\d+)?)\b/i);
  if (before) {
    const amount = normalizeAmount(before[2]);
    if (amount !== null) return { amount, currency: before[1].toUpperCase() };
  }

  return null;
}

/**
 * Normalize common PDF-extraction artifacts before parsing:
 *  - '?' is frequently emitted in place of the naira symbol (₦)
 *  - entry+status get glued together ("debitsuccess")
 *  - dates are split across lines ("2026-" + "07-22")
 *  - Unicode replacement characters
 *
 * Note: we intentionally do NOT split arbitrary lower→upper-case transitions
 * globally — that would corrupt camelCase merchant names like "DeepSeek".
 * Boundaries are only inserted at entry/status keyword seams, which is where
 * the gluing actually happens.
 */
export function normalizeStatementText(text: string): string {
  let t = (text || "").replace(/\uFFFD/g, " ");

  // '?' before a number is a mis-encoded naira symbol → normalize to ₦
  t = t.replace(/\?\s*(\d[\d,]*(?:\.\d+)?)/g, "₦$1");

  // Insert boundaries in glued entry+status tokens:
  //   "debitsuccess"  → "debit success"
  //   "debitSuccess"  → "debit Success"
  //   "successDebit"  → "success Debit"
  t = t.replace(
    /(debit|credit)(success|successful|failed|declined|reversed|denied|pending)/gi,
    "$1 $2",
  );
  t = t.replace(
    /(success|successful|failed|declined|reversed|denied|pending)(debit|credit)/gi,
    "$1 $2",
  );

  // Reconstruct dates split across lines:
  //   "2026-\n07-22" → "2026-07-22"
  //   "2026-\n07/22" → "2026-07-22"
  t = t.replace(/(\d{4})-?\s*\n\s*(\d{1,2})[-/](\d{1,2})/g, "$1-$2-$3");

  // Collapse horizontal whitespace while keeping line structure
  t = t.replace(/[ \t]+/g, " ");

  return t;
}

function cleanMerchantText(text: string): string {
  return (
    text
      // direction words
      .replace(/\b(debit|credit)\b/gi, " ")
      // status words
      .replace(
        /\b(success|successful|failed|declined|reversed|denied|pending|settled|paid)\b/gi,
        " ",
      )
      // dates
      .replace(/\b\d{4}-\d{1,2}-\d{1,2}\b/g, " ")
      .replace(/\b\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}\b/g, " ")
      .replace(
        /\b\d{1,2}\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?,?\s+\d{2,4}\b/gi,
        " ",
      )
      // times
      .replace(/\b\d{1,2}:\d{2}(:\d{2})?\s*(am|pm)?\b/gi, " ")
      .replace(/\b(am|pm)\b/gi, " ")
      // symbol-led amounts
      .replace(/[₦$€£]\s*[\d,]+(?:\.\d+)?/g, " ")
      // amounts with a trailing currency code
      .replace(/[\d,]+(?:\.\d+)?\s*(NGN|USD|EUR|GBP)\b/gi, " ")
      // long reference numbers
      .replace(/\b\d{5,}\b/g, " ")
      // leftover standalone currency codes
      .replace(/\b(NGN|USD|EUR|GBP)\b/g, " ")
      // repeated column titles / footer words
      .replace(
        /\b(date|merchant|description|entry|status|amount|balance|ledger|page|reference|transaction)\b/gi,
        " ",
      )
      .replace(/\s+/g, " ")
      .trim()
  );
}

/** "CAPCUTCAPCUT" → "CAPCUT" (character-level, no spaces). */
function deduplicateMerchantName(name: string): string {
  if (name.length >= 2 && name.length % 2 === 0) {
    const half = name.length / 2;
    if (name.slice(0, half) === name.slice(half)) return name.slice(0, half);
  }
  return name;
}

/** "SPOTIFY AB SPOTIFY AB" → "SPOTIFY AB" (word-level). */
function deduplicateWords(name: string): string {
  const words = name.split(/\s+/).filter(Boolean);
  if (words.length >= 2 && words.length % 2 === 0) {
    const half = words.length / 2;
    const a = words.slice(0, half).join(" ");
    const b = words.slice(half).join(" ");
    if (a.toLowerCase() === b.toLowerCase()) return a;
  }
  return name;
}

const HEADER_LINE_PATTERNS = [
  /^date$/i,
  /^merchant/i,
  /^description$/i,
  /^entry$/i,
  /^status$/i,
  /^amount$/i,
  /^balance$/i,
  /^card/i,
  /^account/i,
  /^statement/i,
  /^period/i,
  /^opening/i,
  /^closing/i,
  /^page\s*\d+/i,
  /^available\s+balance/i,
  /^ledger\s+balance/i,
];

function isHeaderLine(line: string): boolean {
  const t = line.trim();
  if (!t) return true;
  return HEADER_LINE_PATTERNS.some((p) => p.test(t));
}

function parseRecord(
  iso: string,
  content: string,
  defaultCurrency: string,
): ParsedStatementTransaction | null {
  // Direction is mandatory — this is what identifies a transaction line.
  const typeMatch = content.match(/\b(debit|credit)\b/i);
  if (!typeMatch) return null;

  const type: "debit" | "credit" =
    typeMatch[1].toLowerCase() === "credit" ? "credit" : "debit";

  const status: "success" | "failed" =
    /\b(failed|declined|reversed|denied)\b/i.test(content)
      ? "failed"
      : "success";

  // Amount — fall back to the statement's dominant currency for bare numbers.
  let amountInfo = extractAmount(content);
  if (!amountInfo) {
    const bare = content.match(/\b(\d[\d,]*(?:\.\d+)?)\b/);
    if (bare) {
      const amount = normalizeAmount(bare[1]);
      if (amount !== null) {
        amountInfo = { amount, currency: defaultCurrency };
      }
    }
  }
  if (!amountInfo) return null;

  let merchant = cleanMerchantText(content);
  merchant = deduplicateMerchantName(merchant);
  merchant = deduplicateWords(merchant);
  if (!merchant || merchant.length < 2) return null;

  return {
    date: iso,
    merchant_raw: merchant,
    merchant_normalized: normalizeMerchant(merchant),
    amount: amountInfo.amount,
    currency: amountInfo.currency,
    type,
    status,
  };
}

/**
 * State-machine parser: a date starts a record, and every following line is
 * accumulated until the next date appears. Fields may span multiple lines.
 */
export function parseStatementText(
  rawText: string,
): ParsedStatementTransaction[] {
  const text = normalizeStatementText(rawText);
  const lines = text.split("\n").map((l) => l.trim());

  const records: { iso: string; content: string[] }[] = [];
  let current: { iso: string; content: string[] } | null = null;

  for (const line of lines) {
    const dm = findDate(line);
    if (dm) {
      if (current) records.push(current);
      current = {
        iso: dm.iso,
        content: [line.slice(dm.index + dm.raw.length)],
      };
    } else if (current) {
      if (!isHeaderLine(line)) current.content.push(line);
    }
    // Lines before the first date (page headers) are ignored.
  }
  if (current) records.push(current);

  const defaultCurrency = detectCurrency(text);
  const out: ParsedStatementTransaction[] = [];

  for (const rec of records) {
    const content = rec.content.join(" ").replace(/\s+/g, " ").trim();
    if (!content) continue;

    const tx = parseRecord(rec.iso, content, defaultCurrency);
    if (tx) out.push(tx);
  }

  return out;
}

/** Convert parser output into the canonical shape the detection engine expects. */
export function toCanonicalTransaction(
  t: ParsedStatementTransaction,
): ParsedTransaction {
  return {
    date: new Date(`${t.date}T00:00:00.000Z`),
    merchant: t.merchant_normalized || t.merchant_raw,
    amount: t.amount,
    currency: t.currency,
    type: t.type,
    status: t.status,
  };
}

export async function parsePdf(
  buffer: Buffer,
): Promise<ParsedStatementTransaction[]> {
  const data = await pdfParse(buffer);
  return parseStatementText(data.text || "");
}

export async function extractRawText(buffer: Buffer): Promise<string> {
  const data = await pdfParse(buffer);
  return data.text || "";
}
