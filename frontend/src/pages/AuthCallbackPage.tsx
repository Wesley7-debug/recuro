import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { setAuthToken } from "../lib/api/client";
import { useUserStore } from "../stores/userStore";

export default function AuthCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const fetchUser = useUserStore((s) => s.fetchUser);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function finishLogin() {
      const token = searchParams.get("token");
      if (!token) {
        setError(true);
        return;
      }

      setAuthToken(token);
      await fetchUser();
      navigate("/dashboard", { replace: true });
    }

    finishLogin().catch(() => setError(true));
  }, [fetchUser, navigate, searchParams]);

  if (error) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center px-6">
        <div className="text-center max-w-sm">
          <h2 className="text-[20px] font-semibold text-ink mb-2">Login failed</h2>
          <p className="text-[13px] text-ink-faint mb-8">Please try signing in again.</p>
          <Link to="/login" className="ui-btn-primary min-h-[50px] px-6 py-3 text-[14px]">
            Back to login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-orange-panel-card-border border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-[13px] text-ink-faint">Signing you in...</p>
      </div>
    </div>
  );
}
