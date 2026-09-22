import { Link } from "react-router-dom";

export default function LandingHeader() {
  return (
    <header className="mx-auto flex h-[72px] w-full px-14 items-center justify-between gap-7 max-w-[1400px] max-[1100px]:px-9 max-[800px]:h-[68px] max-[800px]:px-6 max-[580px]:h-[56px] max-[580px]:px-4">
      <Link to="/" className="inline-flex items-center gap-2 text-[29px] leading-none font-extrabold tracking-[-1.5px] w-fit max-[580px]:text-[26px]">
        Recuro<span className="text-primary">.</span>
      </Link>
      <div className="flex items-center gap-6 max-[1100px]:gap-4 max-[580px]:gap-2.5">
        <Link to="/login" className="text-[13px] font-semibold text-ink-muted transition-colors hover:text-primary">Log in</Link>
        <Link to="/signup" className="inline-flex min-h-[42px] items-center justify-center gap-3 whitespace-nowrap rounded-button border border-transparent bg-ink px-4 py-2.5 text-[13px] font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-ink-hover active:translate-y-0">
          Get started <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 17L17 7M17 7H7M17 7v10"/></svg>
        </Link>
      </div>
    </header>
  );
}
