# Recuro

A subscription tracking and management app. Discover, organize, and monitor every recurring payment in one place.

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, Zustand, React Router
- **Backend**: Node.js, Express, TypeScript, Passport.js
- **Database**: MongoDB (Mongoose)
- **Auth**: Magic links (email), Google OAuth (session-based)
- **Email**: Nodemailer (Gmail SMTP)
- **AI**: Google Gemini (statement parsing)
- **Tests**: Vitest + Supertest (backend)

## How Recuro Works

Recuro helps you see, control, and get reminded about every recurring payment you make. The core loop is: **sign in → add your subscriptions (manually or from a bank statement) → watch your spending on the dashboard → get emailed before each renewal.**

### The user journey

```
Landing page (/)
      │
      ▼
Sign up (/signup) ── magic link to email ──► /auth/verify ──► session (30 days)
      │   pick currency + email consent              │   (or "Continue with Google")
      │                                             ▼
      │                                       /dashboard
      │                                             │
      ├──────────────────────┬──────────────────────┼──────────────────────┐
      ▼                      ▼                      ▼                      ▼
 Overview (/dashboard)  Subscriptions          Notifications           Settings
  monthly spending       add manually          in-app feed             profile,
  upcoming renewals      upload PDF            read / mark read        currency,
  spend by category      statement (AI)                                email opt-in
```

1. **Sign up / log in** — Passwordless magic link (email token valid 15 min, single use) or Google OAuth. New users choose a preferred currency and email consent during signup; sessions last 30 days. First-time sign-ins trigger a welcome email.
2. **Add subscriptions** — From `/dashboard/subscriptions`, three ways:
   - **Add manually** — name, provider, category, billing cycle, amount, currency, next billing date.
   - **Upload a PDF bank statement** — Recuro parses it and detects recurring payments for you (see below).
   - **Connect bank** — coming soon (not yet implemented).
3. **Track on the dashboard** — The overview shows monthly spending (normalized to your preferred currency), active/total subscription counts, upcoming renewals, and spending broken down by category.
4. **Get reminders** — An hourly job emails you **7, 3, and 1 day** before each active subscription renews (opt-out anytime in Settings).

### Feature deep-dives

#### Subscription management

