import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

const navItems = [
  { to: "/dashboard", label: "Overview", end: true, icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
  { to: "/dashboard/subscriptions", label: "Subscriptions", icon: "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" },
  { to: "/dashboard/calendar", label: "Calendar", icon: "M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" },
  { to: "/dashboard/notifications", label: "Notifications", icon: "M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" },
  { to: "/dashboard/settings", label: "Settings", icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" },
];

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const renderSidebar = (showClose: boolean) => (
    <>
      <div className="px-6 h-[60px] flex items-center justify-between border-b border-border">
        <NavLink to="/dashboard" className="flex items-center gap-2 text-[20px] leading-none font-extrabold tracking-[-1px] text-ink">
          Recuro<span className="text-primary">.</span>
        </NavLink>
        {showClose && (
          <button onClick={() => setMobileOpen(false)} className="p-2 text-ink-faint hover:text-ink rounded-button">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-button text-[13px] font-semibold transition-all ${
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-ink-faint hover:text-ink hover:bg-cat-other-bg"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <svg className={`w-4 h-4 ${isActive ? "text-primary" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                </svg>
                {item.label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="px-4 py-4 border-t border-border">
        <div className="flex items-center gap-3 px-1 mb-3">
          <div className="w-8 h-8 bg-warm rounded-badge flex items-center justify-center text-warm-dark text-[11px] font-bold">
            {user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-[13px] font-semibold text-ink truncate">{user?.name || user?.email}</p>
            <p className="text-[11px] text-ink-faint truncate">{user?.email}</p>
          </div>
        </div>
        <button onClick={handleLogout} className="w-full text-left px-3 py-2.5 rounded-button text-[13px] font-semibold text-ink-faint hover:text-ink hover:bg-cat-other-bg transition-all">
          Logout
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-bg">
      <aside className="hidden md:flex fixed inset-y-0 left-0 w-[240px] bg-bg border-r border-border flex-col z-40">
        {renderSidebar(false)}
      </aside>

      <header className="md:hidden sticky top-0 z-40 bg-bg/90 backdrop-blur-xl border-b border-border">
        <div className="flex items-center justify-between px-4 h-[60px]">
          <NavLink to="/dashboard" className="flex items-center gap-2 text-[20px] leading-none font-extrabold tracking-[-1px] text-ink">
            Recuro<span className="text-primary">.</span>
          </NavLink>
          <button onClick={() => setMobileOpen(true)} className="p-2 text-ink-faint hover:text-ink rounded-button">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          </button>
        </div>
      </header>

      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-[260px] bg-bg flex flex-col shadow-[0_20px_60px_rgba(30,31,28,0.2)]">
            {renderSidebar(true)}
          </aside>
        </div>
      )}

      <div className="md:pl-[240px]">
        <main className="max-w-[1200px] mx-auto px-6 sm:px-12 py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
