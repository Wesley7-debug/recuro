import type { ReactNode } from "react";
import { Link } from "react-router-dom";

interface AuthLayoutProps {
  heading: string;
  subtitle: string;
  children: ReactNode;
  footerText: string;
  footerLink: string;
  footerLinkText: string;
}

export default function AuthLayout({
  heading,
  subtitle,
  children,
  footerText,
  footerLink,
  footerLinkText,
}: AuthLayoutProps) {
  return (
    <div className="flex min-h-svh max-[580px]:block">
      {/* Left Panel */}
      <aside className="relative md:flex w-[44%] shrink-0 flex-col overflow-hidden hidden bg-primary px-14 py-10 text-ink-strong max-[800px]:w-[41%] max-[800px]:px-8 max-[580px]:min-h-[320px] max-[580px]:w-full max-[580px]:p-8">
        {/* Logo Header */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-[32px] font-extrabold tracking-[-1.5px] text-ink-strong"
        >
          {/* Logo Icon */}
          <span className="flex size-9 items-center justify-center rounded-xl bg-ink-strong text-lg text-primary">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 9h12v2H6V9zm8 5H6v-2h8v2zm4-6H6V6h12v2z" />
            </svg>
          </span>
          recuro<span className="text-orange-panel-dot">.</span>
        </Link>

        {/* Hero Section Content */}
        <div className="my-auto w-full max-w-[460px] max-[580px]:py-6">
          <h1 className="my-6 text-[clamp(48px,5vw,76px)] font-bold leading-[0.98] tracking-[-0.05em] text-ink-strong max-[580px]:my-2 max-[580px]:text-[38px]">
            Right where
            <br />
            you <em className="not-italic text-white">belong.</em>
          </h1>
          <p className="m-0 text-[18px] leading-[1.6] text-orange-panel-body max-[800px]:text-[15px] max-[580px]:hidden">
            Track every subscription. Never lose
            <br />
            sight of where your money goes.
          </p>

          {/* Interactive Dynamic Floating Cards */}
          <div className="mt-12 space-y-4 max-[800px]:mt-8 max-[580px]:hidden">
            {/* Upper Card */}
            <div className="relative w-[92%] -rotate-2 rounded-card bg-orange-panel-card-bg p-5 shadow-[0_12px_30px_rgba(0,0,0,0.06)]">
              <div className="flex items-start gap-3.5">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-avatar-neutral-bg text-sm font-bold text-avatar-neutral-text">
                  J
                </span>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <strong className="text-[14px] font-bold text-ink-strong">
                      Jamie
                    </strong>
                    <span className="text-[12px] text-ink-tertiary">just now</span>
                  </div>
                  <p className="mt-1 text-[14px] text-ink-body-muted">
                    just found all my forgotten subs. wow.
                  </p>
                </div>
              </div>
            </div>

            {/* Lower Card */}
            <div className="relative ml-8 w-[92%] rotate-2 rounded-card bg-orange-panel-card-bg p-5 shadow-[0_12px_30px_rgba(0,0,0,0.06)]">
              <div className="flex items-start gap-3.5">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-success-bg text-sm font-bold text-success-text">
                  Y
                </span>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <strong className="text-[14px] font-bold text-ink-strong">
                      You
                    </strong>
                    <span className="text-[12px] text-ink-tertiary">just now</span>
                  </div>
                  <p className="mt-1 text-[14px] text-ink-body-muted">
                    finally know where it all goes.
                  </p>
                </div>
              </div>
              {/* Floating Reaction Badge */}
              <div className="absolute -bottom-3 right-6 flex items-center gap-1 rounded-full bg-notification-pill-bg px-3 py-1 text-[12px] font-bold text-primary shadow-sm">
                ✨ <span className="text-notification-count">3</span>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Right Panel */}
      <section className="flex h-full ml-25 min-w-0 flex-1 flex-col px-12 max-[800px]:px-8 max-[580px]:min-h-0 max-[580px]:px-6">
        {/* Top Header Navigation Bar */}
        <div className="flex w-full items-center justify-between gap-4 py-8 text-[13px] text-ink-faint max-[580px]:py-5">
          <Link
            to="/"
            className="flex items-center gap-1.5 text-ink-subtle transition-colors hover:text-ink"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M15 18l-6-6 6-6" />
            </svg>
            Back to home
          </Link>
          <span>
            New around here?{" "}
            <Link
              to={footerLink}
              className="font-semibold text-ink transition-colors hover:text-primary"
            >
              {footerLinkText}{" "}
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="inline"
              >
                <path d="M7 17L17 7M17 7H7M17 7V17" />
              </svg>
            </Link>
          </span>
        </div>

        {/* Content Box */}
        <div className="my-auto w-full max-w-[420px] py-10 max-[800px]:max-w-[380px] max-[580px]:max-w-none max-[580px]:py-10">
          <div className="mb-10">
            <h2 className="my-0 text-[42px] font-semibold leading-[1.1] tracking-[-1.8px] text-ink max-[800px]:text-[36px] max-[580px]:text-[34px]">
              {heading}
            </h2>
            <p className="mt-3 text-[16px] leading-[1.6] text-ink-desc max-[800px]:text-[14px]">
              {subtitle}
            </p>
          </div>

          {children}

          <div className="mt-8 border-t border-border pt-6 text-center text-[13px] text-ink-footer">
            {footerText}{" "}
            <Link
              to={footerLink}
              className="ml-1 inline-flex items-center gap-0.5 font-semibold text-ink transition-colors hover:text-primary"
            >
              {footerLinkText}{" "}
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="inline"
              >
                <path d="M7 17L17 7M17 7H7M17 7V17" />
              </svg>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
