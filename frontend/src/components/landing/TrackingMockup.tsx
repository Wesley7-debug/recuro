export default function TrackingMockup() {
  return (
    <div className="w-full rounded-card border border-border bg-surface shadow-[0_3px_1px_#shadow-subtle,0_18px_60px_#shadow-large] overflow-hidden">
      <div className="h-[38px] bg-mockup-toolbar-bg border-b border-mockup-toolbar-border flex items-center gap-1.5 px-3.5">
        <span className="size-2 rounded-full bg-primary-hover"></span>
        <span className="size-2 rounded-full bg-cat-finance-dot"></span>
        <span className="size-2 rounded-full bg-cat-utilities-dot"></span>
        <span className="ml-auto text-[8px] font-semibold text-ink-faint">Recuro for desktop</span>
      </div>
      <div className="grid h-[320px] grid-cols-[28%_1fr]">
        <div className="bg-border-light border-r border-mockup-divider p-3">
          <div className="text-[9px] font-semibold text-ink-faint uppercase tracking-[1px] mb-2">Subscriptions</div>
          {["Netflix", "Spotify", "Figma", "Gym"].map((n, i) => (
            <div key={n} className={`flex items-center gap-1.5 px-2 py-1 rounded text-[11px] mb-0.5 ${i === 0 ? "bg-cat-education-bg text-cat-education-text font-semibold" : "text-ink-muted"}`}>{n}</div>
          ))}
        </div>
        <div className="bg-mockup-content-bg p-4">
          <div className="text-[13px] font-semibold text-ink mb-3">Netflix</div>
          <div className="space-y-2">
            <div className="flex justify-between text-[11px]"><span className="text-ink-faint">Amount</span><span className="font-semibold text-ink">$15.99/mo</span></div>
            <div className="flex justify-between text-[11px]"><span className="text-ink-faint">Next renewal</span><span className="font-semibold text-ink">Oct 3, 2026</span></div>
            <div className="flex justify-between text-[11px]"><span className="text-ink-faint">Category</span><span className="font-semibold text-ink">Entertainment</span></div>
            <div className="flex justify-between text-[11px]"><span className="text-ink-faint">Status</span><span className="font-semibold text-cat-education-text">Active</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}
