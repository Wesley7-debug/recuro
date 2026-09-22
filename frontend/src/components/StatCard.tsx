interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string | null;
  icon: string;
  color: string;
  bg: string;
}

export default function StatCard({ label, value, sub, icon, color, bg }: StatCardProps) {
  return (
    <div className="ui-card-hover p-5">
      <div className={`w-10 h-10 ${bg} rounded-badge flex items-center justify-center mb-3`}>
        <svg className={`w-5 h-5 ${color}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
        </svg>
      </div>
      <p className="text-[10px] text-ink-faint font-semibold uppercase tracking-[1px] mb-1">{label}</p>
      <p className="text-[24px] font-[550] text-ink tracking-[-0.045em]">{value}</p>
      {sub && <p className="text-[11px] text-ink-ghost mt-0.5">{sub}</p>}
    </div>
  );
}
