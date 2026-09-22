const KNOWN_ALIASES: Record<string, string> = {
  // Streaming
  "spotify ab": "Spotify",
  "dme*spotify": "Spotify",
  "spotify usa": "Spotify",
  "spotify premium": "Spotify",
  "spotify.com": "Spotify",

  // AI / SaaS
  deepseek: "DeepSeek",
  deepseerwea: "DeepSeek",
  "deepseek api": "DeepSeek",
  openai: "OpenAI",
  chatgpt: "ChatGPT",
  "chatgpt plus": "ChatGPT Plus",
  "chatgpt sub": "ChatGPT Plus",
  "chatgpt team": "ChatGPT Team",
  anthropic: "Anthropic",
  claude: "Claude",

  // Video / Creative
  capcut: "CapCut",
  "capcut.com": "CapCut",
  "cap cut": "CapCut",
  bytedance: "ByteDance",
  tiktok: "TikTok",
  "tiktok inc": "TikTok",

  // Productivity
  notion: "Notion",
  "notion.so": "Notion",
  canva: "Canva",
  "canva pro": "Canva Pro",
  figma: "Figma",
  linear: "Linear",
  slack: "Slack",
  "slack technologies": "Slack",

  // Cloud
  "amazon web services": "AWS",
  aws: "AWS",
  "google cloud": "Google Cloud",
  gcloud: "Google Cloud",
  "microsoft azure": "Azure",
  azure: "Azure",
  vercel: "Vercel",
  netlify: "Netlify",

  // Apple
  "apple.com/bill": "Apple",
  "apple.com": "Apple",
  "apple inc": "Apple",
  itunes: "Apple",
  "app store": "Apple",

  // Google
  "google storage": "Google One",
  "google one": "Google One",
  "google workspace": "Google Workspace",
  "youtube premium": "YouTube Premium",
  "youtube music": "YouTube Music",
  "yt premium": "YouTube Premium",

  // Finance
  flutterwave: "Flutterwave",
  paystack: "Paystack",
  stripe: "Stripe",

  // Entertainment
  netflix: "Netflix",
  "netflix.com": "Netflix",
  disney: "Disney+",
  "disney plus": "Disney+",
  "disney+": "Disney+",
  hulu: "Hulu",
  "prime video": "Amazon Prime",
  "amazon prime": "Amazon Prime",
  deezer: "Deezer",
  tidal: "Tidal",
  audible: "Audible",

  // Gaming
  steam: "Steam",
  playstation: "PlayStation",
  "ps plus": "PlayStation Plus",
  xbox: "Xbox",
  "xbox game pass": "Xbox Game Pass",
  "epic games": "Epic Games",
  nintendo: "Nintendo",

  // Utilities
  dstv: "DStv",
  multichoice: "DStv",
  glo: "Glo",
  mtn: "MTN",
  airtel: "Airtel",

  // Health
  gym: "Gym",
  fitness: "Fitness",
};

const NOISE_PATTERNS = [
  /^\d+\*+/,
  /^\*+/,
  /\*+$/,
  /^pos\s+/i,
  /^pos\d+/i,
  /^\d{4}\s+/,
  /\s+\d{4}$/,
  /\s+#\d+$/,
  /\s+\d{2}\/\d{2}\/\d{2,4}$/,
  /\s+\d{2}-\d{2}(-\d{2,4})?$/,
  /\s+NG$/,
  /\s+US$/,
  /\s+UK$/,
  /\s+EU$/,
];

function cleanDescription(raw: string): string {
  let desc = raw.trim();

  // Collapse a duplicated descriptor ("SPOTIFY AB SPOTIFY AB" -> "SPOTIFY AB")
  const words = desc.split(/\s+/).filter(Boolean);
  if (words.length >= 2 && words.length % 2 === 0) {
    const half = words.length / 2;
    const first = words.slice(0, half).join(" ");
    const second = words.slice(half).join(" ");
    if (first.toLowerCase() === second.toLowerCase()) {
      desc = first;
    }
  }

  // Remove trailing numbers that look like reference codes
  desc = desc.replace(/\s+\d{6,}$/, "");

  // Remove date suffixes
  desc = desc.replace(/\s+\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}$/, "");

  // Remove time suffixes
  desc = desc.replace(/\s+\d{1,2}:\d{2}(:\d{2})?(\s*(AM|PM))?$/i, "");

  // Remove trailing country codes
  desc = desc.replace(/\s+(NG|US|UK|EU|ZA|KE|GH)$/i, "");

  // Remove card numbers
  desc = desc.replace(/\s+\*{3,}\d{4}$/, "");
  desc = desc.replace(/\s+XXXX?\d{4}$/, "");

  return desc.trim();
}

