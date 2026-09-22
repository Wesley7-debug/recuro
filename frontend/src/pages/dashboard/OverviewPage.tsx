import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useSubscriptionStore } from "../../stores/subscriptionStore";
import { useAuth } from "../../contexts/AuthContext";
import { formatCurrency, monthlyEquivalent } from "../../lib/utils";
import { fetchRates, convert } from "../../lib/exchangeRate";
import { api } from "../../lib/api/client";
import PageHeader from "../../components/PageHeader";
import StatCard from "../../components/StatCard";
import EmptyState from "../../components/EmptyState";
import LoadingSpinner from "../../components/LoadingSpinner";
import { getCategoryColors } from "../../components/CategoryBadge";

export default function OverviewPage() {
  const { subscriptions, loading, fetchSubscriptions } = useSubscriptionStore();
  const { user } = useAuth();
  const currency = user?.preferred_currency || "NGN";
  const [ratesReady, setRatesReady] = useState(false);
  const [savings, setSavings] = useState<{ total: number; currency: string } | null>(null);

  useEffect(() => {
    fetchSubscriptions();
    fetchRates().then(() => setRatesReady(true));
    api.savings.get().then(setSavings).catch(() => {});
  }, []);

  const activeSubs = subscriptions.filter((s) => s.status === "active");
  const trialSubs = subscriptions.filter((s) => s.status === "trial");

  const totalMonthly = activeSubs.reduce((sum, s) => {
    const amount = Number(s.amount);
    const subCurrency = s.currency || "USD";
    const converted = convert(amount, subCurrency, currency);
    return sum + monthlyEquivalent(converted, s.billingCycle);
  }, 0);
  const totalYearly = totalMonthly * 12;

  const upcomingRenewals = [...activeSubs]
    .sort(
      (a, b) =>
        new Date(a.nextBillingDate).getTime() -
        new Date(b.nextBillingDate).getTime(),
    )
    .slice(0, 5);

  const endingTrials = [...trialSubs]
    .filter((s) => s.trialEndDate)
    .sort((a, b) => new Date(a.trialEndDate as string).getTime() - new Date(b.trialEndDate as string).getTime())
    .slice(0, 5);

  const rawCaps = (user as any)?.budgetCaps || (user as any)?.budget_caps || {};
  const budgetCaps: Record<string, number> = rawCaps instanceof Map ? Object.fromEntries(rawCaps as any) : rawCaps;

  if (loading || !ratesReady) return <LoadingSpinner />;

  return (
    <div className="mx-auto w-full max-w-[1200px] px-4 pb-16 sm:px-6 lg:px-8">
      <PageHeader
        title="Dashboard"
        subtitle="Overview of your subscriptions"
        action={
          <div className="flex items-center gap-3">
            <Link to="/dashboard/calendar" className="ui-btn-secondary">
              Calendar
            </Link>
            <Link to="/dashboard/subscriptions" className="ui-btn-primary">
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Add subscription
            </Link>
          </div>
        }
      />

      {/* Stats row */}
      <div className="mb-8 grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Monthly spending"
          value={formatCurrency(totalMonthly, currency)}
          sub={`${formatCurrency(totalYearly, currency)}/year`}
          icon="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          color="text-primary"
          bg="bg-warm"
        />
        <StatCard
          label="Active subscriptions"
          value={activeSubs.length}
          icon="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
          color="text-cat-entertainment-dot"
          bg="bg-cat-entertainment-bg"
        />
        <StatCard
          label="Upcoming renewals"
          value={upcomingRenewals.length}
          icon="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
          color="text-cat-productivity-text"
          bg="bg-cat-productivity-bg"
        />
        <StatCard
          label="You've saved"
          value={savings ? formatCurrency(savings.total, savings.currency) : formatCurrency(0, currency)}
          sub="since joining"
          icon="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4z M12 2v2 M12 14v2 M4 12H2 M22 12h-2"
          color="text-cat-finance-text"
          bg="bg-cat-finance-bg"
        />
      </div>

      {subscriptions.length === 0 ? (
        <EmptyState
          icon="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
          title="No subscriptions yet"
          description="Start tracking your recurring expenses by adding your first subscription."
          action={
            <Link to="/dashboard/subscriptions" className="ui-btn-primary">
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Add your first subscription
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {/* Upcoming renewals */}
          <div className="ui-card flex flex-col p-5 sm:p-6">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-[15px] font-semibold tracking-[-0.01em] text-ink">
                <span className="w-2 h-2 rounded-full bg-primary" />
                Upcoming renewals
              </h3>
              <Link
                to="/dashboard/subscriptions"
                className="text-[12px] font-semibold text-ink-muted transition-colors hover:text-ink"
              >
                View all
              </Link>
            </div>

            <div className="-mx-2 space-y-0.5">
              {upcomingRenewals.map((sub) => {
                const colors = getCategoryColors(sub.category);
                const displayAmount = convert(
                  Number(sub.amount),
                  sub.currency || "USD",
                  currency,
                );
                return (
                  <div
                    key={sub._id}
                    className="flex items-center justify-between gap-3 rounded-badge px-2 py-2.5 transition-colors hover:bg-surface-alt"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-badge text-[12px] font-bold ${colors.bg} ${colors.text}`}
                      >
                        {sub.name[0]}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-[13px] font-semibold leading-tight text-ink">
                          {sub.name}
                        </p>
                        <p className="mt-0.5 text-[11px] leading-tight text-ink-faint">
                          {new Date(sub.nextBillingDate).toLocaleDateString(
                            "en-US",
                            { month: "short", day: "numeric" },
                          )}
                        </p>
                      </div>
                    </div>
                    <span className="shrink-0 text-[13px] font-semibold tabular-nums text-ink">
                      {formatCurrency(displayAmount, currency)}
                    </span>
                  </div>
                );
              })}
              {upcomingRenewals.length === 0 && (
                <p className="text-[13px] text-ink-faint px-2 py-2">No upcoming renewals.</p>
              )}
            </div>
          </div>

          {/* Spending by category with budget caps progress */}
          <div className="ui-card flex flex-col p-5 sm:p-6">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-[15px] font-semibold tracking-[-0.01em] text-ink">
                <span className="w-2 h-2 rounded-full bg-cat-education-dot" />
                Spending by category
              </h3>
              <span className="text-[12px] font-semibold text-ink-muted">
                Monthly
              </span>
            </div>

            <div className="-mx-2 space-y-1">
              {Object.entries(
                activeSubs.reduce(
                  (acc, s) => {
                    const converted = convert(
                      Number(s.amount),
                      s.currency || "USD",
                      currency,
                    );
                    const monthly = monthlyEquivalent(
                      converted,
                      s.billingCycle,
                    );
                    acc[s.category] = (acc[s.category] || 0) + monthly;
                    return acc;
                  },
                  {} as Record<string, number>,
                ),
              )
                .sort((a, b) => b[1] - a[1])
                .map(([category, amount]) => {
                  const colors = getCategoryColors(category);
                  const cap = budgetCaps[category];
                  const pct = cap ? (amount / cap) * 100 : 0;
                  let barColor = "bg-primary";
                  if (cap) {
                    if (pct >= 100) barColor = "bg-red-500";
                    else if (pct >= 80) barColor = "bg-amber-400";
                  }
                  return (
                    <div
                      key={category}
                      className="rounded-badge px-2 py-2.5 transition-colors hover:bg-surface-alt"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-3">
                          <span
                            className={`h-2.5 w-2.5 shrink-0 rounded-full ${colors.dot}`}
                          />
                          <span className="truncate text-[13px] font-semibold capitalize leading-tight text-ink">
                            {category}
                          </span>
                        </div>
                        <span className="shrink-0 text-[13px] font-semibold tabular-nums text-ink">
                          {formatCurrency(amount, currency)}
                          {cap ? <span className="text-ink-faint font-normal"> / {formatCurrency(cap, currency)}</span> : null}
                        </span>
                      </div>
                      {cap && (
                        <div className="mt-2 h-1.5 w-full rounded-full bg-border-light overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${barColor}`}
                            style={{ width: `${Math.min(pct, 100)}%` }}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Ending trials section */}
          {endingTrials.length > 0 && (
            <div className="ui-card flex flex-col p-5 sm:p-6 lg:col-span-2">
              <div className="mb-5 flex items-center justify-between">
                <h3 className="flex items-center gap-2 text-[15px] font-semibold tracking-[-0.01em] text-ink">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  Ending trials
                </h3>
                <span className="text-[12px] font-semibold text-ink-muted">{endingTrials.length} trial{endingTrials.length !== 1 ? "s" : ""}</span>
              </div>
              <div className="-mx-2 space-y-0.5">
                {endingTrials.map((sub: any) => {
                  const colors = getCategoryColors(sub.category);
                  const displayAmount = convert(Number(sub.amount), sub.currency || "USD", currency);
                  const daysLeft = Math.ceil((new Date(sub.trialEndDate).getTime() - Date.now()) / (86400000));
                  return (
                    <div key={sub._id} className="flex items-center justify-between gap-3 rounded-badge px-2 py-2.5 hover:bg-surface-alt">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-badge text-[12px] font-bold ${colors.bg} ${colors.text}`}>{sub.name[0]}</div>
                        <div>
                          <p className="text-[13px] font-semibold text-ink flex items-center gap-2">
                            {sub.name} <span className="text-[10px] font-bold tracking-widest uppercase bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">Trial</span>
                          </p>
                          <p className="text-[11px] text-ink-faint">Ends {new Date(sub.trialEndDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })} · {daysLeft <= 0 ? "ending today" : `${daysLeft}d left`} · then {formatCurrency(displayAmount, currency)}</p>
                        </div>
                      </div>
                      <span className="text-[12px] font-semibold text-amber-700">{daysLeft}d</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
