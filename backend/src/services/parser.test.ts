import assert from "node:assert/strict";
import {
  parseStatementText,
  extractAmount,
  normalizeStatementText,
  toCanonicalTransaction,
} from "./pdfParser.service";
import { normalizeMerchant } from "./merchantNormalization.service";
import { detectRecurring } from "./recurringDetection.service";

/**
 * Fixture modelled on the actual extracted text structure of the uploaded
 * statement. Dates are split across lines, merchants are duplicated, and
 * currency symbols are mis-encoded as '?'.
 */
const FIXTURE = [
  "Date",
  "Merchant Description",
  "Entry",
  "Status",
  "Amount",
  "",
  "2026-",
  "07-22",
  "22:40",
  "pm",
  "SPOTIFY AB SPOTIFY AB debit success",
  "?800 NGN",
  "",
  "2026-",
  "08-14",
  "10:05",
  "am",
  "DME*Spotify debit success",
  "?800 NGN",
  "",
  "2026-",
  "08-21",
  "09:12",
  "am",
  "DeepSeek debit success",
  "$5.30 USD",
  "",
  "2026-",
  "08-23",
  "14:02",
  "pm",
  "DEEPSEERWEA debit success",
  "$5.30 USD",
  "",
  "2026-",
  "08-29",
  "11:47",
  "am",
  "DEEPSEERWEA debit success",
  "$5.30 USD",
  "",
  "2026-",
  "08-02",
  "08:30",
  "am",
  "APPLE.COM/BILL debit success",
  "$1.99 USD",
  "",
  "2026-",
  "08-16",
  "07:45",
  "am",
  "APPLE.COM/BILL debit success",
  "$1.99 USD",
  "",
  "2026-",
  "08-05",
  "16:20",
  "pm",
  "CapCut debit success",
  "?250 NGN",
  "",
  "2026-",
  "08-19",
  "12:10",
  "pm",
  "CapCut debit success",
  "?250 NGN",
  "",
  "2026-",
  "07-30",
  "09:00",
  "am",
  "SPOTIFY AB debit failed",
  "?800 NGN",
].join("\n");

// ── 1. Amount extraction / artifact normalization ──────────────────────
assert.deepEqual(extractAmount("₦800 NGN"), { amount: 800, currency: "NGN" });
assert.deepEqual(extractAmount("5.30 USD"), { amount: 5.3, currency: "USD" });
assert.deepEqual(extractAmount("NGN 800"), { amount: 800, currency: "NGN" });
assert.deepEqual(extractAmount("1,234.56 USD"), {
  amount: 1234.56,
  currency: "USD",
});
assert.deepEqual(extractAmount(normalizeStatementText("?800 NGN")), {
  amount: 800,
  currency: "NGN",
});
assert.equal(extractAmount("$5.30 USD")!.amount, 5.3);
console.log("✓ artifact normalization");

// Glued entry+status tokens must be split apart
assert.ok(/debit\s+success/i.test(normalizeStatementText("debitsuccess")));
assert.ok(/debit\s+success/i.test(normalizeStatementText("debitSuccess")));
assert.ok(/success\s+debit/i.test(normalizeStatementText("successDebit")));
console.log("✓ glued-token boundary insertion");

// ── 2. Parser ──────────────────────────────────────────────────────────
const txs = parseStatementText(FIXTURE);
assert.ok(
  txs.length >= 10,
  `expected at least 10 transactions, got ${txs.length}`,
);

const find = (merchantPart: string, date: string, amount: number) =>
  txs.find(
    (t) =>
      t.date === date &&
      t.amount === amount &&
      t.merchant_raw.toLowerCase().includes(merchantPart.toLowerCase()),
  );

const spotify1 = find("spotify", "2026-07-22", 800);
const spotify2 = find("spotify", "2026-08-14", 800);
assert.ok(
  spotify1 &&
    spotify1.status === "success" &&
    spotify1.type === "debit" &&
    spotify1.currency === "NGN" &&
    spotify1.merchant_normalized === "Spotify",
  "Spotify ₦800 on 2026-07-22 must be parsed (success, debit, NGN)",
);
assert.ok(
  spotify2 &&
    spotify2.status === "success" &&
    spotify2.type === "debit" &&
    spotify2.currency === "NGN" &&
    spotify2.merchant_normalized === "Spotify",
  "DME*Spotify ₦800 on 2026-08-14 must be parsed (success, debit, NGN)",
);

