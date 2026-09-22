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

- Each subscription stores: name, provider, category, amount, currency, billing cycle (`weekly` / `monthly` / `quarterly` / `yearly`), next billing date, and status (`active` / `paused` / `cancelled`).
- Categories: entertainment, productivity, fitness, education, finance, social, utilities, other — each with its own badge color.
- The list supports server-side search (name/provider), status filtering, and is sorted by next renewal date.
- Edit or delete via row actions; status changes (pause/cancel/reactivate) happen in the edit modal. Deletes require confirmation.

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

| Stat                 | Meaning                                                                                                                   |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Monthly spending     | Sum of active subscriptions converted to your currency and normalized to a monthly figure (yearly ÷ 12, weekly × 4.33, …) |
| Active subscriptions | Count of `active` subscriptions                                                                                           |
| Upcoming renewals    | Next renewals by date                                                                                                     |
| Total subscriptions  | All subscriptions regardless of status                                                                                    |

Plus two panels: **Upcoming renewals** (next 5 with dates and amounts) and **Spending by category** (monthly totals per category). Exchange rates are fetched live (1-hour cache) with hardcoded fallbacks.

#### Billing reminder emails

An hourly cron (plus manual trigger via `POST /api/billing-reminders/run`) sends emails for active subscriptions renewing within 7 days:

| Window | When            | Example subject                        |
| ------ | --------------- | -------------------------------------- |
| 7-day  | 4–7 days before | `⏰ {name} subscription due in 7 days` |
| 3-day  | 2–3 days before | `⚠️ {name} subscription due in 3 days` |
| 1-day  | Day before      | `🚨 {name} subscription due tomorrow`  |

- Amounts are shown in **your** preferred currency; the stored subscription is untouched.
- Each email includes the service, amount, billing date, and a link back to the dashboard.
- Idempotent: a unique `(subscriptionId, billingDate, reminderType)` index guarantees each reminder is sent **once per billing cycle**.
- Skips users who opted out of email, cancelled/paused subscriptions, and expired dates.

#### Notifications, settings & preferences

- **Notifications page** — In-app notification feed with unread highlighting, per-item "Mark read", and "Mark all as read". Renewal reminders themselves are delivered by email.
- **Settings** — Profile (name, email), preferred display currency (NGN / USD / EUR / GBP), and the email opt-in toggle that controls reminder emails.
- **Currency** — Amounts are stored in their original currency and converted for display/emails using live exchange rates (USD-based cross-rates, 1-hour cache, fallback table). The dashboard never rewrites your stored data.

#### Emails Recuro sends

| Email                         | Trigger                                                        |
| ----------------------------- | -------------------------------------------------------------- |
| `Sign in to Recuro`           | Magic link requested (expires in 15 minutes)                   |
| `Welcome to Recuro`           | First sign-in                                                  |
| `Detected: {name}`            | Top detected candidates after a statement upload (if opted in) |
| Billing reminders (7/3/1 day) | Before each active renewal (if opted in)                       |

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

| Method | Path          | Auth | Description                |
| ------ | ------------- | ---- | -------------------------- |
| GET    | `/api/health` | No   | Returns `{ status: "ok" }` |

### Auth Routes (`/api/auth`)

| Method | Path                         | Auth | Description                                            |
| ------ | ---------------------------- | ---- | ------------------------------------------------------ |
| GET    | `/api/auth/google`           | No   | Initiates Google OAuth login                           |
| GET    | `/api/auth/google/callback`  | No   | Google OAuth callback, redirects to dashboard          |
| POST   | `/api/auth/magic-link`       | No   | Sends a passwordless sign-in email                     |
| GET    | `/api/auth/verify?token=...` | No   | Verifies magic link, creates user, establishes session |
| GET    | `/api/auth/me`               | Yes  | Returns current user profile                           |
| POST   | `/api/auth/logout`           | Yes  | Destroys session and clears cookie                     |

**POST /api/auth/magic-link** body: `{ email, emailConsent?, preferredCurrency? }`

### Subscription Routes (`/api/subscriptions`) -- All require auth

