import { Link } from "react-router-dom";
import LandingFooter from "../components/landing/LandingFooter";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-bg flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-bg/80 backdrop-blur-md border-b border-border">
        <div className="mx-auto max-w-[1400px] flex items-center justify-between px-14 max-[1100px]:px-9 max-[800px]:px-6 max-[580px]:px-4 h-[64px]">
          <Link to="/" className="inline-flex items-center gap-2 text-[23px] font-extrabold tracking-[-1.5px] text-ink">
            Recuro<span className="text-primary">.</span>
          </Link>
          <nav className="flex items-center gap-6 text-[13px]">
            <Link to="/terms" className="text-ink-muted hover:text-ink font-medium transition-colors">
              Terms of Service
            </Link>
            <Link to="/login" className="ui-btn-primary text-[13px] px-5 py-2">
              Sign in
            </Link>
          </nav>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1">
        <div className="mx-auto max-w-[880px] px-8 max-[580px]:px-6 py-14">
          {/* Title block */}
          <div className="mb-10">
            <p className="text-[11px] font-bold tracking-[0.14em] uppercase text-primary mb-3">Legal</p>
            <h1 className="text-[40px] font-bold tracking-[-1.5px] leading-[1.05] text-ink max-[580px]:text-[32px]">Privacy Policy</h1>
            <p className="mt-4 text-[13px] text-ink-muted leading-relaxed">
              Last updated: <span className="font-semibold text-ink-body">September 23, 2026</span> &nbsp;·&nbsp; Effective: September 23, 2026
            </p>
            <div className="mt-6 bg-warm border border-primary/15 rounded-card px-5 py-4">
              <p className="text-[13px] leading-relaxed text-ink-body">
                <strong className="text-ink">Summary:</strong> Recuro is designed to be privacy-minimal. We collect only what we need to track your subscriptions, send magic links and reminders, and improve detection. We never sell your data, we process bank statements only for your review, and you can delete your data anytime from Settings.
              </p>
            </div>
          </div>

          {/* Table of contents */}
          <nav className="mb-10 ui-card p-6">
            <h2 className="text-[11px] font-bold tracking-[0.14em] uppercase text-ink-muted mb-4">On this page</h2>
            <ol className="grid grid-cols-2 gap-2 max-[580px]:grid-cols-1 text-[13px] leading-relaxed">
              {[
                "1. Introduction",
                "2. Data Controller",
                "3. Data We Collect",
                "4. How We Use Data",
                "5. Legal Bases (GDPR)",
                "6. Sharing & Disclosure",
                "7. AI & Statement Parsing",
                "8. Cookies & Sessions",
                "9. Data Retention",
                "10. Security",
                "11. International Transfers",
                "12. Your Rights",
                "13. Email & Marketing",
                "14. Children’s Privacy",
                "15. Changes to Policy",
                "16. Contact & Complaints",
              ].map((item) => (
                <li key={item}>
                  <a href={`#section-${item.split(".")[0]}`} className="text-link-text hover:text-primary hover:underline underline-offset-2 transition-colors">
                    {item}
                  </a>
                </li>
              ))}
            </ol>
          </nav>

          <article className="prose prose-ink max-w-none flex flex-col gap-10 text-[14px] leading-[1.75] text-ink-body">
            <section id="section-1" className="scroll-mt-24">
              <h2 className="text-[20px] font-bold tracking-[-0.5px] text-ink mb-3">1. Introduction</h2>
              <p>
                Recuro (“Recuro,” “we,” “us,” or “our”) provides a subscription tracking platform that helps you organize recurring payments, detect them from bank statements, and receive timely renewal reminders. This Privacy Policy explains what personal data we collect, why we collect it, how we use and share it, how long we keep it, and the rights you have over it. It applies to our website at recuro.app, our dashboard, APIs, and emails. By using Recuro, you consent to the practices described here. If you do not agree, please do not use the Service. This Policy should be read together with our Terms of Service. We are committed to data minimization, purpose limitation, and transparency — we collect only what is necessary to deliver the features you request.
              </p>
            </section>

            <section id="section-2" className="scroll-mt-24">
              <h2 className="text-[20px] font-bold tracking-[-0.5px] text-ink mb-3">2. Data Controller</h2>
              <p>
                For purposes of the General Data Protection Regulation (GDPR) and other applicable privacy laws, Recuro is the data controller for personal data processed through the Service. Where we act as a processor for optional AI features (e.g., Google Gemini statement parsing), we remain responsible for ensuring compliant processing instructions. Our registered contact for privacy matters is <a href="mailto:privacy@recuro.app" className="text-primary hover:text-primary-hover font-semibold underline underline-offset-2">privacy@recuro.app</a>. If you are in the European Economic Area (EEA), United Kingdom, or Switzerland, you also have the right to lodge a complaint with your local supervisory authority. For Nigerian users, we comply with the Nigeria Data Protection Act 2023 (NDPA) and NDPR principles.
              </p>
            </section>

            <section id="section-3" className="scroll-mt-24">
              <h2 className="text-[20px] font-bold tracking-[-0.5px] text-ink mb-3">3. Data We Collect</h2>
              <p>We collect data in three categories:</p>
              <ul className="mt-3 list-disc pl-5 flex flex-col gap-2 marker:text-ink-muted">
                <li>
                  <strong className="text-ink">Account data:</strong> Email address (required for magic links), display name if you provide it or via Google OAuth profile, preferred currency (NGN/USD/EUR/GBP), and email notification preference (opt-in toggle). Google OAuth also provides a profile ID, name, and email.
                </li>
                <li>
                  <strong className="text-ink">Subscription &amp; usage data:</strong> Subscription records you create — name, provider, category (entertainment, productivity, fitness, etc.), amount, currency, billing cycle (weekly/monthly/quarterly/yearly), next billing date, and status (active/paused/cancelled). We also store timestamps, search/filter interactions served server-side, and anonymized analytics such as page views and feature usage without identifying you.
                </li>
                <li>
                  <strong className="text-ink">Statement &amp; transaction data:</strong> When you upload a PDF bank statement (max 10 MB), we extract text and parse dates, debits/credits, amounts, currency symbols (₦/$/€/£), and merchant names. Both deterministic parsing and, if enabled, Gemini AI extraction are used, then merged and deduplicated. Candidates are grouped by normalized merchant alias, scored 0–100 on consistency, cadence fit, and amount stability, with noise filtered (fees, ATM, transfers, taxes, processors). This data is used only to show you detection candidates scoring ≥65 with explanations, and expires after one hour unless you confirm selections.
                </li>
                <li>
                  <strong className="text-ink">Technical data:</strong> Session identifiers and cookies required for authentication (30-day sessions, magic-link tokens valid 15 minutes single-use), IP address, user-agent, and approximate region for security and rate limiting. Exchange-rate requests are cached for one hour with fallback tables and do not store personal data.
                </li>
              </ul>
              <p className="mt-3">
                We do not collect passwords (authentication is passwordless), government IDs, or full bank account numbers beyond what appears in PDFs you choose to upload. We do not access your bank via “Connect bank” as that feature is not yet implemented.
              </p>
            </section>

            <section id="section-4" className="scroll-mt-24">
              <h2 className="text-[20px] font-bold tracking-[-0.5px] text-ink mb-3">4. How We Use Data</h2>
              <p>We use personal data to:</p>
              <ul className="mt-3 list-disc pl-5 flex flex-col gap-2 marker:text-ink-muted">
                <li>Authenticate you via magic links or Google OAuth, create and maintain your session, and secure your account.</li>
                <li>Store and display your subscriptions, calculate monthly spending normalized to your preferred currency, and render upcoming renewals and spending-by-category panels.</li>
                <li>Parse uploaded statements, detect recurring payments, and let you review and confirm candidates before saving.</li>
                <li>Send transactional emails: magic links, welcome emails on first sign-in, detection summaries after uploads (if opted in), and renewal reminders at 7, 3, and 1 day before billing (if opted in), each idempotently once per billing cycle.</li>
                <li>Provide in-app notifications with unread highlighting and mark-read functionality.</li>
                <li>Operate, debug, and improve the Service — including aggregated analytics that do not identify individuals — and to comply with legal obligations, enforce Terms, and prevent fraud or abuse.</li>
              </ul>
              <p className="mt-3">We do not use your personal data for cross-site tracking, nor do we build advertising profiles. Personalization is limited to currency display and notification preferences you control.</p>
            </section>

            <section id="section-5" className="scroll-mt-24">
              <h2 className="text-[20px] font-bold tracking-[-0.5px] text-ink mb-3">5. Legal Bases (GDPR)</h2>
              <p>Where GDPR applies, we rely on the following legal bases:</p>
              <ul className="mt-3 list-disc pl-5 flex flex-col gap-2 marker:text-ink-muted">
                <li><strong className="text-ink">Contract:</strong> Processing necessary to provide the Service you request — account creation, subscription CRUD, statement parsing, dashboard, and authentication.</li>
                <li><strong className="text-ink">Consent:</strong> Email reminders and detection-summary emails, AI-enhanced parsing when you upload a statement, and optional currency preference. You may withdraw consent anytime in Settings without affecting prior lawful processing; withdrawing email consent stops future reminders.</li>
                <li><strong className="text-ink">Legitimate interests:</strong> Security (fraud prevention, rate limiting), product improvement via anonymized analytics, and ensuring idempotent reminders through the (subscriptionId, billingDate, reminderType) index. We balance these interests against your rights.</li>
                <li><strong className="text-ink">Legal obligation:</strong> Retention for tax, accounting, or law-enforcement requests where applicable.</li>
              </ul>
            </section>

            <section id="section-6" className="scroll-mt-24">
              <h2 className="text-[20px] font-bold tracking-[-0.5px] text-ink mb-3">6. Sharing &amp; Disclosure</h2>
              <p>
                We do not sell, rent, or trade your personal data. We share data only with service providers necessary to operate Recuro, under contracts that limit their use to our instructions: MongoDB Atlas (database hosting), Google OAuth (authentication), Gmail via Nodemailer (email delivery), Google Gemini (optional AI parsing, only when you upload a statement and only the extracted text is sent), and exchange-rate data providers (no personal data). These providers act as processors. We may also disclose data if required by law, to respond to valid legal process, to protect rights and safety, or in connection with a merger, acquisition, or asset sale — with notice to you where legally permitted. We publish no personal data publicly without your explicit consent.
              </p>
            </section>

            <section id="section-7" className="scroll-mt-24">
              <h2 className="text-[20px] font-bold tracking-[-0.5px] text-ink mb-3">7. AI &amp; Statement Parsing</h2>
              <p>
                Statement parsing begins deterministically: we extract text from your PDF locally, parse dates and amounts, and score merchants. If a Gemini API key is configured, we also send anonymized extracted transaction lines to Google Gemini for enhancement; both result sets are merged and deduplicated before scoring. We do not send your entire PDF or unrelated personal data to the AI provider, and we do not use your statements to train models. Results are held temporarily (1-hour expiry) and only saved if you confirm. You may use Recuro without AI parsing — deterministic detection still functions. By uploading, you warrant you have permission for the data contained and understand AI output may be imperfect and requires your review.
              </p>
            </section>

            <section id="section-8" className="scroll-mt-24">
              <h2 className="text-[20px] font-bold tracking-[-0.5px] text-ink mb-3">8. Cookies &amp; Sessions</h2>
              <p>
                We use essential cookies and server-side sessions to keep you logged in for 30 days, to remember your session ID, and to protect against CSRF and abuse. Magic-link tokens are single-use and expire in 15 minutes. We do not use third-party advertising cookies. You may block cookies in your browser, but essential session cookies are required for the dashboard to function. We do not use fingerprinting or cross-site trackers. Analytics, where used, is first-party, anonymized, and does not rely on persistent identifiers.
              </p>
            </section>

            <section id="section-9" className="scroll-mt-24">
              <h2 className="text-[20px] font-bold tracking-[-0.5px] text-ink mb-3">9. Data Retention</h2>
              <p>
                We retain account and subscription data for as long as your account is active, or until you delete it via Settings or by contacting us. Magic-link tokens are deleted after single use or expiry; detection results expire after one hour. Session records persist for 30 days or until logout. Email logs (e.g., reminder send records with the unique idempotency index) are kept for 12 months for deliverability and audit, then deleted or anonymized. Backups are retained for up to 30 days. If you request deletion, we will erase your personal data within 30 days except where retention is required by law or for legitimate security logs, in which case data is isolated and minimized.
              </p>
            </section>

            <section id="section-10" className="scroll-mt-24">
              <h2 className="text-[20px] font-bold tracking-[-0.5px] text-ink mb-3">10. Security</h2>
              <p>
                We implement reasonable technical and organizational measures: encrypted transport (HTTPS/TLS), hashed and expiring tokens, server-side session storage with secure cookies, input validation, and hourly reminder job idempotency to prevent duplicate sends. PDFs are validated for type and size (10 MB) before processing, and suspicious patterns are throttled. Access to production data is restricted to authorized personnel. However, no system is 100% secure; you are responsible for securing your email and devices used for magic links. In the event of a personal data breach likely to result in risk to your rights, we will notify you and, where required, the relevant supervisory authority within 72 hours of discovery.
              </p>
            </section>

            <section id="section-11" className="scroll-mt-24">
              <h2 className="text-[20px] font-bold tracking-[-0.5px] text-ink mb-3">11. International Transfers</h2>
              <p>
                Your data may be processed in Nigeria, the United States, the European Union, or other countries where our providers operate (MongoDB Atlas, Google). Where GDPR applies, we ensure transfers are covered by Standard Contractual Clauses, adequacy decisions, or other lawful mechanisms. By using Recuro, you understand that data may be transferred outside your jurisdiction to provide the Service. We minimize cross-border transfers and avoid sending personal data to jurisdictions lacking adequate protections unless necessary for processing you requested (e.g., Gemini parsing).
              </p>
            </section>

            <section id="section-12" className="scroll-mt-24">
              <h2 className="text-[20px] font-bold tracking-[-0.5px] text-ink mb-3">12. Your Rights</h2>
              <p>Depending on your jurisdiction, you have the right to:</p>
              <ul className="mt-3 list-disc pl-5 flex flex-col gap-2 marker:text-ink-muted">
                <li><strong className="text-ink">Access</strong> and receive a copy of personal data we hold about you.</li>
                <li><strong className="text-ink">Rectification:</strong> Correct inaccurate or incomplete data via Settings → Profile or by contacting us.</li>
                <li><strong className="text-ink">Erasure:</strong> Request deletion of your account and data (“right to be forgotten”), subject to legal retention limits.</li>
                <li><strong className="text-ink">Restriction &amp; objection:</strong> Restrict processing or object to processing based on legitimate interests, including opting out of email reminders.</li>
                <li><strong className="text-ink">Portability:</strong> Receive your subscription data in a structured, machine-readable format (CSV/JSON upon request).</li>
                <li><strong className="text-ink">Withdraw consent:</strong> Toggle email consent or currency preferences at any time.</li>
                <li><strong className="text-ink">Complain:</strong> Lodge a complaint with your supervisory authority if you believe processing violates applicable law.</li>
              </ul>
              <p className="mt-3">
                To exercise rights, email <a href="mailto:privacy@recuro.app" className="text-primary hover:text-primary-hover font-semibold underline underline-offset-2">privacy@recuro.app</a> with your registered email. We will verify your identity via a magic link and respond within 30 days (or sooner where required). You may also directly update profile fields, currency, and email consent in Dashboard → Settings, and delete subscriptions individually from SubscriptionsPage with confirmation.
              </p>
            </section>

            <section id="section-13" className="scroll-mt-24">
              <h2 className="text-[20px] font-bold tracking-[-0.5px] text-ink mb-3">13. Email &amp; Marketing</h2>
              <p>
                We send three categories of email: (a) transactional authentication (magic links, expires 15 min) — required and cannot be disabled; (b) service notifications — welcome emails, detection summaries, and renewal reminders (7/3/1 day) — only if you opt in via signup or Settings, and you may opt out anytime, which takes effect immediately except for in-flight sends; (c) occasional product updates or offers if you consented to that sub-preference. Each reminder email includes an opt-out link and respects your preference on next cron runs. We honor opt-outs via the email_notifications_enabled flag and never share your email with advertisers.
              </p>
            </section>

            <section id="section-14" className="scroll-mt-24">
              <h2 className="text-[20px] font-bold tracking-[-0.5px] text-ink mb-3">14. Children’s Privacy</h2>
              <p>
                Recuro is not directed to children under 16, and we do not knowingly collect personal data from children. If you are a parent or guardian and believe a child has provided us personal data, contact us at privacy@recuro.app and we will promptly delete it. Accounts found to be operated by underage users in violation of Terms will be terminated.
              </p>
            </section>

            <section id="section-15" className="scroll-mt-24">
              <h2 className="text-[20px] font-bold tracking-[-0.5px] text-ink mb-3">15. Changes to This Policy</h2>
              <p>
                We may update this Privacy Policy to reflect new features (e.g., Connect bank when it launches), legal requirements, or feedback. Material changes will be notified at least 14 days in advance via email and an in-app notice, with the “Last updated” date revised. Non-material clarifications may take effect immediately. Your continued use after the effective date constitutes acceptance. We encourage you to review this page periodically. The previous version will be archived upon request.
              </p>
            </section>

            <section id="section-16" className="scroll-mt-24">
              <h2 className="text-[20px] font-bold tracking-[-0.5px] text-ink mb-3">16. Contact &amp; Complaints</h2>
              <p>
                For privacy questions, data-rights requests, or to report a concern, contact: <a href="mailto:privacy@recuro.app" className="text-primary hover:text-primary-hover font-semibold underline underline-offset-2">privacy@recuro.app</a> and <a href="mailto:support@recuro.app" className="text-primary hover:text-primary-hover font-semibold underline underline-offset-2">support@recuro.app</a>. We aim to respond within 10 business days. For legal or law-enforcement matters, use <a href="mailto:legal@recuro.app" className="text-primary hover:text-primary-hover font-semibold underline underline-offset-2">legal@recuro.app</a>. You may also write to us and we will provide a postal address upon request. If you are in the EEA/UK, you may complain to your national data protection authority; in Nigeria, to the Nigeria Data Protection Commission (NDPC).
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link to="/terms" className="ui-btn-secondary">
                  Read Terms of Service
                </Link>
                <Link to="/signup" className="ui-btn-primary">
                  Create an account
                </Link>
              </div>
            </section>
          </article>

          <div className="mt-12 pt-8 border-t border-border flex items-center justify-between text-[12px] text-ink-muted">
            <Link to="/" className="inline-flex items-center gap-1.5 hover:text-ink transition-colors">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
              Back to home
            </Link>
            <Link to="/terms" className="font-semibold hover:text-ink transition-colors">Terms of Service →</Link>
          </div>
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}
