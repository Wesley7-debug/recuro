import { useEffect } from "react";
import { useNotificationStore } from "../../stores/notificationStore";
import PageHeader from "../../components/PageHeader";
import EmptyState from "../../components/EmptyState";
import LoadingSpinner from "../../components/LoadingSpinner";

const TYPE_CONFIG: Record<string, { bg: string; text: string; dot: string; icon: string }> = {
  price_change: { bg: "bg-warm", text: "text-warm-dark", dot: "bg-primary", icon: "M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" },
  renewal_reminder: { bg: "bg-cat-productivity-bg", text: "text-cat-productivity-text", dot: "bg-cat-productivity-dot", icon: "M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" },
  new_subscription: { bg: "bg-cat-education-bg", text: "text-cat-education-text", dot: "bg-cat-education-dot", icon: "M12 4.5v15m7.5-7.5h-15" },
  default: { bg: "bg-cat-other-bg", text: "text-cat-other-text", dot: "bg-ink-ghost", icon: "M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" },
};

function getTypeConfig(type: string) {
  return TYPE_CONFIG[type] || TYPE_CONFIG.default;
}

export default function NotificationsPage() {
  const { notifications, loading, fetchNotifications, markRead, markAllRead } = useNotificationStore();
  const unread = notifications.filter((n) => !n.read);

  useEffect(() => { fetchNotifications(); }, []);

  return (
    <div>
      <PageHeader
        title="Notifications"
        subtitle={unread.length > 0 ? `${unread.length} unread notification${unread.length > 1 ? "s" : ""}` : "All caught up"}
        action={unread.length > 0 ? (
          <button onClick={markAllRead} className="text-[13px] text-primary hover:text-primary-hover font-semibold px-3 py-2 rounded-button hover:bg-warm/50 transition-all">
            Mark all as read
          </button>
        ) : undefined}
      />

      {loading ? (
        <LoadingSpinner />
      ) : notifications.length === 0 ? (
        <EmptyState
          icon="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
          title="No notifications"
          description="You'll receive notifications about subscription changes, renewals, and alerts here."
        />
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => {
            const config = getTypeConfig(n.type);
            return (
              <div
                key={n._id}
                className={`ui-card-hover p-5 flex items-start gap-4 transition-all ${
                  !n.read ? "border-l-[3px] border-l-primary bg-orange-panel-card-bg" : ""
                }`}
              >
                <div className={`w-10 h-10 rounded-badge flex items-center justify-center flex-shrink-0 ${config.bg}`}>
                  <svg className={`w-5 h-5 ${config.text}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={config.icon} />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-[13px] font-semibold text-ink">{n.title}</p>
                    {!n.read && <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0"></div>}
                  </div>
                  <p className="text-[13px] text-ink-muted mt-1">{n.message}</p>
                  <p className="text-[11px] text-ink-ghost mt-2">{new Date(n.createdAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</p>
                </div>
                {!n.read && (
                  <button onClick={() => markRead(n._id)} className="text-[12px] text-primary hover:text-primary-hover font-semibold whitespace-nowrap px-3 py-1.5 rounded-button hover:bg-warm/50 transition-all">
                    Mark read
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
