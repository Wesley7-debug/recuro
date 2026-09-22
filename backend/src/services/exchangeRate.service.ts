interface RateCache {
  rates: Record<string, number>;
  timestamp: number;
}

const cache = new Map<string, RateCache>();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

const FALLBACK_RATES: Record<string, Record<string, number>> = {
  USD: { NGN: 1550, EUR: 0.92, GBP: 0.79 },
  NGN: { USD: 0.000645, EUR: 0.000594, GBP: 0.000510 },
  EUR: { USD: 1.087, NGN: 1685, GBP: 0.859 },
  GBP: { USD: 1.267, NGN: 1964, EUR: 1.164 },
};

export async function getExchangeRate(
  from: string,
  to: string,
): Promise<number> {
  if (from === to) return 1;

  const key = `${from}_${to}`;
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.rates[to] ?? 1;
  }

  try {
    const res = await fetch(
      `https://open.er-api.com/v6/latest/${from}`,
    );
    if (res.ok) {
      const data: any = await res.json();
      if (data.rates && data.rates[to]) {
        cache.set(key, { rates: data.rates, timestamp: Date.now() });
        return data.rates[to];
      }
    }
  } catch {
    // fall through to fallback
  }

  // Fallback to hardcoded approximate rates
  return FALLBACK_RATES[from]?.[to] ?? 1;
}

export function convertAmount(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  rate: number,
): number {
  if (fromCurrency === toCurrency) return amount;
  return Math.round(amount * rate * 100) / 100;
}
