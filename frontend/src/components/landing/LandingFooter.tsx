import { Link } from "react-router-dom";

export default function LandingFooter() {
  return (
    <footer className="mx-auto flex min-h-[100px] w-full px-14 max-w-[1400px] items-center justify-between gap-6 max-[1100px]:px-9 max-[800px]:px-6 max-[580px]:px-4">
      <Link to="/" className="inline-flex items-center gap-2 text-[23px] leading-none font-extrabold tracking-[-1.5px] text-ink">
        Recuro<span className="text-primary">.</span>
      </Link>
      <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[10px] text-ink-muted">
        <Link to="/privacy" className="hover:text-primary transition-colors">Privacy</Link>
        <Link to="/terms" className="hover:text-primary transition-colors">Terms</Link>
      </nav>
      <div className="flex items-center gap-4">
        <span className="font-mono text-[9px] text-ink-faint">&copy; 2026 Recuro</span>
      </div>
    </footer>
  );
}
