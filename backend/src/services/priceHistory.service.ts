import { Notification } from "../models/Notification";

export type PriceChangeSource = "initial" | "manual" | "statement";

export interface PriceHistoryEntry {
  amount: number;
  currency: string;
  date: Date;
  source: PriceChangeSource;
}

export interface AmountChangeInput {
  name: string;
  prevAmount: number;
  prevCurrency: string;
  newAmount: number;
  newCurrency: string;
  history?: PriceHistoryEntry[];
  source: "manual" | "statement";
  now?: Date;
}

export interface AmountChangeResult {
  history: PriceHistoryEntry[];
  notification: { type: string; title: string; message: string } | null;
}

const SYMBOLS: Record<string, string> = {
  USD: "$",
  EUR: "\u20ac",
  GBP: "\u00a3",
  NGN: "\u20a6",
};

export function initialPriceHistory(
  amount: number,
  currency: string,
): PriceHistoryEntry[] {
  return [{ amount, currency, date: new Date(), source: "initial" }];
}

/**
 * Compare a subscription's new amount against its previous amount,
 * append to price history when anything changed, and build a
 * "price_change" notification payload when — and only when — the
 * amount increased in the same currency.
 *
 * Pure function so controllers stay thin and tests stay simple.
 */
export function applyAmountChange(input: AmountChangeInput): AmountChangeResult {
  const history = [...(input.history || [])];
  const changed =
    input.newAmount !== input.prevAmount ||
    input.newCurrency !== input.prevCurrency;

  if (changed) {
    history.push({
      amount: input.newAmount,
      currency: input.newCurrency,
      date: input.now || new Date(),
      source: input.source,
    });
  }

  let notification: AmountChangeResult["notification"] = null;
  const isHike =
    input.newAmount > input.prevAmount &&
    input.newCurrency === input.prevCurrency &&
    input.prevAmount > 0;

  if (isHike) {
    const pct =
      Math.round(
        ((input.newAmount - input.prevAmount) / input.prevAmount) * 1000,
      ) / 10;
    const sym = SYMBOLS[input.prevCurrency] || `${input.prevCurrency} `;
    notification = {
      type: "price_change",
      title: "Price increase",
      message: `${input.name} increased from ${sym}${input.prevAmount.toFixed(2)} to ${sym}${input.newAmount.toFixed(2)} (+${pct}%)`,
    };
  }

  return { history, notification };
}

export async function notifyPriceChange(
  userId: string,
  notification: NonNullable<AmountChangeResult["notification"]>,
): Promise<void> {
  await Notification.create({
    userId,
    type: notification.type,
    title: notification.title,
    message: notification.message,
    read: false,
  });
}
