import AuthLayout from "../components/AuthLayout";
import OAuthButtons from "../components/OAuthButtons";
import MagicLinkForm from "../components/MagicLinkForm";

export default function LoginPage() {
  return (
    <AuthLayout
      heading="Welcome back."
      subtitle="Sign in to keep track of your subscriptions"
      footerText="Not on Recuro yet?"
      footerLink="/signup"
      footerLinkText="Get started"
    >
      <OAuthButtons />
      <div className="flex items-center gap-4 my-6 mx-0 text-ink-muted text-[11px] before:content-[''] before:flex-1 before:h-px before:bg-border after:content-[''] after:flex-1 after:h-px after:bg-border">
        <span>or continue with email</span>
      </div>
      <MagicLinkForm mode="login" />
    </AuthLayout>
  );
}
