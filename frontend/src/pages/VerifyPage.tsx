import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL || "";

export default function VerifyPage() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<"loading" | "error">("loading");

  useEffect(() => {
    const token = searchParams.get("token");
    if (token) {
      window.location.href = `${API_URL}/api/auth/verify?token=${token}`;
    } else {
      setStatus("error");
    }
  }, [searchParams]);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-orange-panel-card-border border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[13px] text-ink-faint">Verifying your link...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-6">
      <div className="text-center max-w-sm">
        <div className="w-14 h-14 bg-error-bg rounded-card flex items-center justify-center mx-auto mb-5">
          <svg className="w-7 h-7 text-error-action" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.7"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
        </div>
        <h2 className="text-[20px] font-semibold text-ink mb-2 tracking-[-0.5px]">Invalid link</h2>
        <p className="text-[13px] text-ink-faint mb-8">This link is invalid or has expired.</p>
        <Link to="/login" className="ui-btn-primary min-h-[50px] px-6 py-3 text-[14px]">
          Back to login
        </Link>
      </div>
    </div>
  );
}
