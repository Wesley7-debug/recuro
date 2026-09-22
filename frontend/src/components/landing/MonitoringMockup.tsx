export default function MonitoringMockup() {
  return (
    <div className="w-full rounded-card border border-border bg-surface shadow-[0_3px_1px_#shadow-subtle,0_18px_60px_#shadow-large] overflow-hidden p-5">
      <div className="text-[13px] font-semibold text-ink mb-3">Recent alerts</div>
      <div className="space-y-2">
        <div className="p-3 bg-orange-panel-card-bg rounded-badge border border-orange-panel-card-border">
          <div className="flex items-center gap-2 mb-0.5">
            <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
            <p className="text-[11px] font-semibold text-cat-social-text">Price change detected</p>
          </div>
          <p className="text-[10px] text-warm-dark ml-3.5">Netflix increased from $15.99 to $17.99</p>
        </div>
        <div className="p-3 bg-cat-productivity-bg rounded-badge border border-cat-productivity-border">
          <div className="flex items-center gap-2 mb-0.5">
            <div className="w-1.5 h-1.5 bg-cat-productivity-dot rounded-full"></div>
            <p className="text-[11px] font-semibold text-cat-productivity-text">Upcoming renewal</p>
          </div>
          <p className="text-[10px] text-status-info ml-3.5">Spotify renews in 3 days — $10.99</p>
        </div>
        <div className="p-3 bg-surface-alt rounded-badge border border-border">
          <div className="flex items-center gap-2 mb-0.5">
            <div className="w-1.5 h-1.5 bg-ink-faint rounded-full"></div>
            <p className="text-[11px] font-semibold text-ink-muted">New subscription detected</p>
          </div>
          <p className="text-[10px] text-ink-ghost ml-3.5">Figma charged $12.00 on Sep 15</p>
        </div>
      </div>
    </div>
  );
}
