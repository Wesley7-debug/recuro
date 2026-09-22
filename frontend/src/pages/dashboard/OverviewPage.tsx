import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useSubscriptionStore } from "../../stores/subscriptionStore";
import { useAuth } from "../../contexts/AuthContext";
import { formatCurrency, monthlyEquivalent } from "../../lib/utils";
import { fetchRates, convert } from "../../lib/exchangeRate";
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

  useEffect(() => {
    fetchSubscriptions();
    fetchRates().then(() => setRatesReady(true));
  }, []);

  const activeSubs = subscriptions.filter((s) => s.status === "active");

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

  if (loading || !ratesReady) return <LoadingSpinner />;

  return (
    <div className="mx-auto w-full max-w-[1200px] px-4 pb-16 sm:px-6 lg:px-8">
      <PageHeader
        title="Dashboard"
        subtitle="Overview of your subscriptions"
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
            Add subscription
          </Link>
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
          label="Total subscriptions"
          value={subscriptions.length}
          icon="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z"
          color="text-cat-education-text"
          bg="bg-cat-education-bg"
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
            </div>
          </div>

          {/* Spending by category */}
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

            <div className="-mx-2 space-y-0.5">
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
                  return (
                    <div
                      key={category}
                      className="flex items-center justify-between gap-3 rounded-badge px-2 py-2.5 transition-colors hover:bg-surface-alt"
                    >
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
                      </span>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
