import type { ReactNode } from "react";

interface FeatureSectionProps {
  tag: string;
  title: string;
  paragraphs: string[];
  features: { label: string; color: string; textColor: string }[];
  mockup: ReactNode;
  reverse?: boolean;
}

export default function FeatureSection({ tag, title, paragraphs, features, mockup, reverse }: FeatureSectionProps) {
  const flexClass = reverse ? "max-[800px]:flex-col-reverse" : "max-[800px]:flex-col";

  return (
    <section className={`mx-auto w-full px-14 max-w-[1400px] justify-between pt-[68px] pb-[68px] border-b border-border flex gap-12 ${flexClass} max-[1100px]:px-9 max-[800px]:px-6 max-[580px]:px-4`}>
      <div className="max-w-[590px] [&_h2]:mb-4 [&_p]:mx-0 [&_p]:mt-0 [&_p]:mb-3 [&_p]:text-[16px] [&_p]:leading-[1.8] [&_p]:text-ink-muted">
        <span className="text-[10px] font-semibold text-ink-faint uppercase tracking-[1px]">{tag}</span>
        <h2 className="mt-2 text-[clamp(28px,3.2vw,40px)] leading-[1.06] tracking-[-0.06em] font-[550] text-ink">
          {title}
        </h2>
        {paragraphs.map((p, i) => <p key={i}>{p}</p>)}
        <div className="mt-7 grid grid-cols-2 gap-3">
          {features.map((f) => (
            <div key={f.label} className="flex min-h-[100px] flex-col rounded-card border border-border bg-surface p-4">
              <span className={`grid size-9 place-items-center rounded-badge ${f.color} ${f.textColor} mb-auto`}>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
              </span>
              <strong className="mt-3 block text-[13px] text-ink">{f.label}</strong>
            </div>
          ))}
        </div>
      </div>

      <div className="relative min-w-[420px] max-w-[44%] flex items-center justify-center max-[800px]:min-w-0 max-[800px]:max-w-none">
        {mockup}
      </div>
    </section>
  );
}
