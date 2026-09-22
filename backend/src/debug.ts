import { parseStatementText } from './services/pdfParser.service';
import { normalizeMerchant } from './services/merchantNormalization.service';

const FIXTURE = [
  "Date", "Merchant Description", "Entry", "Status", "Amount", "",
  "2026-", "07-22", "22:40", "pm", "SPOTIFY AB SPOTIFY AB debit success", "?800 NGN", "",
  "2026-", "08-14", "10:05", "am", "DME*Spotify debit success", "?800 NGN", "",
  "2026-", "08-21", "09:12", "am", "DeepSeek debit success", "$5.30 USD", "",
  "2026-", "08-23", "14:02", "pm", "DEEPSEERWEA debit success", "$5.30 USD", "",
  "2026-", "08-29", "11:47", "am", "DEEPSEERWEA debit success", "$5.30 USD", "",
  "2026-", "08-02", "08:30", "am", "APPLE.COM/BILL debit success", "$1.99 USD", "",
  "2026-", "08-16", "07:45", "am", "APPLE.COM/BILL debit success", "$1.99 USD", "",
  "2026-", "08-05", "16:20", "pm", "CapCut debit success", "?250 NGN", "",
  "2026-", "08-19", "12:10", "pm", "CapCut debit success", "?250 NGN", "",
  "2026-", "07-30", "09:00", "am", "SPOTIFY AB debit failed", "?800 NGN"
].join("\n");

const txs = parseStatementText(FIXTURE);
for (const tx of txs) {
  console.log(tx.date.toISOString().slice(0,10), JSON.stringify(tx.merchant), tx.amount, tx.currency, tx.type, tx.status, '| normalized:', normalizeMerchant(tx.merchant));
}

// Now test the actual PDF-extracted format  
const ACTUAL = `DateMerchantDescriptionEntryStatusAmount
2026-
09-11
21:32
pm
Upwork -
950713676Membe
Upwork -
950713676Membe
debitsuccess
$10.739999771118
USD

2026-
09-11
12:21
pm
CAPCUTCAPCUTdebitfailed?14900 NGN

2026-
09-01
22:08
pm
APPLE.COM/BILLAPPLE.COM/BILLdebitsuccess?1500 NGN

2026-
08-29
14:08
pm
DEEPSEERWEADEEPSEERWEAdebitsuccess
$5.3000001907349
USD

2026-
08-21
22:07
pm
DeepSeekDeepSeekdebitsuccess
$5.3000001907349
USD

2026-
08-14
09:15
am
DME*SpotifyDME*Spotifydebitsuccess?800 NGN

2026-
08-12
10:06
am
CAPCUTCAPCUTdebitsuccess?2900 NGN`;

console.log("\n=== ACTUAL PDF FORMAT ===");
const txs2 = parseStatementText(ACTUAL);
for (const tx of txs2) {
  console.log(tx.date.toISOString().slice(0,10), JSON.stringify(tx.merchant), tx.amount, tx.currency, tx.type, tx.status, '| normalized:', normalizeMerchant(tx.merchant));
}
