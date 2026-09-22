import { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { api } from "../../lib/api/client";
import PageHeader from "../../components/PageHeader";
import FormField from "../../components/FormField";

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
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");
    try {
      await api.user.updateProfile({
        name,
        email,
        preferred_currency: preferredCurrency,
        email_notifications_enabled: emailConsent,
      });
      await refreshUser();
      setMessage("Changes saved");
    } catch (err: any) {
      setError(err.message || "Failed to update");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Settings"
        subtitle="Manage your account and preferences"
      />

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
          {message && (
            <div className="bg-success-bg border border-success-border text-success-text text-[13px] p-3 rounded-button mb-4 flex items-center gap-2">
              <svg
                className="w-4 h-4 flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
              {message}
            </div>
          )}
          {error && (
            <div className="bg-error-bg border border-error-border text-error-text text-[13px] p-3 rounded-button mb-4 flex items-center gap-2">
              <svg
                className="w-4 h-4 flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
              {error}
            </div>
          )}
          <form onSubmit={handleSave} className="flex flex-col gap-4">
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
              disabled={saving}
              className="ui-btn-primary self-start"
            >
              {saving ? (
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
                "Save changes"
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
        </div>
      </div>
    </div>
  );
}
