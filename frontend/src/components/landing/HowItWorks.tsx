const steps = [
  { step: "01", title: "Add your subscriptions", desc: "Manually add the services you pay for. Netflix, Spotify, your gym membership — all in one place." },
  { step: "02", title: "Track spending", desc: "See exactly how much you spend on subscriptions each month, quarter, and year." },
  { step: "03", title: "Stay informed", desc: "Get alerts before renewals, detect price changes, and never miss a subscription again." },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="mx-auto w-full px-14 max-w-[1400px] pt-[68px] pb-[68px] border-b border-border max-[1100px]:px-9 max-[800px]:px-6 max-[580px]:px-4">
      <div className="text-center mb-14">
        <h2 className="text-[clamp(28px,3.2vw,48px)] leading-[1.06] tracking-[-0.06em] font-[550] text-ink">
          A little less forgotten.<br />A lot more saved.
        </h2>
      </div>
      <div className="grid md:grid-cols-3 gap-5">
        {steps.map((item) => (
          <div key={item.step} className="ui-card p-8 hover:border-border-hover hover:shadow-[0_8px_24px_rgba(67,55,41,0.06)] transition-all group">
            <div className="text-[40px] font-[550] text-cat-other-bg group-hover:text-cat-social-bg transition-colors mb-3 tracking-[-0.045em]">{item.step}</div>
            <h3 className="text-[16px] font-semibold text-ink mb-2">{item.title}</h3>
            <p className="text-[14px] text-ink-muted leading-[1.65]">{item.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
