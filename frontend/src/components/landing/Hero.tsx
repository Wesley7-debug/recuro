import { Link } from "react-router-dom";

export default function Hero() {
  return (
    <section className="relative isolate mx-auto mb-12 w-full px-14 max-w-[1400px] overflow-hidden rounded-[36px] bg-[radial-gradient(circle_at_center,var(--color-bg-gradient-center)_0%,var(--color-bg-gradient-edge)_68%)] pt-[68px] pb-20 text-center max-[1100px]:px-9 max-[800px]:px-6 max-[580px]:px-4 max-[580px]:rounded-[24px] max-[580px]:pt-10 max-[580px]:pb-14">
      <div
        className="pointer-events-none absolute inset-0 -z-1 overflow-hidden"
        aria-hidden="true"
      >
        <span className="absolute top-24 left-[5%] grid size-16 -rotate-12 place-items-center overflow-hidden rounded-[19px] border border-white/90 bg-warm shadow-[0_14px_34px_rgba(133,93,29,0.12)] [animation:hero-float_6s_ease-in-out_infinite] motion-reduce:animate-none max-[580px]:size-12 max-[580px]:rounded-[14px]">
          <svg
            className="w-7 h-7 text-warm-dark"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </span>
        <span className="absolute top-32 right-[5%] grid size-17 rotate-10 place-items-center overflow-hidden rounded-[22px] border border-white/90 bg-cat-education-bg shadow-[0_14px_34px_rgba(33,111,81,0.13)] [animation:hero-float_7s_ease-in-out_-2s_infinite] motion-reduce:animate-none max-[580px]:size-12 max-[580px]:rounded-[14px]">
          <svg
            className="w-7 h-7 text-cat-education-text"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z"
            />
          </svg>
        </span>
        <span className="absolute bottom-14 left-[13%] grid size-12 rotate-8 place-items-center overflow-hidden rounded-[15px] border border-white/90 bg-cat-entertainment-bg shadow-[0_12px_28px_rgba(83,70,150,0.12)] [animation:hero-float_5.5s_ease-in-out_-1s_infinite] motion-reduce:animate-none max-[580px]:size-10 max-[580px]:rounded-[12px]">
          <svg
            className="w-5 h-5 text-cat-entertainment-text"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
            />
          </svg>
        </span>
      </div>

      <h1 className="relative z-1 mx-auto mt-6 mb-5 w-fit text-[clamp(49px,6.9vw,100px)] leading-[0.99] font-[650] tracking-[-0.071em] text-ink max-[580px]:text-[clamp(40px,13.8vw,60px)]">
        Know where
        <br />
        your money <span className="text-primary">goes.</span>
      </h1>
      <p className="relative z-1 mx-0 mb-0 text-[16px] leading-[1.65] tracking-[-0.15px] text-ink-muted max-w-[540px] mx-auto max-[800px]:text-[14px] max-[580px]:text-[14px] max-[580px]:px-1">
        Discover, organize, and monitor every recurring subscription.
        <br className="max-[580px]:hidden" />
        Stop wasting money on forgotten charges.
      </p>
      <div className="relative z-1 mt-7 flex justify-center gap-3">
        <Link
          to="/signup"
          className="inline-flex min-h-[52px] items-center justify-center gap-3 whitespace-nowrap rounded-button border border-transparent bg-primary px-6 py-3.5 text-[14px] font-semibold text-primary-text shadow-[0_2px_0_#primary-shadow] transition-all hover:-translate-y-0.5 hover:bg-primary-hover hover:shadow-[0_5px_12px_#primary-glow] active:translate-y-0"
        >
          Start tracking free{" "}
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
            <path d="M5 12h14m-7-7l7 7-7 7" />
          </svg>
        </Link>
        <a
          href="#how-it-works"
          className="inline-flex min-h-[52px] items-center justify-center gap-3 whitespace-nowrap rounded-button border border-border bg-transparent px-6 py-3.5 text-[14px] font-semibold text-ink-body transition-all hover:-translate-y-0.5 hover:border-border-hover hover:bg-surface-alt active:translate-y-0"
        >
          Learn more
        </a>
      </div>

      <div className="absolute right-6 bottom-4 rotate-[9deg] text-[14px] leading-[1.45] text-ink-muted italic max-[800px]:hidden">
        <span>
          less scrolling.
          <br />
          more saving.
        </span>
      </div>
    </section>
  );
}
