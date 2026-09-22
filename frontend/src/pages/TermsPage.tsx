import { Link } from "react-router-dom";
import LandingFooter from "../components/landing/LandingFooter";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-bg flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-bg/80 backdrop-blur-md border-b border-border">
        <div className="mx-auto max-w-[1400px] flex items-center justify-between px-14 max-[1100px]:px-9 max-[800px]:px-6 max-[580px]:px-4 h-[64px]">
          <Link to="/" className="inline-flex items-center gap-2 text-[23px] font-extrabold tracking-[-1.5px] text-ink">
            Recuro<span className="text-primary">.</span>
          </Link>
          <nav className="flex items-center gap-6 text-[13px]">
            <Link to="/privacy" className="text-ink-muted hover:text-ink font-medium transition-colors">
              Privacy Policy
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
            <h1 className="text-[40px] font-bold tracking-[-1.5px] leading-[1.05] text-ink max-[580px]:text-[32px]">Terms of Service</h1>
            <p className="mt-4 text-[13px] text-ink-muted leading-relaxed">
              Last updated: <span className="font-semibold text-ink-body">September 23, 2026</span> &nbsp;·&nbsp; Effective: September 23, 2026
            </p>
            <div className="mt-6 bg-warm border border-primary/15 rounded-card px-5 py-4">
              <p className="text-[13px] leading-relaxed text-ink-body">
                <strong className="text-ink">Summary:</strong> Recuro helps you track subscriptions, parse bank statements with AI, and reminds you before renewals. These Terms explain your rights, responsibilities, and the limits of our service. Please read them carefully — by creating an account you agree to them.
              </p>
            </div>
          </div>

          {/* Table of contents */}
          <nav className="mb-10 ui-card p-6">
            <h2 className="text-[11px] font-bold tracking-[0.14em] uppercase text-ink-muted mb-4">On this page</h2>
            <ol className="grid grid-cols-2 gap-2 max-[580px]:grid-cols-1 text-[13px] leading-relaxed">
              {[
                "1. Acceptance of Terms",
                "2. Eligibility & Accounts",
                "3. Description of Service",
                "4. User Accounts & Security",
                "5. Subscription Data & AI Parsing",
                "6. Billing Reminders & Emails",
                "7. User Conduct",
                "8. Intellectual Property",
                "9. Third-Party Services",
                "10. Disclaimers & Availability",
                "11. Limitation of Liability",
                "12. Indemnification",
                "13. Termination",
                "14. Governing Law & Disputes",
                "15. Changes to Terms",
                "16. Contact",
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
              <h2 className="text-[20px] font-bold tracking-[-0.5px] text-ink mb-3">1. Acceptance of Terms</h2>
              <p>
                Welcome to Recuro (“Recuro,” “we,” “us,” or “our”), a subscription tracking and management platform operated at recuro.app. These Terms of Service (“Terms”) constitute a legally binding agreement between you (“you,” “user”) and Recuro governing your access to and use of our website, applications, APIs, emails, and related services (collectively, the “Service”). By creating an account, clicking “I agree,” using a magic link, or otherwise accessing the Service, you acknowledge that you have read, understood, and agree to be bound by these Terms and our Privacy Policy. If you do not agree, you must not use the Service. We may update these Terms from time to time; your continued use after changes constitutes acceptance of the revised Terms.
              </p>
              <p className="mt-3">
                These Terms apply to all visitors, registered users, and any other persons who access the Service. If you are using the Service on behalf of an organization, you represent that you have authority to bind that organization, and “you” refers to that organization. You also represent that all information you provide during signup — including your email, preferred currency, and consent preferences — is accurate and that you will keep it updated.
              </p>
            </section>

            <section id="section-2" className="scroll-mt-24">
              <h2 className="text-[20px] font-bold tracking-[-0.5px] text-ink mb-3">2. Eligibility &amp; Accounts</h2>
              <p>
                You must be at least 16 years old to use Recuro, or the age of digital consent in your jurisdiction if higher. By registering, you confirm you meet this requirement and have the legal capacity to enter into a binding contract. We offer passwordless authentication via magic links (single-use tokens valid 15 minutes) and Google OAuth with 30-day sessions. You are responsible for maintaining the confidentiality of your email account and any device used to access magic links. Notify us immediately if you suspect unauthorized access. We reserve the right to refuse registration, suspend, or terminate accounts that violate these Terms, are created with false information, or pose security or abuse risks.
              </p>
            </section>

            <section id="section-3" className="scroll-mt-24">
              <h2 className="text-[20px] font-bold tracking-[-0.5px] text-ink mb-3">3. Description of Service</h2>
              <p>
                Recuro helps you discover, organize, and monitor recurring payments. Core features include: manual subscription entry (name, provider, category, amount, currency, billing cycle, next billing date, status), PDF bank statement upload with deterministic and AI-assisted parsing (Google Gemini when configured), recurring-payment detection scored 0–100 using merchant normalization, cadence and amount consistency, and category awareness, a dashboard showing monthly spend normalized to your preferred currency, active vs. total subscriptions, upcoming renewals, and spending by category, and in-app notifications plus optional email reminders 7, 3 and 1 day before renewals. Exchange rates are fetched live and cached for one hour with hardcoded fallbacks; we do not rewrite your stored amounts. Features such as “Connect bank” are marked as coming soon and are not yet available.
              </p>
            </section>

            <section id="section-4" className="scroll-mt-24">
              <h2 className="text-[20px] font-bold tracking-[-0.5px] text-ink mb-3">4. User Accounts &amp; Security</h2>
              <p>
                You agree to provide a valid email address and to keep your preferred currency and email notification preferences current via Settings. Magic links are emailed via our provider and expire after 15 minutes or single use; sessions persist for 30 days. You must not share, intercept, or brute-force tokens, and you must not create multiple accounts to evade limits. We implement session-based authentication with server-stored sessions and may invalidate sessions for security reasons. You are responsible for all activity under your account. If you believe your account has been compromised, use the logout and re-authentication flow and contact us promptly so we can secure your account.
              </p>
            </section>

            <section id="section-5" className="scroll-mt-24">
              <h2 className="text-[20px] font-bold tracking-[-0.5px] text-ink mb-3">5. Subscription Data &amp; AI Parsing</h2>
              <p>
                You retain ownership of data you enter or upload. By uploading a PDF statement (max 10 MB), you grant us a limited license to extract text, parse transactions, merge deterministic results with optional Gemini output, deduplicate, and score recurring candidates for your review. Candidates scoring ≥65 appear with a plain-English explanation (“Why we detected it”) and you choose what to add; matches to existing subscriptions update the next billing date rather than duplicating. Detection results expire after one hour. We filter noise (fees, ATM, transfers, taxes, processors) and normalize merchant aliases (e.g., “Spotify” vs. “SPOTIFY AB”). AI extraction is best-effort and may be inaccurate; you are responsible for reviewing candidates before confirming. Do not upload statements belonging to others without permission, and do not upload unlawful or malicious files.
              </p>
            </section>

            <section id="section-6" className="scroll-mt-24">
              <h2 className="text-[20px] font-bold tracking-[-0.5px] text-ink mb-3">6. Billing Reminders &amp; Emails</h2>
              <p>
                If you opt into email notifications, Recuro sends welcome emails on first sign-in, detection summaries for top candidates after statement uploads, and renewal reminders on an hourly cron for active subscriptions due within 7 days. Reminder windows are 7-day (4–7 days before), 3-day (2–3 days before) and 1-day (day before), each sent once per billing cycle via a unique (subscriptionId, billingDate, reminderType) index. Amounts are displayed in your preferred currency without modifying stored data. Each email includes service name, amount, date, and a link to the dashboard. You may opt out anytime in Settings under “email notifications.” Transactional emails necessary for authentication (magic links) cannot be disabled.
              </p>
            </section>

            <section id="section-7" className="scroll-mt-24">
              <h2 className="text-[20px] font-bold tracking-[-0.5px] text-ink mb-3">7. User Conduct &amp; Prohibited Uses</h2>
              <p>
                You agree not to: violate any law; infringe intellectual property or privacy rights; upload malware, attempt to hack, scrape, or reverse engineer the Service; interfere with the hourly reminder job, rate limits, or email systems; use the Service to spam, harass, or impersonate; attempt to access other users’ data; or use AI parsing to process sensitive personal data of third parties without consent. We may block uploads, throttle requests, or suspend accounts that exhibit abusive patterns such as repeated large PDF uploads, automated credential stuffing, or misuse of exchange-rate APIs. You are solely responsible for the legality of data you provide and for complying with your bank’s terms when exporting statements.
              </p>
            </section>

            <section id="section-8" className="scroll-mt-24">
              <h2 className="text-[20px] font-bold tracking-[-0.5px] text-ink mb-3">8. Intellectual Property</h2>
              <p>
                The Service, including its code, design, logos, copy, and the Recuro name and marks, is owned by us or our licensors and protected by copyright, trademark, and other laws. We grant you a limited, non-exclusive, non-transferable, revocable license to use the Service for personal, non-commercial purposes subject to these Terms. You grant us a license to host, store, process, and display your content (subscription names, amounts, etc.) solely to provide and improve the Service, and to generate anonymized, aggregated analytics that do not identify you. Feedback you provide may be used without restriction or compensation. You must not copy, modify, distribute, or create derivative works of our Service without written permission.
              </p>
            </section>

            <section id="section-9" className="scroll-mt-24">
              <h2 className="text-[20px] font-bold tracking-[-0.5px] text-ink mb-3">9. Third-Party Services</h2>
              <p>
                Recuro integrates with third parties: Google OAuth for authentication, Gmail SMTP via Nodemailer for transactional email, MongoDB Atlas for data storage, Google Gemini for optional AI parsing, and live exchange-rate providers. Your use of those services is subject to their respective terms and privacy policies. We are not responsible for third-party availability, accuracy, or practices. Links to cancellation guides or external merchant sites are provided for convenience via cancellation URLs and do not constitute endorsement. If a third party changes or discontinues an API, features depending on it may be modified or removed without prior notice.
              </p>
            </section>

            <section id="section-10" className="scroll-mt-24">
              <h2 className="text-[20px] font-bold tracking-[-0.5px] text-ink mb-3">10. Disclaimers &amp; Availability</h2>
              <p>
                The Service is provided “as is” and “as available” without warranties of any kind, express or implied, including merchantability, fitness for a particular purpose, accuracy, and non-infringement. We do not guarantee that parsing, detection scores, cadence predictions, currency conversions, or reminder timing will be error-free. Recuro is a tracking and reminder tool; it does not execute payments, cancel subscriptions on your behalf, or provide financial advice. You should independently verify billing dates and amounts with merchants. We strive for high availability but do not guarantee uninterrupted or timely operation; maintenance, third-party outages, or force majeure events may cause temporary unavailability.
              </p>
            </section>

            <section id="section-11" className="scroll-mt-24">
              <h2 className="text-[20px] font-bold tracking-[-0.5px] text-ink mb-3">11. Limitation of Liability</h2>
              <p>
                To the maximum extent permitted by law, in no event shall Recuro, its founders, employees, or affiliates be liable for any indirect, incidental, consequential, special, punitive, or exemplary damages, including loss of profits, data, goodwill, or subscription overcharges, arising from or relating to your use of or inability to use the Service, even if advised of the possibility of such damages. Our aggregate liability for any claim arising out of or relating to these Terms or the Service shall not exceed the amount you paid to us in the 12 months preceding the claim, or €50 if you have not made any payment. Some jurisdictions do not allow the exclusion of certain warranties or limitation of liability, so some of the above limitations may not apply to you.
              </p>
            </section>

            <section id="section-12" className="scroll-mt-24">
              <h2 className="text-[20px] font-bold tracking-[-0.5px] text-ink mb-3">12. Indemnification</h2>
              <p>
                You agree to indemnify, defend, and hold harmless Recuro and its officers, directors, employees, and agents from and against any claims, liabilities, damages, losses, and expenses, including reasonable attorney’s fees, arising out of or in any way connected with your access to or use of the Service, your content, your violation of these Terms, or your violation of any rights of another party. We reserve the right to assume exclusive defense and control of any matter subject to indemnification, and you agree to cooperate with our defense of such claims.
              </p>
            </section>

            <section id="section-13" className="scroll-mt-24">
              <h2 className="text-[20px] font-bold tracking-[-0.5px] text-ink mb-3">13. Termination</h2>
              <p>
                You may terminate your account at any time via Settings or by contacting us; termination deletes your session and, upon request, your stored subscriptions and related data subject to our retention obligations. We may suspend or terminate your access immediately, without prior notice, if you breach these Terms, engage in abusive behavior, or if required by law or to protect the security of the Service. Upon termination, your right to use the Service ceases, but sections concerning Intellectual Property, Disclaimers, Limitation of Liability, Indemnification, and Governing Law survive. We may retain anonymized analytics and logs for legitimate operational purposes.
              </p>
            </section>

            <section id="section-14" className="scroll-mt-24">
              <h2 className="text-[20px] font-bold tracking-[-0.5px] text-ink mb-3">14. Governing Law &amp; Disputes</h2>
              <p>
                These Terms shall be governed by and construed in accordance with the laws of the Federal Republic of Nigeria, without regard to conflict-of-law principles, unless your mandatory consumer protection laws require otherwise. We will attempt to resolve any dispute informally by contacting you at your registered email. If informal resolution fails within 30 days, either party may pursue arbitration or court proceedings in Lagos, Nigeria, or in your local courts where required by applicable law. You agree to bring claims within one year after the claim arises, except where a longer period is required by law.
              </p>
            </section>

            <section id="section-15" className="scroll-mt-24">
              <h2 className="text-[20px] font-bold tracking-[-0.5px] text-ink mb-3">15. Changes to Terms</h2>
              <p>
                We may modify these Terms to reflect changes in the Service, law, or business practices. Material changes will be notified via email or an in-app banner at least 14 days before taking effect, and the “Last updated” date will be revised. Continued use after the effective date constitutes acceptance. If you disagree with revised Terms, you should stop using the Service and close your account before the changes take effect. Non-material clarifications may take effect immediately.
              </p>
            </section>

            <section id="section-16" className="scroll-mt-24">
              <h2 className="text-[20px] font-bold tracking-[-0.5px] text-ink mb-3">16. Contact</h2>
              <p>
                If you have questions about these Terms, please contact us at <a href="mailto:support@recuro.app" className="text-primary hover:text-primary-hover font-semibold underline underline-offset-2">support@recuro.app</a> or via the feedback form in Dashboard → Settings. For legal notices, use <a href="mailto:legal@recuro.app" className="text-primary hover:text-primary-hover font-semibold underline underline-offset-2">legal@recuro.app</a>. We aim to respond within 5 business days. Our mailing address will be provided upon request for formal correspondence.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link to="/privacy" className="ui-btn-secondary">
                  Read Privacy Policy
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
            <Link to="/privacy" className="font-semibold hover:text-ink transition-colors">Privacy Policy →</Link>
          </div>
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}
