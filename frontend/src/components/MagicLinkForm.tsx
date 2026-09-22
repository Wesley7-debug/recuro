import { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api/client";

interface MagicLinkFormProps {
  mode: "login" | "signup";
}

export default function MagicLinkForm({ mode }: MagicLinkFormProps) {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.auth.requestMagicLink(email);
      setSent(true);
    } catch (err: any) {
      setError(err.message || "Failed to send link");
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 bg-warm rounded-card flex items-center justify-center mx-auto mb-5">
          <svg className="w-8 h-8 text-warm-dark" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.7"><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
        </div>
        <h3 className="font-semibold text-ink text-[20px] mb-2">Check your email</h3>
        <p className="text-[15px] text-ink-muted leading-relaxed">
          We sent a {mode === "login" ? "sign-in" : "sign-up"} link to<br /><strong className="text-ink-body">{email}</strong>
        </p>
        <button onClick={() => { setSent(false); setEmail(""); }} className="text-[14px] text-primary hover:text-primary-hover font-semibold mt-6 transition-colors">
          Use a different email
        </button>
      </div>
    );
  }

  return (
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
        By {mode === "login" ? "signing in" : "creating an account"}, you agree to the <Link to="/" className="font-semibold text-link-text underline underline-offset-2 hover:text-link-hover">Terms</Link> and <Link to="/" className="font-semibold text-link-text underline underline-offset-2 hover:text-link-hover">Privacy Policy</Link>.
      </p>
    </form>
  );
}
