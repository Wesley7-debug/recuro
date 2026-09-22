/**
 * Convert a subscription amount to its monthly equivalent.
 * Mirrors the frontend `monthlyEquivalent` in lib/utils.ts so the
 * savings log and the dashboard always reconcile.
 */
export function monthlyEquivalent(amount: number, billingCycle: string): number {
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

export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
