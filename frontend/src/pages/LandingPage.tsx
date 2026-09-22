import LandingHeader from "../components/landing/LandingHeader";
import Hero from "../components/landing/Hero";
import AppPreview from "../components/landing/AppPreview";
import Manifesto from "../components/landing/Manifesto";
import HowItWorks from "../components/landing/HowItWorks";
import FeatureSection from "../components/landing/FeatureSection";
import TrackingMockup from "../components/landing/TrackingMockup";
import MonitoringMockup from "../components/landing/MonitoringMockup";
import PricingSection from "../components/landing/PricingSection";
import CtaSection from "../components/landing/CtaSection";
import LandingFooter from "../components/landing/LandingFooter";

const trackingFeatures = [
  { label: "Organize by category", color: "bg-warm", textColor: "text-warm-dark" },
  { label: "Track billing cycles", color: "bg-cat-entertainment-bg", textColor: "text-cat-entertainment-text" },
  { label: "Monthly overview", color: "bg-cat-education-bg", textColor: "text-cat-education-text" },
  { label: "Spending insights", color: "bg-cat-productivity-bg", textColor: "text-cat-productivity-text" },
];

const monitoringFeatures = [
  { label: "Price change alerts", color: "bg-warm", textColor: "text-warm-dark" },
  { label: "Renewal reminders", color: "bg-cat-productivity-bg", textColor: "text-cat-productivity-text" },
  { label: "New subscription detection", color: "bg-cat-education-bg", textColor: "text-cat-education-text" },
  { label: "Weekly spending report", color: "bg-cat-entertainment-bg", textColor: "text-cat-entertainment-text" },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-bg overflow-x-hidden">
      <LandingHeader />

      <main>
        <Hero />
        <AppPreview />
        <Manifesto />
        <HowItWorks />

        <FeatureSection
          tag="Tracking"
          title="Subscription tracking"
          paragraphs={[
            "Recuro gives you a complete view of every recurring charge. See what you're paying, when it renews, and how it fits into your monthly budget.",
            "We miss when people knew where their money was going. So we're building a little tool to help you keep track, together with your finances.",
          ]}
          features={trackingFeatures}
          mockup={<TrackingMockup />}
        />

        <FeatureSection
          tag="Monitoring"
          title="Automatic monitoring"
          paragraphs={[
            "Connect your bank and Recuro automatically detects recurring payments. Get notified when prices change, renewals approach, or new subscriptions appear.",
            "No big pitch. Just keeping you informed about where your money goes.",
          ]}
          features={monitoringFeatures}
          mockup={<MonitoringMockup />}
          reverse
        />

        <PricingSection />
        <CtaSection />
      </main>

      <LandingFooter />

      <style>{`
        @keyframes hero-float {
          0%, 100% { transform: translateY(0) rotate(var(--tw-rotate, 0deg)); }
          50% { transform: translateY(-12px) rotate(var(--tw-rotate, 0deg)); }
        }
      `}</style>
    </div>
  );
}
