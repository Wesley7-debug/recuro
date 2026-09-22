import { useEffect, useState, useMemo } from "react";
import { useSubscriptionStore } from "../../stores/subscriptionStore";
import { useAuth } from "../../contexts/AuthContext";
import { formatCurrency } from "../../lib/utils";
import { fetchRates, convert } from "../../lib/exchangeRate";
import PageHeader from "../../components/PageHeader";
import LoadingSpinner from "../../components/LoadingSpinner";

function buildOccurrences(sub: any, monthStart: Date, monthEnd: Date): Date[] {
  const dates: Date[] = [];
  const base = new Date(sub.nextBillingDate);
  if (isNaN(base.getTime())) return dates;
  // For monthly subscriptions, project within month by keeping same day-of-month
  // For yearly/quarterly/weekly, approximate by stepping
  let cursor = new Date(base);
  // Rewind to before month if needed (for monthly, ensure we cover month)
  // Simplify: if billingCycle is monthly, just map to current month's same day
  if (sub.billingCycle === "monthly") {
    const day = base.getDate();
    const d = new Date(monthStart.getFullYear(), monthStart.getMonth(), day);
    if (d >= monthStart && d <= monthEnd) dates.push(d);
    return dates;
  }
  if (sub.billingCycle === "weekly") {
    // step weekly from base until past monthEnd
    while (cursor < monthStart) cursor.setDate(cursor.getDate() + 7);
    while (cursor <= monthEnd) {
      dates.push(new Date(cursor));
      cursor.setDate(cursor.getDate() + 7);
    }
    return dates;
  }
  if (sub.billingCycle === "quarterly") {
    while (cursor < monthStart) cursor.setMonth(cursor.getMonth() + 3);
    if (cursor >= monthStart && cursor <= monthEnd) dates.push(new Date(cursor));
    return dates;
  }
  if (sub.billingCycle === "yearly") {
    while (cursor < monthStart) cursor.setFullYear(cursor.getFullYear() + 1);
    if (cursor >= monthStart && cursor <= monthEnd) dates.push(new Date(cursor));
    return dates;
  }
  // fallback: just check base date
  if (cursor >= monthStart && cursor <= monthEnd) dates.push(cursor);
  return dates;
}

export default function CalendarPage() {
  const { subscriptions, fetchSubscriptions } = useSubscriptionStore();
  const { user } = useAuth();
  const currency = user?.preferred_currency || "NGN";
  const [current, setCurrent] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [ratesReady, setRatesReady] = useState(false);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  useEffect(() => {
    fetchSubscriptions();
    fetchRates().then(() => setRatesReady(true));
  }, []);

  const monthStart = new Date(current.getFullYear(), current.getMonth(), 1);
  const monthEnd = new Date(current.getFullYear(), current.getMonth() + 1, 0);
  const startWeekDay = monthStart.getDay(); // 0 Sun
  const daysInMonth = monthEnd.getDate();

  const activeSubs = subscriptions.filter((s) => s.status === "active" || s.status === "trial");

  const dayMap = useMemo(() => {
    const map: Record<number, typeof activeSubs> = {};
    for (const sub of activeSubs) {
      const occs = buildOccurrences(sub, monthStart, monthEnd);
      for (const d of occs) {
        const day = d.getDate();
        if (!map[day]) map[day] = [];
        map[day].push(sub as any);
      }
    }
    return map;
  }, [activeSubs, monthStart, monthEnd]);

  const selectedSubs = selectedDay ? dayMap[selectedDay] || [] : [];

  if (!ratesReady) return <LoadingSpinner />;

  const monthLabel = current.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  return (
    <div className="mx-auto w-full max-w-[900px] px-4 pb-16 sm:px-6 lg:px-8">
      <PageHeader
        title="Calendar"
        subtitle="Subscription renewals by billing date"
        action={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrent(new Date(current.getFullYear(), current.getMonth() - 1, 1))}
              className="ui-btn-secondary px-3 py-1.5 text-[13px]"
            >
              ← Prev
            </button>
            <span className="text-[14px] font-semibold text-ink min-w-[140px] text-center">{monthLabel}</span>
            <button
              onClick={() => setCurrent(new Date(current.getFullYear(), current.getMonth() + 1, 1))}
              className="ui-btn-secondary px-3 py-1.5 text-[13px]"
            >
              Next →
            </button>
          </div>
        }
      />

      <div className="ui-card overflow-hidden p-4">
        <div className="grid grid-cols-7 gap-px bg-border rounded-card overflow-hidden">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div key={d} className="bg-surface-alt px-2 py-2 text-[11px] font-semibold text-ink-faint text-center uppercase tracking-widest">
              {d}
            </div>
          ))}
          {Array.from({ length: startWeekDay }).map((_, i) => (
            <div key={`empty-${i}`} className="bg-white min-h-[96px]" />
          ))}
          {Array.from({ length: daysInMonth }).map((_, idx) => {
            const day = idx + 1;
            const subs = dayMap[day] || [];
            const isSelected = selectedDay === day;
            return (
              <button
                key={day}
                onClick={() => setSelectedDay(subs.length ? day : null)}
                className={`bg-white min-h-[96px] p-2 text-left flex flex-col gap-1 hover:bg-surface-alt transition-colors ${isSelected ? "ring-2 ring-primary ring-inset" : ""} ${subs.length ? "cursor-pointer" : "cursor-default"}`}
              >
                <span className={`text-[12px] font-semibold ${subs.length ? "text-ink" : "text-ink-faint"}`}>{day}</span>
                <div className="space-y-1">
                  {subs.slice(0, 2).map((s: any) => (
                    <div key={s._id} className="text-[11px] leading-tight truncate bg-warm text-warm-dark rounded px-1.5 py-0.5 font-medium">
                      {s.name} {formatCurrency(convert(Number(s.amount), s.currency || "USD", currency), currency)}
                    </div>
                  ))}
                  {subs.length > 2 && (
                    <div className="text-[10px] text-ink-faint">+{subs.length - 2} more</div>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {selectedDay && (
          <div className="mt-4 border border-border rounded-card p-4 bg-surface-alt">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-[13px] font-semibold text-ink">
                Due on {monthLabel.split(" ")[0]} {selectedDay}
              </h4>
              <button onClick={() => setSelectedDay(null)} className="text-[12px] text-ink-faint hover:text-ink">Close</button>
            </div>
            <div className="space-y-2">
              {selectedSubs.map((s: any) => (
                <div key={s._id} className="flex items-center justify-between bg-white rounded-button px-3 py-2 border border-border-light">
                  <div>
                    <p className="text-[13px] font-semibold text-ink">{s.name}</p>
                    <p className="text-[11px] text-ink-faint capitalize">{s.billingCycle} · {s.category}</p>
                  </div>
                  <span className="text-[13px] font-semibold text-ink">{formatCurrency(convert(Number(s.amount), s.currency || "USD", currency), currency)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
