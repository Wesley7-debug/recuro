export default function PricingSection() {
  return (
    <section className="mx-auto w-full px-14 max-w-[1400px] py-[68px] max-[1100px]:px-9 max-[800px]:px-6 max-[580px]:px-4">
      <div className="relative isolate grid min-h-[500px] grid-cols-[minmax(0,0.85fr)_minmax(460px,1.15fr)] items-center gap-12 overflow-hidden rounded-[34px] bg-ink-secondary px-12 py-11 text-white max-[800px]:grid-cols-1 max-[800px]:px-8 max-[580px]:rounded-[24px] max-[580px]:px-6">
        <div className="relative z-1 max-w-[520px]">
          <h2 className="mb-5 text-[clamp(32px,4.6vw,52px)] leading-[0.99] tracking-[-0.06em]">
            Free. No hidden fees.
          </h2>
          <p className="max-w-[460px] text-[15px] leading-[1.8] text-ink-ghost">
            Recuro is free to use. Track unlimited subscriptions, upload statements, and get billing reminders — all at no cost.
          </p>
          <div className="mt-8 grid grid-cols-1 gap-3 max-w-[320px]">
            <div className="flex min-h-[128px] flex-col rounded-card border border-white/12 bg-white/5 p-4.5">
              <div className="flex items-start justify-between gap-3">
                <span className="grid size-10 place-items-center rounded-[12px] bg-primary text-primary-text">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                </span>
                <span className="rounded-full border border-white/12 px-2.5 py-1 text-[9px] font-semibold tracking-[0.04em] text-ink-badge">FREE</span>
              </div>
              <strong className="mt-auto block text-[16px]">$0/mo</strong>
              <span className="mt-0.5 text-[11px] text-ink-ghost">Track everything, forever free</span>
            </div>
          </div>
        </div>

        <div className="relative min-h-[420px] max-[800px]:min-h-[300px]" aria-hidden="true">
          <div className="absolute top-0 left-0 w-[92%] overflow-hidden rounded-card border border-white/18 bg-bg text-ink-secondary shadow-[0_24px_70px_rgba(0,0,0,0.28)]">
            <div className="flex h-10 items-center gap-1.5 border-b border-border bg-surface-alt px-3.5">
              <span className="size-2 rounded-full bg-primary-hover"></span>
              <span className="size-2 rounded-full bg-cat-finance-dot"></span>
              <span className="size-2 rounded-full bg-cat-utilities-dot"></span>
              <span className="ml-auto text-[8px] font-semibold text-ink-faint">Recuro dashboard</span>
            </div>
            <div className="grid h-[320px] grid-cols-[28%_1fr] max-[580px]:h-[240px]">
              <div className="bg-border-light border-r border-mockup-divider p-3">
                <div className="text-[9px] font-semibold text-ink-faint uppercase tracking-[1px] mb-2">Subscriptions</div>
                {["Netflix", "Spotify", "Figma", "Gym"].map((n, i) => (
                  <div key={n} className={`flex items-center gap-1.5 px-2 py-1 rounded text-[11px] mb-0.5 ${i === 0 ? "bg-cat-education-bg text-cat-education-text font-semibold" : "text-ink-muted"}`}>{n}</div>
                ))}
              </div>
              <div className="bg-mockup-content-bg p-4">
                <div className="text-[13px] font-semibold text-ink mb-3">Monthly spending</div>
                <div className="flex items-end gap-1.5 h-[120px] mb-4">
                  {[40, 65, 45, 80, 55, 70, 60].map((h, i) => (
                    <div key={i} className="flex-1 rounded-t-[4px] bg-border" style={{ height: `${h}%` }}></div>
                  ))}
                </div>
                <div className="flex justify-between text-[9px] text-ink-faint">
                  <span>Jan</span><span>Feb</span><span>Mar</span><span>Apr</span><span>May</span><span>Jun</span><span>Jul</span>
                </div>
              </div>
            </div>
          </div>
          <div className="absolute right-0 bottom-0 h-[330px] w-[33%] overflow-hidden rounded-[32px] border-[7px] border-ink bg-bg text-ink-secondary shadow-[0_22px_60px_rgba(0,0,0,0.34)] max-[580px]:hidden">
            <span className="absolute top-2 left-1/2 h-1.5 w-12 -translate-x-1/2 rounded-full bg-ink"></span>
            <div className="pt-6 px-3">
              <div className="text-[10px] font-semibold text-ink mb-2">Subscriptions</div>
              {["Netflix", "Spotify", "Figma"].map((n) => (
                <div key={n} className="flex items-center justify-between px-2 py-1.5 text-[9px]">
                  <span className="text-ink-muted">{n}</span>
                  <span className="font-semibold text-ink">$15.99</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