function normalizeCasing(raw: string): string {
  // All caps → title case unless it's a known acronym
  const acronyms = new Set([
    "AWS",
    "MTN",
    "DSTV",
    "API",
    "UK",
    "US",
    "EU",
    "NG",
    "SaaS",
    "POS",
  ]);

  if (raw === raw.toUpperCase() && raw.length > 3) {
    const words = raw.split(/\s+/);
    const normalized = words.map((w) => {
      const upper = w.toUpperCase();
      if (acronyms.has(upper)) return upper;
      return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
    });
    return normalized.join(" ");
  }

  return raw;
}

export function normalizeMerchant(raw: string): string {
  let name = raw.trim();
  if (!name) return "Unknown";

  // Clean the raw description
  name = cleanDescription(name);

  // Lowercase for alias lookup
  const lower = name.toLowerCase();

  // Check known aliases first
  if (KNOWN_ALIASES[lower]) {
    return KNOWN_ALIASES[lower];
  }

  // Remove common noise patterns
  for (const pattern of NOISE_PATTERNS) {
    name = name.replace(pattern, "");
  }

  // Normalize casing
  name = normalizeCasing(name);

  // Remove common prefixes that payment processors add
  name = name.replace(/^(DME|TST|WWW|HTTP|POS|ATM|EFT|DEB|CRD)\*+/i, "");
  name = name.replace(/^\d+\*+/i, "");
  name = name.replace(/^\*+/i, "");

  // Remove trailing asterisks and numbers
  name = name.replace(/[\*\s]+$/g, "");

  // Remove "INC", "LLC", "LTD", "AB", "GMBH", "SA", "BV" suffixes
  name = name.replace(/\s+(Inc|LLC|Ltd|AB|GmbH|SA|BV|PLC|Co|Company)\.?$/i, "");

  // Remove ".com" suffix
  name = name.replace(/\.com$/i, "");

  // Clean up whitespace
  name = name.replace(/\s+/g, " ").trim();

  // Final casing normalization
  name = normalizeCasing(name);

  return name || "Unknown";
}

export function merchantsMatch(a: string, b: string): boolean {
  const na = normalizeMerchant(a);
  const nb = normalizeMerchant(b);

  // Exact match after normalization
  if (na.toLowerCase() === nb.toLowerCase()) return true;

  // One contains the other
  if (
    na.toLowerCase().includes(nb.toLowerCase()) ||
    nb.toLowerCase().includes(na.toLowerCase())
  ) {
    return true;
  }

  return false;
}

export function merchantSimilarity(a: string, b: string): number {
  const na = normalizeMerchant(a).toLowerCase();
  const nb = normalizeMerchant(b).toLowerCase();

  if (na === nb) return 1.0;

  // One contains the other
  if (na.includes(nb) || nb.includes(na)) return 0.85;

  // Jaro-Winkler-like similarity
  const longer = na.length > nb.length ? na : nb;
  const shorter = na.length > nb.length ? nb : na;

  if (longer.length === 0) return 0;

  // Count matching characters
  let matches = 0;
  const range = Math.max(Math.floor(longer.length / 2) - 1, 0);
  const used = new Set<number>();

  for (let i = 0; i < shorter.length; i++) {
    for (
      let j = Math.max(0, i - range);
      j < Math.min(longer.length, i + range + 1);
      j++
    ) {
      if (!used.has(j) && shorter[i] === longer[j]) {
        matches++;
        used.add(j);
        break;
      }
    }
  }

  if (matches === 0) return 0;

  // Word overlap score
  const wordsA = na.split(/\s+/).filter(Boolean);
  const wordsB = nb.split(/\s+/).filter(Boolean);
  const shorterWordCount = Math.min(wordsA.length, wordsB.length);
  let wordMatches = 0;
  for (const wa of wordsA) {
    for (const wb of wordsB) {
      if (wa === wb) {
        wordMatches++;
        break;
      }
    }
  }

  const charScore = matches / longer.length;
  const wordScore = shorterWordCount > 0 ? wordMatches / shorterWordCount : 0;

  return Math.max(charScore, wordScore);
}

export type CanonicalMerchant = {
  name: string;
  confidence: number;
};

export function findCanonicalMerchant(
  raw: string,
  knownMerchants?: string[],
): CanonicalMerchant {
  // Try alias first
  const alias = normalizeMerchant(raw);
  if (alias !== "Unknown" && alias.toLowerCase() !== raw.toLowerCase()) {
    return { name: alias, confidence: 0.95 };
  }

  // Try fuzzy match against known merchants
  if (knownMerchants && knownMerchants.length > 0) {
    let bestMatch = "";
    let bestScore = 0;

    for (const known of knownMerchants) {
      const score = merchantSimilarity(raw, known);
      if (score > bestScore) {
        bestScore = score;
        bestMatch = known;
      }
    }

    if (bestScore > 0.7) {
      return { name: bestMatch, confidence: bestScore };
    }
  }

  // Return normalized version
  return {
    name: alias,
    confidence: alias.toLowerCase() === raw.toLowerCase() ? 0.6 : 0.8,
  };
}

