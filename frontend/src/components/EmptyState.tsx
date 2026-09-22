import type { ReactNode } from "react";

interface EmptyStateProps {
  icon: string;
  title: string;
  description: string;
  action?: ReactNode;
}

export default function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="ui-card p-16 text-center">
      <div className="w-16 h-16 bg-cat-other-bg rounded-card flex items-center justify-center mx-auto mb-5">
        <svg className="w-8 h-8 text-ink-ghost" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
        </svg>
      </div>
      <h3 className="text-[16px] font-semibold text-ink mb-2">{title}</h3>
      <p className="text-[13px] text-ink-faint mb-6 max-w-sm mx-auto">{description}</p>
      {action}
    </div>
  );
}
