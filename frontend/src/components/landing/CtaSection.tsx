import { Link } from "react-router-dom";

export default function CtaSection() {
  return (
    <section className="flex flex-col items-center bg-cat-utilities-bg pt-16 pb-14 text-center">
      <div className="w-full px-14 max-w-[1400px] flex flex-col items-center max-[1100px]:px-9 max-[800px]:px-6 max-[580px]:px-4">
        <span className="text-[28px] leading-none text-primary mb-4" aria-hidden="true">&#x2733;</span>
        <h2 className="mt-2 mb-7 text-[clamp(28px,4.6vw,46px)] leading-[1.06] tracking-[-0.06em] font-[550] text-ink">
          Your money is out there.<br />Give it a place to land.
        </h2>
        <Link to="/signup" className="inline-flex min-h-[52px] items-center justify-center gap-3 whitespace-nowrap rounded-button border border-transparent bg-ink px-6 py-3.5 text-[14px] font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-ink-hover active:translate-y-0">
          Make yourself at home <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14m-7-7l7 7-7 7"/></svg>
        </Link>
        <span className="mt-4 text-[11px] text-ink-muted">
          Good finances start with knowing.
        </span>
      </div>
    </section>
  );
}
