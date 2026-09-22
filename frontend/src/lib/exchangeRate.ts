let cachedRates: Record<string, number> | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

const FALLBACK: Record<string, number> = {
  "USD_NGN": 1550, "NGN_USD": 0.000645,
  "EUR_NGN": 1685, "NGN_EUR": 0.000594,
  "GBP_NGN": 1964, "NGN_GBP": 0.000510,
  "USD_EUR": 0.92, "EUR_USD": 1.087,
  "USD_GBP": 0.79, "GBP_USD": 1.267,
  "EUR_GBP": 0.859, "GBP_EUR": 1.164,
};

export async function fetchRates(): Promise<void> {
  if (cachedRates && Date.now() - cacheTimestamp < CACHE_TTL) return;
  try {
    const res = await fetch("https://open.er-api.com/v6/latest/USD");
    if (res.ok) {
      const data: any = await res.json();
      if (data.rates) {
        cachedRates = data.rates;
        cacheTimestamp = Date.now();
      }
    }
  } catch {
    // use fallback
  }
}

export function convert(amount: number, from: string, to: string): number {
  if (from === to) return amount;
  const key = `${from}_${to}`;

  if (cachedRates && cachedRates[to] && from === "USD") {
    return Math.round(amount * cachedRates[to] * 100) / 100;
  }
  if (cachedRates && cachedRates[from] && to === "USD") {
    return Math.round(amount / cachedRates[from] * 100) / 100;
  }

  // Cross-rate via USD
  if (cachedRates) {
    const fromRate = from === "USD" ? 1 : cachedRates[from];
    const toRate = to === "USD" ? 1 : cachedRates[to];
    if (fromRate && toRate) {
      const usdAmount = amount / fromRate;
      return Math.round(usdAmount * toRate * 100) / 100;
    }
  }

  // Fallback
  const fallbackRate = FALLBACK[key];
  if (fallbackRate) return Math.round(amount * fallbackRate * 100) / 100;

  return amount;
}