const deep1 = find("deepseek", "2026-08-21", 5.3);
const deep2 = find("deepseerwea", "2026-08-23", 5.3);
const deep3 = find("deepseerwea", "2026-08-29", 5.3);
assert.ok(deep1 && deep1.merchant_normalized === "DeepSeek", "DeepSeek 08-21");
assert.ok(
  deep2 && deep2.merchant_normalized === "DeepSeek",
  "DEEPSEERWEA 08-23",
);
assert.ok(
  deep3 && deep3.merchant_normalized === "DeepSeek",
  "DEEPSEERWEA 08-29",
);

const failed = txs.find((t) => t.status === "failed");
assert.ok(
  failed &&
    failed.merchant_raw.toLowerCase().includes("spotify") &&
    failed.merchant_normalized === "Spotify",
  "the failed Spotify attempt must still be parsed with status 'failed'",
);
console.log(`✓ parser (${txs.length} transactions)`);

// ── 3. Additional date formats ─────────────────────────────────────────
const altTxs = parseStatementText(
  [
    "12 Mar 2025 Spotify debit success ?800 NGN",
    "2025-03-12 Netflix debit success $15.99 USD",
    "12/03/2025 Spotify debit success ?800 NGN",
  ].join("\n"),
);
assert.equal(altTxs.length, 3);
assert.equal(altTxs[0].date, "2025-03-12");
assert.equal(altTxs[0].merchant_normalized, "Spotify");
assert.equal(altTxs[1].date, "2025-03-12");
assert.equal(altTxs[1].merchant_normalized, "Netflix");
assert.equal(altTxs[2].date, "2025-03-12");
assert.equal(altTxs[2].merchant_normalized, "Spotify");
console.log("✓ date formats (Mar / ISO / slash)");

// ── 4. Glued + doubled merchant names ──────────────────────────────────
const glued = parseStatementText(
  ["2026-07-22", "CAPCUTCAPCUT debitsuccess", "?800 NGN"].join("\n"),
);
assert.equal(glued.length, 1);
assert.equal(glued[0].merchant_raw, "CAPCUT");
assert.equal(glued[0].merchant_normalized, "CapCut");
assert.equal(glued[0].type, "debit");
assert.equal(glued[0].status, "success");
assert.equal(glued[0].amount, 800);
console.log("✓ doubled/glued merchant cleanup");

// ── 5. Merchant normalization ──────────────────────────────────────────
assert.equal(normalizeMerchant("SPOTIFY AB"), "Spotify");
assert.equal(normalizeMerchant("DME*Spotify"), "Spotify");
assert.equal(normalizeMerchant("SPOTIFY AB SPOTIFY AB"), "Spotify");
assert.equal(normalizeMerchant("DeepSeek"), "DeepSeek");
assert.equal(normalizeMerchant("DEEPSEERWEA"), "DeepSeek");
console.log("✓ merchant normalization");

// ── 6. Recurrence detection (consumes the canonical shape) ─────────────
const canonical = txs.map(toCanonicalTransaction);
const detected = detectRecurring(canonical);
const spotify = detected.find((d) => d.name === "Spotify");
const deepseek = detected.find((d) => d.name === "DeepSeek");

assert.ok(spotify, "Spotify must be detected as recurring");
assert.equal(spotify!.occurrences, 2);
assert.equal(spotify!.amount, 800);
assert.equal(spotify!.currency, "NGN");

assert.ok(deepseek, "DeepSeek must be detected as recurring");
assert.equal(deepseek!.occurrences, 3);
assert.ok(Math.abs(deepseek!.amount - 5.3) < 0.001);
assert.equal(deepseek!.currency, "USD");
console.log(`✓ recurrence detection (${detected.length} candidates)`);

console.log("\nAll parser tests passed ✓");
