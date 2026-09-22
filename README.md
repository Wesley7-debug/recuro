# Recuro

A subscription tracking and management app. Discover, organize, and monitor every recurring payment in one place.

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, Zustand
- **Backend**: Node.js, Express, TypeScript
- **Database**: MongoDB (Mongoose)
- **Auth**: Magic links (email), Google OAuth, GitHub OAuth
- **Email**: Nodemailer (Gmail SMTP)
- **AI**: Google Gemini (statement parsing)

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

Create `.env` files in both `backend/` and `frontend/`:

**backend/.env**

```
MONGODB_URI=mongodb://localhost:27017/recuro
SESSION_SECRET=your-session-secret
FRONTEND_URL=http://localhost:5173
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
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

### Running Tests

```bash
# Run all backend tests
cd backend
npm test

# Run only billing reminder / notification tests
npm run test:notifications

# Run parser unit tests
npm run test:parser
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
      utils/            Helpers (email, token, API response)
      __tests__/        Test files
      server.ts         Entry point (production)
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
| GET | `/api/auth/github` | No | Initiates GitHub OAuth login |
| GET | `/api/auth/github/callback` | No | GitHub OAuth callback, redirects to dashboard |
| POST | `/api/auth/magic-link` | No | Sends a passwordless sign-in email |
| GET | `/api/auth/verify?token=...` | No | Verifies magic link, creates user, establishes session |
| GET | `/api/auth/me` | Yes | Returns current user profile |
| POST | `/api/auth/logout` | Yes | Destroys session and clears cookie |

**POST /api/auth/magic-link** body: `{ email, emailConsent?, preferredCurrency? }`

### Subscription Routes (`/api/subscriptions`) -- All require auth

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/subscriptions` | List subscriptions. Query: `search`, `status`, `category` |
| GET | `/api/subscriptions/:id` | Get a subscription by ID |
| POST | `/api/subscriptions` | Create a subscription |
| PATCH | `/api/subscriptions/:id` | Update a subscription (partial) |
| DELETE | `/api/subscriptions/:id` | Delete a subscription |

**POST /api/subscriptions** body: `{ name, provider, amount, billingCycle, nextBillingDate, category?, currency? }`

billingCycle must be one of: `weekly`, `monthly`, `quarterly`, `yearly`

### Notification Routes (`/api/notifications`) -- All require auth

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/notifications` | List latest 50 notifications (newest first) |
| PATCH | `/api/notifications/:id/read` | Mark a single notification as read |
| PATCH | `/api/notifications/read-all` | Mark all notifications as read |

### User Routes (`/api/user`) -- All require auth

| Method | Path | Description |
|--------|------|-------------|
| PATCH | `/api/user/profile` | Update profile |

**PATCH /api/user/profile** body: `{ name?, email?, preferred_currency?, email_notifications_enabled? }`

preferred_currency must be one of: `NGN`, `USD`, `EUR`, `GBP`

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
| `/login` | LoginPage | Login with OAuth (Google, GitHub) or magic link |
| `/signup` | SignupPage | Create account with email, currency preference, consent |
| `/auth/verify` | VerifyPage | Handles magic link verification redirect |

### Dashboard Pages (require auth)

| Path | Page | Description |
|------|------|-------------|
| `/dashboard` | OverviewPage | Stats cards (monthly spending, active subs, upcoming renewals), spending by category |
| `/dashboard/subscriptions` | SubscriptionsPage | Full CRUD table, search/filter, PDF upload flow, add/edit modal |
| `/dashboard/notifications` | NotificationsPage | Notification list with read/unread, mark read actions |
| `/dashboard/settings` | SettingsPage | Profile form, currency preference, email notification toggle |

## Test Suite

The backend has **66 tests** across 7 test files:

| Test File | Tests | What it covers |
|-----------|-------|----------------|
| `health.test.ts` | 1 | Health check endpoint |
| `auth.test.ts` | 10 | Magic link flow, verification, token expiry, reuse, metadata |
| `subscriptions.test.ts` | 13 | CRUD, validation, search, auth guard |
| `notifications.test.ts` | 5 | List, sort, mark read, mark all read |
| `user.test.ts` | 5 | Profile update, validation, auth guard |
| `statements.test.ts` | 6 | Upload, confirm, validation |
| `billing-reminders.test.ts` | 19 | 7/3/1 day reminders, idempotency, skip conditions, currency conversion, manual trigger |

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
