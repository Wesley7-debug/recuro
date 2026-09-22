const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: "$",
  EUR: "€",
  GBP: "£",
  NGN: "₦",
};

export function formatCurrency(amount: number, currency: string): string {
  const symbol = CURRENCY_SYMBOLS[currency] || "$";
  return `${symbol}${amount.toFixed(2)}`;
}

/**
 * Convert a subscription amount to its monthly equivalent.
 * Used everywhere the dashboard reports "monthly" spending so that
 * the category totals always reconcile with the monthly total.
 */
export function monthlyEquivalent(
  amount: number,
  billingCycle: string,
): number {
  switch (billingCycle) {
    case "yearly":
      return amount / 12;
    case "quarterly":
      return amount / 3;
    case "weekly":
      return amount * 4.33;
    case "monthly":
    default:
      return amount;
  }
}