// ─── Deterministic merchant classification data ─────────────────────────

/**
 * Hard exclusion list. Merchants matching these (after normalization)
 * must NEVER appear as subscription candidates.
 * Checked via exact lowercase match against the normalized merchant name.
 */
const EXCLUDED_MERCHANTS = new Set([
  "transaction fee",
  "card funding",
  "card protection fee",
  "service fee",
  "bank fee",
  "transfer fee",
  "atm withdrawal",
  "cash withdrawal",
  "interest",
  "late fee",
  "tax",
  "card fee",
  "processing fee",
  "maintenance fee",
  "account fee",
  "monthly fee",
  "annual fee",
  "withdrawal fee",
  "deposit fee",
  "wire fee",
  "exchange fee",
  "foreign transaction fee",
]);

/**
 * Regex patterns for excluded merchants. Matches against the
 * lowercased, trimmed, normalized merchant name.
 */
const EXCLUDED_PATTERNS: RegExp[] = [
  /\bfee\b/,
  /\batm\b/,
  /\bcash\s+withdraw/,
  /\btransfer\b/,
  /\binterest\b/,
  /\blate\s+fee\b/,
  /\btax\b/,
  /\blevy\b/,
  /\bcharge\b/,
];

/**
 * Merchants that are known NOT to be subscriptions, even if they
 * appear multiple times. These are marketplaces, payment processors,
 * freelance platforms, etc. where individual payments are independent.
 *
 * Key: lowercased normalized merchant name
 * Value: category label for reasons
 */
const NON_SUBSCRIPTION_MERCHANTS: Record<string, string> = {
  "upwork": "freelance marketplace",
  "fiverr": "freelance marketplace",
  "freelancer": "freelance marketplace",
  "toptal": "freelance marketplace",
  "guru": "freelance marketplace",
  "peopleperhour": "freelance marketplace",
  "flutterwave": "payment processor",
  "paystack": "payment processor",
  "stripe": "payment processor",
  "square": "payment processor",
  "paypal": "payment processor",
  "venmo": "payment processor",
  "cash app": "payment processor",
  "zelle": "payment processor",
  "wise": "payment processor",
  "remitly": "payment processor",
  "western union": "payment processor",
  "moneygram": "payment processor",
};

/**
 * Merchants that are commonly subscriptions. Used as an *additional
 * signal* — NOT as proof. A known subscription merchant still needs
 * cadence + amount evidence to be classified as subscription_candidate.
 *
 * Key: lowercased normalized merchant name
 * Value: category for the subscription
 */
const KNOWN_SUBSCRIPTION_MERCHANTS: Record<string, string> = {
  "spotify": "music",
  "netflix": "streaming",
  "youtube premium": "streaming",
  "youtube music": "streaming",
  "disney+": "streaming",
  "hulu": "streaming",
  "amazon prime": "streaming",
  "prime video": "streaming",
  "apple": "software",
  "adobe": "software",
  "microsoft": "software",
  "chatgpt": "ai",
  "chatgpt plus": "ai",
  "chatgpt team": "ai",
  "openai": "ai",
  "anthropic": "ai",
  "claude": "ai",
  "notion": "productivity",
  "canva": "design",
  "canva pro": "design",
  "figma": "design",
  "slack": "productivity",
  "linear": "productivity",
  "dropbox": "cloud",
  "icloud": "cloud",
  "google one": "cloud",
  "google workspace": "cloud",
  "aws": "cloud",
  "google cloud": "cloud",
  "azure": "cloud",
  "vercel": "cloud",
  "netlify": "cloud",
  "steam": "gaming",
  "playstation": "gaming",
  "xbox": "gaming",
  "xbox game pass": "gaming",
  "nintendo": "gaming",
  "epic games": "gaming",
  "audible": "entertainment",
  "deezer": "music",
  "tidal": "music",
  "capcut": "creative",
  "dstv": "entertainment",
  "multichoice": "entertainment",
};

/**
 * Check if a normalized merchant name is hard-excluded.
 */
export function isExcludedMerchant(normalizedName: string): boolean {
  const lower = normalizedName.toLowerCase().trim();

  if (EXCLUDED_MERCHANTS.has(lower)) return true;

  for (const pattern of EXCLUDED_PATTERNS) {
    if (pattern.test(lower)) return true;
  }

  return false;
}

/**
 * Get the non-subscription category for a merchant, or null if not known.
 */
export function getNonSubscriptionCategory(
  normalizedName: string,
): string | null {
  const lower = normalizedName.toLowerCase().trim();
  return NON_SUBSCRIPTION_MERCHANTS[lower] ?? null;
}

/**
 * Get the known subscription category for a merchant, or null if not known.
 */
export function getKnownSubscriptionCategory(
  normalizedName: string,
): string | null {
  const lower = normalizedName.toLowerCase().trim();
  return KNOWN_SUBSCRIPTION_MERCHANTS[lower] ?? null;
}
