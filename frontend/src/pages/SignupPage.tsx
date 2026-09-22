import { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api/client";
import AuthLayout from "../components/AuthLayout";
import OAuthButtons from "../components/OAuthButtons";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailConsent, setEmailConsent] = useState(false);
  const [preferredCurrency, setPreferredCurrency] = useState("NGN");

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.auth.requestMagicLink(email, emailConsent, preferredCurrency);
      setSent(true);
    } catch (err: any) {
      setError(err.message || "Failed to send link");
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <AuthLayout
        heading="Check your email."
        subtitle={`We sent a sign-up link to ${email}`}
        footerText="Already tracking with us?"
        footerLink="/login"
        footerLinkText="Sign in"
      >
        <div className="text-center py-4">
          <div className="w-16 h-16 bg-warm rounded-card flex items-center justify-center mx-auto mb-5">
            <svg className="w-8 h-8 text-warm-dark" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.7"><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
          </div>
          <p className="text-[15px] text-ink-muted leading-relaxed mb-6">
            Click the link in the email to create your account.
          </p>
          <button onClick={() => { setSent(false); setEmail(""); }} className="text-[14px] text-primary hover:text-primary-hover font-semibold transition-colors">
            Use a different email
          </button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      heading="Start tracking."
      subtitle="Create your Recuro account in seconds"
      footerText="Already tracking with us?"
      footerLink="/login"
      footerLinkText="Sign in"
    >
      <OAuthButtons />
      <div className="flex items-center gap-4 my-6 mx-0 text-ink-muted text-[11px] before:content-[''] before:flex-1 before:h-px before:bg-border after:content-[''] after:flex-1 after:h-px after:bg-border">
        <span>or, the good old email way</span>
      </div>

      <form onSubmit={handleMagicLink} className="flex flex-col gap-5">
        {error && (
          <div className="bg-error-bg border border-error-border text-error-text text-[14px] p-3.5 rounded-button">{error}</div>
        )}
        <div className="flex flex-col">
          <label className="ui-label text-[15px] mb-2.5">Email address</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@somewhere.nice"
            className="w-full border border-border-input bg-input-bg h-[50px] py-0 px-4 rounded-button text-ink-body text-[15px] outline-none transition-[border-color,box-shadow] placeholder:text-input-placeholder focus:border-primary focus:shadow-[0_0_0_3px_#primary-shadow]"
          />
        </div>

        <div className="flex flex-col gap-3">
          <label className="text-[13px] font-semibold text-ink">Preferred currency</label>
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

        <label className="flex items-start gap-3 p-3 rounded-button hover:bg-surface-alt transition-colors cursor-pointer">
          <input
            type="checkbox"
            checked={emailConsent}
            onChange={(e) => setEmailConsent(e.target.checked)}
            className="w-4 h-4 rounded border-border-input text-primary focus:ring-primary mt-0.5"
          />
          <div>
            <span className="text-[13px] font-semibold text-ink block">Allow Recuro to send me emails</span>
            <span className="text-[11px] text-ink-faint leading-relaxed block mt-0.5">
              Receive subscription reminders, important account and transaction updates, and occasional Recuro offers and product updates.
            </span>
          </div>
        </label>

        <button
          type="submit"
          disabled={loading}
          className="ui-btn-primary w-full min-h-[50px] text-[15px] mt-1"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
              Sending...
            </span>
          ) : (
            <>
              Send code
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6C9 6 15 10.4189 15 12C15 13.5812 9 18 9 18"/></svg>
            </>
          )}
        </button>
        <p className="m-0 text-center text-[11px] leading-5 text-ink-muted">
          By creating an account, you agree to the <Link to="/terms" className="font-semibold text-link-text underline underline-offset-2 hover:text-link-hover">Terms</Link> and <Link to="/privacy" className="font-semibold text-link-text underline underline-offset-2 hover:text-link-hover">Privacy Policy</Link>.
        </p>
      </form>
    </AuthLayout>
  );
}