| Method | Path                     | Description                                               |
| ------ | ------------------------ | --------------------------------------------------------- |
| GET    | `/api/subscriptions`     | List subscriptions. Query: `search`, `status`, `category` |
| GET    | `/api/subscriptions/:id` | Get a subscription by ID                                  |
| POST   | `/api/subscriptions`     | Create a subscription                                     |
| PATCH  | `/api/subscriptions/:id` | Update a subscription (partial)                           |
| DELETE | `/api/subscriptions/:id` | Delete a subscription                                     |

**POST /api/subscriptions** body: `{ name, provider, amount, billingCycle, nextBillingDate, category?, currency? }`

billingCycle must be one of: `weekly`, `monthly`, `quarterly`, `yearly`

### Notification Routes (`/api/notifications`) -- All require auth

| Method | Path                          | Description                                 |
| ------ | ----------------------------- | ------------------------------------------- |
| GET    | `/api/notifications`          | List latest 50 notifications (newest first) |
| PATCH  | `/api/notifications/:id/read` | Mark a single notification as read          |
| PATCH  | `/api/notifications/read-all` | Mark all notifications as read              |

### User Routes (`/api/user`) -- All require auth

| Method | Path                | Description    |
| ------ | ------------------- | -------------- |
| PATCH  | `/api/user/profile` | Update profile |

**PATCH /api/user/profile** body: `{ name?, email?, preferred_currency?, email_notifications_enabled? }`

preferred_currency must be one of: `NGN`, `USD`, `EUR`, `GBP`

### Statement Upload Routes (`/api/transactions/statements`) -- All require auth

| Method | Path                                   | Description                                      |
| ------ | -------------------------------------- | ------------------------------------------------ |
| POST   | `/api/transactions/statements`         | Upload a PDF bank statement (field: `statement`) |
| POST   | `/api/transactions/statements/confirm` | Confirm detected subscriptions                   |

**POST /api/transactions/statements/confirm** body: `{ statementId, indices: number[] }`

### Billing Reminder Routes (`/api/billing-reminders`)

| Method | Path                         | Auth | Description                                |
| ------ | ---------------------------- | ---- | ------------------------------------------ |
| POST   | `/api/billing-reminders/run` | Yes  | Manually trigger billing reminder cron job |

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

| Path           | Page        | Description                                             |
| -------------- | ----------- | ------------------------------------------------------- |
| `/`            | LandingPage | Marketing page with features, pricing, CTA              |
| `/login`       | LoginPage   | Login with Google OAuth or magic link                   |
| `/signup`      | SignupPage  | Create account with email, currency preference, consent |
| `/auth/verify` | VerifyPage  | Handles magic link verification redirect                |

### Dashboard Pages (require auth)

| Path                       | Page              | Description                                                                          |
| -------------------------- | ----------------- | ------------------------------------------------------------------------------------ |
| `/dashboard`               | OverviewPage      | Stats cards (monthly spending, active subs, upcoming renewals), spending by category |
| `/dashboard/subscriptions` | SubscriptionsPage | Full CRUD table, search/filter, PDF upload flow, add/edit modal                      |
| `/dashboard/notifications` | NotificationsPage | Notification list with read/unread, mark read actions                                |
| `/dashboard/settings`      | SettingsPage      | Profile form, currency preference, email notification toggle                         |

## Test Suite

The backend has **66 tests** across 7 test files:

| Test File                   | Tests | What it covers                                                                         |
| --------------------------- | ----- | -------------------------------------------------------------------------------------- |
| `health.test.ts`            | 1     | Health check endpoint                                                                  |
| `auth.test.ts`              | 10    | Magic link flow, verification, token expiry, reuse, metadata                           |
| `subscriptions.test.ts`     | 13    | CRUD, validation, search, auth guard                                                   |
| `notifications.test.ts`     | 5     | List, sort, mark read, mark all read                                                   |
| `user.test.ts`              | 5     | Profile update, validation, auth guard                                                 |
| `statements.test.ts`        | 6     | Upload, confirm, validation                                                            |
| `billing-reminders.test.ts` | 19    | 7/3/1 day reminders, idempotency, skip conditions, currency conversion, manual trigger |

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
