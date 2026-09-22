import { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { api } from "../../lib/api/client";
import PageHeader from "../../components/PageHeader";
import FormField from "../../components/FormField";
import { showToast } from "../../components/Toast";

const CATEGORIES = ["entertainment","productivity","fitness","education","finance","social","utilities","other"];

export default function SettingsPage() {
  const { user, refreshUser } = useAuth();
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [preferredCurrency, setPreferredCurrency] = useState(
    user?.preferred_currency || "NGN",
  );
  const [emailConsent, setEmailConsent] = useState(
    user?.email_notifications_enabled || false,
  );
  const [budgetCaps, setBudgetCaps] = useState<Record<string, string>>(() => {
    const caps = (user as any)?.budgetCaps || (user as any)?.budget_caps || {};
    const init: Record<string, string> = {};
    for (const c of CATEGORIES) if (caps[c]) init[c] = String(caps[c]);
    return init;
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingCurrency, setSavingCurrency] = useState(false);
  const [savingEmail, setSavingEmail] = useState(false);
  const [savingCaps, setSavingCaps] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Keep local state in sync when user loads/refreshes
  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setEmail(user.email || "");
      setPreferredCurrency(user.preferred_currency || "NGN");
      setEmailConsent(!!user.email_notifications_enabled);
      const caps = (user as any)?.budgetCaps || (user as any)?.budget_caps || {};
      const init: Record<string, string> = {};
      for (const c of CATEGORIES) if (caps[c]) init[c] = String(caps[c]);
      setBudgetCaps(init);
    }
  }, [user]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setMessage("");
    setError("");
    try {
      await api.user.updateProfile({ name, email });
      await refreshUser();
      setMessage("Profile updated");
      showToast("Profile updated", "success");
    } catch (err: any) {
      setError(err.message || "Failed to update profile");
      showToast(err.message || "Failed to update profile", "error");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSaveCurrency = async () => {
    setSavingCurrency(true);
    setMessage("");
    setError("");
    try {
      await api.user.updateProfile({ preferred_currency: preferredCurrency });
      await refreshUser();
      setMessage("Currency updated");
      showToast(`Currency changed to ${preferredCurrency}`, "success");
    } catch (err: any) {
      setError(err.message || "Failed to update currency");
      showToast(err.message || "Failed to update currency", "error");
    } finally {
      setSavingCurrency(false);
    }
  };

  const handleSaveEmailPref = async () => {
    setSavingEmail(true);
    setMessage("");
    setError("");
    try {
      await api.user.updateProfile({ email_notifications_enabled: emailConsent });
      await refreshUser();
      setMessage("Email preference updated");
      showToast(emailConsent ? "Email notifications enabled" : "Email notifications disabled", "success");
    } catch (err: any) {
      setError(err.message || "Failed to update email preference");
      showToast(err.message || "Failed to update", "error");
    } finally {
      setSavingEmail(false);
    }
  };

  const handleSaveCaps = async () => {
    setSavingCaps(true);
    setMessage("");
    setError("");
    try {
      const capsPayload: Record<string, number> = {};
      for (const [k, v] of Object.entries(budgetCaps)) {
        const n = parseFloat(v);
        if (!isNaN(n) && n > 0) capsPayload[k] = n;
      }
      await api.user.updateProfile({ budgetCaps: capsPayload });
      await refreshUser();
      setMessage("Budget caps updated");
      showToast("Budget caps updated", "success");
    } catch (err: any) {
      setError(err.message || "Failed to update budget caps");
      showToast(err.message || "Failed to update budget caps", "error");
    } finally {
      setSavingCaps(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Settings"
        subtitle="Manage your account and preferences"
      />

      {(message || error) && (
        <div className="max-w-[600px] mb-4">
          {message && (
            <div className="bg-success-bg border border-success-border text-success-text text-[13px] p-3 rounded-button flex items-center gap-2">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
              {message}
            </div>
          )}
          {error && (
            <div className="bg-error-bg border border-error-border text-error-text text-[13px] p-3 rounded-button flex items-center gap-2 mt-2">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
              {error}
            </div>
          )}
        </div>
      )}

      <div className="space-y-6 max-w-[600px]">
        <div className="ui-card p-6">
          <h2 className="font-semibold text-ink mb-5 flex items-center gap-2">
            <div className="w-8 h-8 bg-cat-other-bg rounded-badge flex items-center justify-center">
              <svg
                className="w-4 h-4 text-ink-muted"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
                />
              </svg>
            </div>
            Profile
          </h2>
          <form onSubmit={handleSaveProfile} className="flex flex-col gap-4">
            <FormField label="Name">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="ui-input"
              />
            </FormField>
            <FormField label="Email">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="ui-input"
              />
            </FormField>
            <button
              type="submit"
              disabled={savingProfile}
              className="ui-btn-primary self-start"
            >
              {savingProfile ? (
                <span className="flex items-center gap-2">
                  <svg
                    className="animate-spin w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  Saving...
                </span>
              ) : (
                "Save profile"
              )}
            </button>
          </form>
        </div>

        <div className="ui-card p-6">
          <h2 className="font-semibold text-ink mb-4 flex items-center gap-2">
            <div className="w-8 h-8 bg-cat-education-bg rounded-badge flex items-center justify-center">
              <svg
                className="w-4 h-4 text-cat-education-text"
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
            </div>
            Currency
          </h2>
          <label className="text-[13px] text-ink-muted block mb-3">
            Preferred currency for displaying amounts
          </label>
          <div className="flex gap-3">
            {[
              { value: "NGN", label: "NGN", desc: "Nigerian Naira" },
              { value: "USD", label: "USD", desc: "US Dollar" },
              { value: "GBP", label: "GBP", desc: "British Pound" },
              { value: "EUR", label: "EUR", desc: "Euro" },
            ].map((c) => (
              <label
                key={c.value}
                className={`flex items-center gap-2 px-3 py-2 rounded-button border cursor-pointer transition-colors text-[13px] ${
                  preferredCurrency === c.value
                    ? "border-primary bg-primary-shadow text-ink font-semibold"
                    : "border-border hover:bg-surface-alt text-ink-muted"
                }`}
              >
                <input
                  type="radio"
                  name="currency"
                  value={c.value}
                  checked={preferredCurrency === c.value}
                  onChange={(e) => setPreferredCurrency(e.target.value)}
                  className="sr-only"
                />
                {c.label}
              </label>
            ))}
          </div>
          <button
            onClick={handleSaveCurrency}
            disabled={savingCurrency || preferredCurrency === user?.preferred_currency}
            className="ui-btn-primary mt-4 self-start disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {savingCurrency ? "Saving..." : "Update currency"}
          </button>
          {preferredCurrency !== user?.preferred_currency && (
            <p className="text-[11px] text-amber-600 mt-2">You changed currency to {preferredCurrency} — click Update currency to save.</p>
          )}
        </div>

        <div className="ui-card p-6">
          <h2 className="font-semibold text-ink mb-5 flex items-center gap-2">
            <div className="w-8 h-8 bg-cat-productivity-bg rounded-badge flex items-center justify-center">
              <svg
                className="w-4 h-4 text-cat-productivity-text"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
                />
              </svg>
            </div>
            Email
          </h2>
          <label className="flex items-start gap-3 p-3 rounded-button hover:bg-surface-alt transition-colors cursor-pointer">
            <input
              type="checkbox"
              checked={emailConsent}
              onChange={(e) => setEmailConsent(e.target.checked)}
              className="w-4 h-4 rounded border-border-input text-primary focus:ring-primary mt-0.5"
            />
            <div>
              <span className="text-[13px] font-semibold text-ink block">
                Allow Recuro to send me emails
              </span>
              <span className="text-[11px] text-ink-faint leading-relaxed block mt-0.5">
                Receive subscription reminders, important account and
                transaction updates, and occasional Recuro offers and product
                updates.
              </span>
            </div>
          </label>
          <button
            onClick={handleSaveEmailPref}
            disabled={savingEmail || emailConsent === !!user?.email_notifications_enabled}
            className="ui-btn-primary mt-4 self-start disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {savingEmail ? "Saving..." : "Update email preference"}
          </button>
        </div>

        <div className="ui-card p-6">
          <h2 className="font-semibold text-ink mb-4 flex items-center gap-2">
            <div className="w-8 h-8 bg-cat-finance-bg rounded-badge flex items-center justify-center">
              <svg className="w-4 h-4 text-cat-finance-text" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            Budget caps per category
          </h2>
          <p className="text-[12px] text-ink-faint mb-3">Set monthly budget caps in your preferred currency ({preferredCurrency}). You'll be warned if a subscription would push a category over its cap, and the dashboard shows progress bars.</p>
          {(() => {
            const raw = (user as any)?.budgetCaps || (user as any)?.budget_caps || {};
            const savedCaps = raw instanceof Map ? Object.fromEntries(raw as any) : raw;
            const entries = Object.entries(savedCaps).filter(([, v]: any) => Number(v) > 0);
            if (entries.length === 0) return <p className="text-[11px] text-ink-faint mb-4 italic">No caps set yet — set one below and click Update budget caps.</p>;
            return (
              <div className="mb-4">
                <p className="text-[11px] font-semibold tracking-widest uppercase text-ink-faint mb-2">Currently saved</p>
                <div className="flex flex-wrap gap-2">
                  {entries.map(([cat, cap]: any) => (
                    <span key={cat} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-warm text-warm-dark text-[12px] font-semibold capitalize border border-border">
                      {cat}: {cap} {preferredCurrency}
                    </span>
                  ))}
                </div>
              </div>
            );
          })()}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {CATEGORIES.map((cat) => {
              const raw2 = (user as any)?.budgetCaps || (user as any)?.budget_caps || {};
              const obj2 = raw2 instanceof Map ? Object.fromEntries(raw2 as any) : raw2;
              const savedVal = obj2[cat];
              return (
                <FormField
                  key={cat}
                  label={`${cat.charAt(0).toUpperCase()+cat.slice(1)}${savedVal ? ` (saved: ${savedVal})` : ""}`}
                >
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder={savedVal ? `Saved ${savedVal}` : "No cap"}
                    value={budgetCaps[cat] || ""}
                    onChange={(e) => setBudgetCaps({ ...budgetCaps, [cat]: e.target.value })}
                    className="ui-input"
                  />
                </FormField>
              );
            })}
          </div>
          <button
            onClick={handleSaveCaps}
            disabled={savingCaps}
            className="ui-btn-primary mt-4 self-start"
          >
            {savingCaps ? "Saving..." : "Update budget caps"}
          </button>
        </div>
      </div>
    </div>
  );
}