- Each subscription stores: name, provider, category, amount, currency, billing cycle (`weekly` / `monthly` / `quarterly` / `yearly`), next billing date, status (`active` / `paused` / `cancelled` / `trial`), `trialEndDate` (when status is `trial`), and `priceHistory` (array of `{ amount, currency, date, source }` for price-hike tracking).
- Categories: entertainment, productivity, fitness, education, finance, social, utilities, other — each with its own badge color.
- The list supports server-side search (name/provider), status filtering, and is sorted by next renewal date. Trial subscriptions show a distinct "Trial" badge and the trial end date; date-range filtering via `?from=&to=` powers the calendar view.
- Edit or delete via row actions; status changes (pause/cancel/reactivate) happen in the edit modal. Deletes require confirmation. Price history is updated on any amount change (manual or statement re-upload) and a hike triggers a notification (see below).
- **Manage & Cancel buttons** — Each row has `Manage` (opens the existing edit modal) and `Cancel Subscription` (opens the provider's external cancellation page in a new tab via a lookup table — e.g. Netflix → `https://www.netflix.com/cancelplan`, Spotify → `https://www.spotify.com/account/cancel/` — case-insensitive, alias-aware via merchant-normalization; falls back to a Google search for "`{provider} cancel subscription`" with a toast if no direct link exists). After the external tab opens, a confirmation prompt asks "Did you cancel this subscription?" — if yes, status is set to `cancelled` (which also logs savings; see Savings counter).

#### PDF statement upload & recurring-payment detection

When you upload a PDF statement (max 10 MB):

1. **Extract & parse** — Text is pulled from the PDF and parsed deterministically (dates, debits/credits, amounts, currency symbols ₦/$/€/£, failed vs. successful transactions).
2. **AI enhancement (optional)** — If `GEMINI_API_KEY` is configured, Gemini also extracts transactions; both result sets are merged and deduplicated.
3. **Detect recurrences** — Debits are grouped by normalized merchant (alias-aware: e.g. "Spotify" / "SPOTIFY AB" count as one) and scored 0–100 based on:
   - merchant consistency across payments
   - cadence fit (weekly / monthly / quarterly / yearly windows)
   - amount consistency
   - known-subscription merchants (Netflix, Spotify, Notion, Canva, …)
   - noise is filtered out (fees, ATM, transfers, taxes, payment processors)
4. **Review before adding** — Candidates scoring ≥ 65 appear in a review modal with a plain-English "Why we detected it" explanation (e.g. "Payment interval fits monthly cadence (5/6 intervals match)"). Already-tracked items are marked as existing; you choose what to add or skip.
5. **Confirm** — Selected detections are saved with a predicted next billing date (e.g. last payment + 1 month). Matching existing subscriptions are updated instead of duplicated. Detection results expire after 1 hour.

#### Dashboard overview

| Stat | Meaning |
|------|---------|
| Monthly spending | Sum of active subscriptions converted to your currency and normalized to a monthly figure (yearly ÷ 12, weekly × 4.33, …) |
| Active subscriptions | Count of `active` subscriptions |
| Upcoming renewals | Next renewals by date |
| Total subscriptions | All subscriptions regardless of status |
| You've saved | Lifetime total saved from cancelled/paused subscriptions (see Savings counter) displayed as "You've saved {amount} since joining." |

Plus panels: **Upcoming renewals** (next 5 with dates and amounts), **Spending by category** (monthly totals per category with budget-cap progress bars — grey <80%, amber 80–100%, red >100% when a cap is set), and **Ending trials** (trials sorted by `trialEndDate`, shown when any trial exists). A **Calendar view** at `/dashboard/calendar` shows a month grid with renewals plotted on billing dates (name + amount per day, projected per billing cycle), month navigation, and a popover/list for days with renewals. Exchange rates are fetched live (1-hour cache) with hardcoded fallbacks.

#### Price-hike detection

- Price history is seeded on creation (`priceHistory: [{ amount, currency, date, source: "initial" }]`).
- On manual amount edit (`PATCH /api/subscriptions/:id`) or statement confirm flow, `applyAmountChange` compares the new amount to the previous one. Any change pushes a new entry (`source: "manual"` or `"statement"`); only a same-currency increase creates a `price_change` notification with message like `"Netflix increased from $15.99 to $19.99 (+25%)"` (stored via the `Notification` model/feed). Decreases and unchanged amounts update history but do not notify.

#### Savings counter

- When status changes to `cancelled` or `paused` (from any non-savings state), the normalized monthly amount (`monthlyEquivalent(amount, billingCycle)`) is logged to a `SavingsLog` collection (`userId`, `subscriptionId`, `name`, `amount`, `currency`, `status`, `date`).
- `GET /api/savings` returns `{ total, currency, entries }` — total is lifetime savings converted to `preferred_currency` via the existing exchange-rate utility; entries are sorted newest-first. Reactivating a subscription does not delete its historical log; re-cancelling logs a new entry.

#### Free trial tracking

- Subscriptions support `status: "trial"` with required `trialEndDate` (validated on create/update). Frontend shows a "Trial" badge in the table and an "Ending trials" section on the dashboard.
- The existing hourly cron now also checks trials ending in **3 days** (`2–3` day window) and **1 day** (`1` day) and sends distinct emails via `EmailService.sendTrialEndingEmail` ("Your {name} trial ends in 3 days and will start billing {amount}") reusing the `BillingReminder` idempotency unique index `(subscriptionId, billingDate, reminderType)` with `reminderType: "trial_3_days" | "trial_1_days"`.

#### Budget caps per category

- Users may set an optional monthly budget cap per category in Settings. Stored on `User.budgetCaps` as `Record<category, capAmount>` in `preferred_currency`.
- On add/edit subscription the UI computes the category's new monthly total (converted + normalized) and shows a non-blocking warning if it would exceed the cap: `"This puts Entertainment at {total}/{cap} for the month"`. Saving is never blocked.
- On the dashboard's "Spending by category" panel caps render as progress bars (grey <80%, amber 80–100%, red >100%).

#### Billing reminder emails

An hourly cron (plus manual trigger via `POST /api/billing-reminders/run`) sends emails for active subscriptions renewing within 7 days and for trials ending soon:

| Window | When | Example subject |
|--------|------|-----------------|
| 7-day | 4–7 days before | `⏰ {name} subscription due in 7 days` |
| 3-day | 2–3 days before | `⚠️ {name} subscription due in 3 days` |
| 1-day | Day before | `🚨 {name} subscription due tomorrow` |
| Trial 3-day | 2–3 days before trial ends | `⚠️ {name} free trial ends in 3 days` |
| Trial 1-day | Day before trial ends | `🚨 {name} free trial ends tomorrow` |

- Amounts are shown in **your** preferred currency; the stored subscription is untouched.
- Each email includes the service, amount, billing/trial date, and a link back to the dashboard. Trial emails note the upcoming charge (e.g. "Your {name} trial ends in 3 days and will start billing {amount}").
- Idempotent: a unique `(subscriptionId, billingDate, reminderType)` index guarantees each reminder is sent **once per billing cycle**; trial reminders use `trial_3_days` / `trial_1_days` types.
- Skips users who opted out of email, cancelled/paused subscriptions, and expired dates.

#### Notifications, settings & preferences

- **Notifications page** — In-app notification feed with unread highlighting, per-item "Mark read", and "Mark all as read". Renewal reminders themselves are delivered by email. Price-hike notifications (`type: "price_change"`) also appear here.
- **Settings** — Profile (name, email), preferred display currency (NGN / USD / EUR / GBP), email opt-in toggle, and **category budget caps** (optional monthly caps per category in preferred currency; e.g. entertainment: 50, productivity: 30 — zero/empty clears the cap).
- **Currency** — Amounts are stored in their original currency and converted for display/emails using live exchange rates (USD-based cross-rates, 1-hour cache, fallback table). The dashboard never rewrites your stored data.

#### Emails Recuro sends

| Email | Trigger |
|-------|---------|
| `Sign in to Recuro` | Magic link requested (expires in 15 minutes) |
| `Welcome to Recuro` | First sign-in |
| `Detected: {name}` | Top detected candidates after a statement upload (if opted in) |
| Billing reminders (7/3/1 day) | Before each active renewal (if opted in) |
| Trial ending (3 / 1 day) | Trial ending in 3 days / tomorrow (if opted in) |
| Price hike (in-app) | `{name} increased from {old} to {new} ({% change})` — in-app notification on hike via statement or manual edit |

## Monorepo Layout

```
recuro/
  backend/          Express API — see backend/README.md
  frontend/         React SPA  — see frontend/README.md
```

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB instance (local or Atlas)

### Installation

```bash
git clone https://github.com/your-username/recuro.git
cd recuro

cd backend
npm install

cd ../frontend
npm install
```

### Environment Variables

Create `.env` files in both `backend/` and `frontend/` (see `.env.example` in each):

**backend/.env**

```
MONGODB_URI=mongodb://localhost:27017/recuro
SESSION_SECRET=your-session-secret
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:3001
PORT=3001
NODE_ENV=development
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GMAIL_EMAIL=your-gmail@gmail.com
GMAIL_APP_PASSWORD=your-app-password
GEMINI_API_KEY=your-gemini-api-key
```

**frontend/.env**

```
VITE_API_URL=http://localhost:3001
```

### Running

```bash
# Terminal 1 - backend
cd backend
npm run dev

# Terminal 2 - frontend
cd frontend
npm run dev
```

- Backend: `http://localhost:3001`
- Frontend: `http://localhost:5173` (proxies `/api` to the backend)

### Running Tests

```bash
# Run all backend tests
cd backend
npm test

# Run only billing reminder / notification tests
npm run test:notifications

# Run parser unit tests
npm run test:parser

# Lint the frontend
cd ../frontend
npm run lint
```

## Project Structure

```
recuro/
  backend/
    src/
      config/           Database, env, passport setup
      controllers/      Route handlers
      middleware/        Auth, validation, error handling
      models/           Mongoose schemas
      routes/           Express route definitions
      services/         Business logic (parsers, detection, reminders)
      scripts/          Manual test/utility scripts
      utils/            Helpers (email, token, API response)
      __tests__/        Test files
      server.ts         Entry point (production, Mongo sessions + cron)
      app.ts            Express app factory (used by tests)
  frontend/
    src/
      components/       Reusable UI + landing page components
      contexts/         Auth context provider
      lib/              API client, utils, exchange rates
      pages/            Route pages
        dashboard/      Dashboard views
      stores/           Zustand state stores
      App.tsx           Route definitions
      main.tsx          Entry point
```

## Backend API Routes

All routes are prefixed with `/api`.

### Health Check

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/health` | No | Returns `{ status: "ok" }` |

### Auth Routes (`/api/auth`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/auth/google` | No | Initiates Google OAuth login |
| GET | `/api/auth/google/callback` | No | Google OAuth callback, redirects to dashboard |
| POST | `/api/auth/magic-link` | No | Sends a passwordless sign-in email |
| GET | `/api/auth/verify?token=...` | No | Verifies magic link, creates user, establishes session |
| GET | `/api/auth/me` | Yes | Returns current user profile |
| POST | `/api/auth/logout` | Yes | Destroys session and clears cookie |

**POST /api/auth/magic-link** body: `{ email, emailConsent?, preferredCurrency? }`

### Subscription Routes (`/api/subscriptions`) -- All require auth

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/subscriptions` | List subscriptions. Query: `search`, `status`, `category`, `from`, `to` (ISO dates filter `nextBillingDate`; powers calendar view) |
| GET | `/api/subscriptions/:id` | Get a subscription by ID (includes `priceHistory`, `trialEndDate`) |
| POST | `/api/subscriptions` | Create a subscription |
| PATCH | `/api/subscriptions/:id` | Update a subscription (partial) |
| DELETE | `/api/subscriptions/:id` | Delete a subscription |

**POST /api/subscriptions** body: `{ name, provider, amount, billingCycle, nextBillingDate, category?, currency?, status?, trialEndDate? }`

billingCycle must be one of: `weekly`, `monthly`, `quarterly`, `yearly`; status may be `active`, `paused`, `cancelled`, `trial` (trial requires `trialEndDate` ISO date). Prices are recorded in `priceHistory`; amount increases in same currency emit a `price_change` notification.

### Notification Routes (`/api/notifications`) -- All require auth

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/notifications` | List latest 50 notifications (newest first) |
| PATCH | `/api/notifications/:id/read` | Mark a single notification as read |
| PATCH | `/api/notifications/read-all` | Mark all notifications as read |

### User Routes (`/api/user`) -- All require auth

| Method | Path | Description |
|--------|------|-------------|
| PATCH | `/api/user/profile` | Update profile (including budget caps) |

**PATCH /api/user/profile** body: `{ name?, email?, preferred_currency?, email_notifications_enabled?, budgetCaps? }`

preferred_currency must be one of: `NGN`, `USD`, `EUR`, `GBP`; `budgetCaps` is an object `Record<category, number>` of monthly caps in preferred currency (e.g. `{ entertainment: 50, productivity: 30 }`). Zero/empty clears a cap. Alias `budget_caps` also accepted.

### Savings Routes (`/api/savings`) -- All require auth

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/savings` | Lifetime savings total (converted to preferred currency) + log entries sorted newest-first |

**GET /api/savings** response: `{ total: number, currency: string, entries: SavingsLog[] }` — each entry is `{ name, amount (monthly normalized), currency, status, date }` logged on first transition to `cancelled`/`paused`.

### Statement Upload Routes (`/api/transactions/statements`) -- All require auth

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/transactions/statements` | Upload a PDF bank statement (field: `statement`) |
| POST | `/api/transactions/statements/confirm` | Confirm detected subscriptions |

**POST /api/transactions/statements/confirm** body: `{ statementId, indices: number[] }`

### Billing Reminder Routes (`/api/billing-reminders`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/billing-reminders/run` | Yes | Manually trigger billing reminder cron job |

## Billing Reminder Notification System

The core notification feature automatically sends email reminders before subscription billing dates:

- **7-day reminder**: Sent 4-7 days before billing
- **3-day reminder**: Sent 2-3 days before billing
- **1-day reminder**: Sent exactly 1 day before billing

### How it works

1. A cron job runs every hour via `setInterval` in `server.ts`
2. `runBillingReminders()` finds active subscriptions billing within the next 7 days
3. Skips users with `email_notifications_enabled: false`
4. Converts amounts to the user's preferred currency if different from the subscription currency
5. For each reminder window (7/3/1 day), checks if the subscription falls within the window
6. Uses a unique index on `(subscriptionId, billingDate, reminderType)` to ensure idempotency -- each reminder is sent only once per billing cycle

## Frontend Pages

### Public Pages

| Path | Page | Description |
|------|------|-------------|
| `/` | LandingPage | Marketing page with features, pricing, CTA |
| `/login` | LoginPage | Login with Google OAuth or magic link |
| `/signup` | SignupPage | Create account with email, currency preference, consent |
| `/auth/verify` | VerifyPage | Handles magic link verification redirect |

### Dashboard Pages (require auth)

| Path | Page | Description |
|------|------|-------------|
| `/dashboard` | OverviewPage | Stats cards (monthly spending, active subs, upcoming renewals, **You've saved**), spending by category with **budget cap progress bars**, upcoming renewals, **Ending trials** section |
| `/dashboard/subscriptions` | SubscriptionsPage | Full CRUD table (trial badge), search/filter, PDF upload flow, add/edit modal (trial fields, budget warnings), **Manage** (opens edit) + **Cancel Subscription** (external URL lookup + confirm → mark cancelled) row actions |
| `/dashboard/calendar` | CalendarPage | Month grid with renewals plotted (name+amount per day), month navigation, day popover/list |
| `/dashboard/notifications` | NotificationsPage | Notification list with read/unread, mark read actions (includes price-hike notifications) |
| `/dashboard/settings` | SettingsPage | Profile form, currency preference, email notification toggle, **category budget caps** inputs |

## Test Suite

The backend has **101 tests** across 10 test files:

| Test File | Tests | What it covers |
|-----------|-------|----------------|
| `health.test.ts` | 1 | Health check endpoint |
| `auth.test.ts` | 10 | Magic link flow, verification, token expiry, reuse, metadata |
| `subscriptions.test.ts` | 13 | CRUD, validation, search, auth guard |
| `notifications.test.ts` | 5 | List, sort, mark read, mark all read |
| `user.test.ts` | 5 | Profile update, validation, auth guard |
| `statements.test.ts` | 6 | Upload, confirm, validation |
| `billing-reminders.test.ts` | 19 | 7/3/1 day reminders, idempotency, skip conditions, currency conversion, manual trigger |
| `price-hike.test.ts` | 8 | Price history seeding, hike on manual edit + statement re-upload, no false positives, history updates on decrease |
| `savings.test.ts` | 14 | Save on cancel/pause (monthly normalization), no duplicate while cancelled, reactivation, GET /api/savings totals + conversion + sort |
| `trials.test.ts` | 13 | Trial create/update validation, trial end date clearing, 3/1 day trial emails, idempotency, skip conditions |

### Key notification tests

The `billing-reminders.test.ts` file specifically validates:

- 7-day reminder fires for subscriptions billing in 4-7 days
- 3-day reminder fires for subscriptions billing in 2-3 days
- 1-day reminder fires for subscriptions billing exactly 1 day out
- All three reminders fire for subscriptions at each interval
- Idempotency: repeated runs do not send duplicate emails
- Cancelled/paused subscriptions are skipped
- Users with `email_notifications_enabled: false` are skipped
- Past-due and far-future subscriptions are skipped
- Currency conversion works when user preference differs from subscription currency
- Manual API trigger via `POST /api/billing-reminders/run`

## License

Private
