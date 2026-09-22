// Mapping of normalized provider/name -> cancellation URL
// Case-insensitive, alias-aware via normalizeMerchant reuse if available
const CANCELLATION_URLS: Record<string, string> = {
  "netflix": "https://www.netflix.com/cancelplan",
  "spotify": "https://www.spotify.com/account/cancel/",
  "youtube": "https://www.youtube.com/paid_memberships",
  "youtube premium": "https://www.youtube.com/paid_memberships",
  "notion": "https://www.notion.so/settings/billing",
  "canva": "https://www.canva.com/settings/billing",
  "adobe": "https://account.adobe.com/plans",
  "apple": "https://apps.apple.com/account/subscriptions",
  "apple music": "https://apps.apple.com/account/subscriptions",
  "disney": "https://www.disneyplus.com/account",
  "disney+": "https://www.disneyplus.com/account",
  "hbo": "https://help.max.com/Account/Billing/Cancel-Subscription",
  "max": "https://help.max.com/Account/Billing/Cancel-Subscription",
  "hulu": "https://www.hulu.com/account/cancel",
  "dropbox": "https://www.dropbox.com/account/plan",
  "slack": "https://my.slack.com/admin/billing",
  "microsoft": "https://account.microsoft.com/services/",
  "microsoft 365": "https://account.microsoft.com/services/",
  "office 365": "https://account.microsoft.com/services/",
  "google": "https://play.google.com/store/account/subscriptions",
  "google one": "https://one.google.com/settings",
  "amazon prime": "https://www.amazon.com/gp/help/customer/display.html?nodeId=GQ7M5KZ4SSPCW9RA",
  "amazon": "https://www.amazon.com/gp/video/settings",
  "github": "https://github.com/settings/billing",
  "figma": "https://www.figma.com/file/billing",
  "zoom": "https://zoom.us/billing",
  "chatgpt": "https://chat.openai.com/settings/subscription",
  "openai": "https://chat.openai.com/settings/subscription",
  "x": "https://x.com/settings/subscriptions",
  "twitter": "https://x.com/settings/subscriptions",
  "linkedin": "https://www.linkedin.com/premium/manage/",
  "medium": "https://medium.com/me/settings/billing",
  "strava": "https://www.strava.com/settings/billing",
  "peloton": "https://members.onepeloton.com/membership",
  "duolingo": "https://www.duolingo.com/settings/billing",
  "coursera": "https://www.coursera.org/account-settings/billing",
};

const ALIASES: Record<string, string> = {
  "spotify ab": "spotify",
  "netflix inc": "netflix",
  "netflix.com": "netflix",
  "hbo max": "max",
  "disney plus": "disney",
};

function normalize(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

export function getCancellationUrl(provider: string, name?: string): string | null {
  const candidates = [provider, name].filter(Boolean) as string[];
  for (const raw of candidates) {
    const n = normalize(raw);
    if (CANCELLATION_URLS[n]) return CANCELLATION_URLS[n];
    if (ALIASES[n] && CANCELLATION_URLS[ALIASES[n]]) return CANCELLATION_URLS[ALIASES[n]];
  }
  // partial match: if provider contains known key
  for (const raw of candidates) {
    const n = normalize(raw);
    for (const [key, url] of Object.entries(CANCELLATION_URLS)) {
      if (n.includes(key) || key.includes(n)) return url;
    }
  }
  return null;
}
