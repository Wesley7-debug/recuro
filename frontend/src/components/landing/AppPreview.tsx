import { Link } from "react-router-dom";

export default function AppPreview() {
  return (
    <div className="mx-auto w-full px-14 max-w-[1400px] max-[1100px]:px-9 max-[800px]:px-6 max-[580px]:px-4">
      <div className="border border-solid border-mockup-border rounded-[11px] overflow-hidden shadow-[0_3px_1px_#shadow-subtle,0_18px_60px_#shadow-large]">
        <div className="h-[38px] py-0 px-4 bg-mockup-toolbar-bg border-b border-solid border-b-mockup-toolbar-border-alt flex items-center">
          <div className="flex gap-1.5 w-[91px]">
            <span className="rounded-full border border-solid border-mockup-traffic-border size-[7px] bg-mockup-traffic-gray"></span>
            <span className="rounded-full border border-solid border-mockup-traffic-border size-[7px] bg-mockup-traffic-green"></span>
            <span className="rounded-full border border-solid border-mockup-traffic-border size-[7px]"></span>
          </div>
        </div>
        <div className="flex h-[450px] max-[800px]:h-[350px] max-[580px]:block max-[580px]:h-auto max-[580px]:min-h-[470px] bg-bg">
          <aside className="relative w-[220px] shrink-0 py-3 px-3.5 bg-border-light border-r border-solid border-r-mockup-divider max-[580px]:hidden">
            <div className="mb-4">
              <strong className="text-[14px] text-ink block">Recuro</strong>
              <span className="text-[11px] text-ink-faint">4 active subscriptions</span>
            </div>
            <div className="flex flex-col gap-0.5">
              {["Overview", "Subscriptions", "Transactions", "Notifications"].map((ch, i) => (
                <button key={ch} className={`flex items-center gap-2 w-full text-left px-2.5 py-1.5 rounded-[5px] text-[13px] transition-colors ${i === 1 ? "bg-cat-education-bg text-cat-education-text font-semibold" : "text-ink-muted hover:bg-border"}`}>
                  {ch}
                  {i === 2 && <span className="ml-auto text-[10px] bg-primary text-primary-text px-1.5 py-0.5 rounded-full font-semibold">3</span>}
                </button>
              ))}
            </div>
            <div className="mt-6 text-[9px] font-semibold tracking-[1px] text-ink-faint uppercase mb-2">Your subscriptions</div>
            <div className="flex flex-col gap-1.5">
              {[
                { name: "Netflix", color: "bg-warm text-warm-dark" },
                { name: "Spotify", color: "bg-cat-education-bg text-cat-education-text" },
                { name: "Figma", color: "bg-cat-entertainment-bg text-cat-entertainment-text" },
              ].map((f) => (
                <div key={f.name} className="flex items-center gap-2">
                  <span className={`inline-flex items-center justify-center size-[22px] rounded-[6px] text-[9px] font-bold ${f.color}`}>{f.name[0]}</span>
                  <span className="text-[12px] text-ink-muted">{f.name}</span>
                </div>
              ))}
            </div>
          </aside>
          <section className="flex flex-col flex-1 min-w-0 bg-mockup-content-bg">
            <header className="h-[46px] border-b border-solid border-b-cat-other-bg flex items-center px-5">
              <strong className="text-[13px] text-ink">Subscriptions</strong>
              <span className="ml-2 text-[11px] text-ink-faint">Manage your recurring payments</span>
            </header>
            <div className="flex-1 overflow-y-auto p-5">
              <div className="grid grid-cols-3 gap-3 mb-5 max-[800px]:grid-cols-2">
                {[
                  { label: "Monthly", value: "$68.97", bg: "bg-cat-education-bg", text: "text-cat-education-text" },
                  { label: "Active", value: "4", bg: "bg-cat-productivity-bg", text: "text-cat-productivity-text" },
                  { label: "Upcoming", value: "2", bg: "bg-warm", text: "text-warm-dark" },
                ].map((s) => (
                  <div key={s.label} className="rounded-badge border border-border p-3">
                    <p className="text-[9px] font-semibold text-ink-faint uppercase tracking-[1px] mb-1">{s.label}</p>
                    <p className={`text-[18px] font-[550] ${s.text}`}>{s.value}</p>
                  </div>
                ))}
              </div>
              <div className="space-y-2">
                {[
                  { name: "Netflix", amount: "$15.99", date: "Oct 3", color: "bg-warm text-warm-dark" },
                  { name: "Spotify", amount: "$10.99", date: "Oct 5", color: "bg-cat-education-bg text-cat-education-text" },
                  { name: "Figma", amount: "$12.00", date: "Oct 8", color: "bg-cat-entertainment-bg text-cat-entertainment-text" },
                  { name: "Gym", amount: "$29.99", date: "Oct 15", color: "bg-cat-productivity-bg text-cat-productivity-text" },
                ].map((sub) => (
                  <div key={sub.name} className="flex items-center justify-between p-2.5 rounded-[8px] hover:bg-border-light transition-colors">
                    <div className="flex items-center gap-2.5">
                      <span className={`inline-flex items-center justify-center size-[30px] rounded-[8px] text-[11px] font-bold ${sub.color}`}>{sub.name[0]}</span>
                      <div>
                        <p className="text-[12px] font-semibold text-ink">{sub.name}</p>
                        <p className="text-[10px] text-ink-faint">Renews {sub.date}</p>
                      </div>
                    </div>
                    <span className="text-[12px] font-semibold text-ink">{sub.amount}/mo</span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
        <div className="flex items-center justify-between h-[32px] py-0 px-4 border-t border-solid border-t-mockup-status-border bg-mockup-status-bg text-cat-education-text text-[9px]">
          <span className="flex items-center gap-1.5"><span className="size-[7px] rounded-full bg-cat-education-dot"></span> Room for all your subscriptions. Including new ones.</span>
          <Link to="/signup" className="font-semibold text-cat-education-dot hover:text-primary-hover transition-colors flex items-center gap-1">Start tracking <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M7 17L17 7M17 7H7M17 7v10"/></svg></Link>
        </div>
      </div>
    </div>
  );
}
