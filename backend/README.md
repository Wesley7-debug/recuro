# Recuro Backend

Express + TypeScript REST API for the Recuro subscription tracker. Handles authentication, subscriptions, notifications, PDF statement parsing (with optional Gemini AI assistance), and billing reminder emails.

## Stack

- **Runtime**: Node.js 18+, TypeScript (CommonJS, `tsx` for dev)
- **Framework**: Express 4, Helmet, CORS, express-rate-limit, Morgan
- **Database**: MongoDB via Mongoose
- **Sessions**: `express-session` + `connect-mongo` (production), in-memory (tests)
- **Auth**: Passport.js — Google OAuth (`passport-google-oauth20`) and magic links (passwordless email)
- **Email**: Nodemailer (Gmail SMTP)
- **Uploads**: Multer (PDF bank statements)
- **AI**: Google Gemini (`@google/generative-ai`, optional) for statement parsing fallback
- **Tests**: Vitest + Supertest

## Getting Started

```bash
cd backend
npm install
cp .env.example .env   # then fill in values
npm run dev
```

The API runs at `http://localhost:3001`.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start with nodemon + tsx (watches `src/`) |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm start` | Run the compiled production server (`dist/server.js`) |
| `npm test` | Run all tests once (Vitest) |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:notifications` | Send test billing reminder emails |
| `npm run test:parser` | Run PDF parser unit tests (`src/services/parser.test.ts`) |

## Environment Variables

Copy `.env.example` to `.env`:

| Variable | Required | Description |
|----------|----------|-------------|
| `MONGODB_URI` | Yes | MongoDB connection string |
| `SESSION_SECRET` | Yes | Secret for signing session cookies |
| `FRONTEND_URL` | Yes | CORS origin + OAuth/magic-link redirect target (default `http://localhost:5173`) |
| `BACKEND_URL` | Yes | Public base URL used to build OAuth callback URLs |
| `PORT` | No | Server port (default `3001`) |
| `NODE_ENV` | No | `development` or `production` (controls cookie `secure` flag) |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | For Google login | From console.cloud.google.com; Google strategy is skipped if unset |
| `GMAIL_EMAIL` / `GMAIL_APP_PASSWORD` | For emails | Gmail account + app password for Nodemailer |
| `GEMINI_API_KEY` | Optional | Enables AI-enhanced statement parsing |

## Project Structure

```
src/
  config/
    database.ts        Mongo connection
    env.ts             Loads and validates env vars
    passport.ts        Passport strategies + serialize/deserialize
  controllers/         Route handlers (auth, subscription, notification, user, statement)
  middleware/
    auth.ts            requireAuth guard
    errorHandler.ts    Central error handler
    validate.ts        Request validation
  models/              Mongoose schemas (User, Subscription, Notification, MagicLink, BillingReminder)
  routes/              Express routers mounted under /api/*
  services/
    aiParser.service.ts            Gemini-assisted statement parsing
    billingReminder.service.ts     7/3/1-day reminder logic (cron)
    exchangeRate.service.ts        Currency conversion
    merchantNormalization.service.ts
    pdfParser.service.ts           PDF text extraction
    recurringDetection.service.ts  Detect recurring charges
    statementProcessor.service.ts  Orchestrates the upload pipeline
  utils/               apiError, apiResponse, email, token
  __tests__/           Vitest + Supertest suites
  app.ts               Express app factory (used by tests, in-memory sessions)
  server.ts            Production entry (Mongo sessions, rate limiting, reminder cron)
  debug.ts             Manual debugging helper
```

## Entry Points

- **`src/server.ts`** — production/dev server: connects to MongoDB, Mongo-backed sessions, rate limiting (100 req / 15 min), billing reminder cron (every hour).
- **`src/app.ts`** — app factory without DB/cron wiring; used by the test suite with mocked models (`src/__tests__/mocks.ts`).

## API Overview

All routes are prefixed with `/api`. See the [root README](../README.md#backend-api-routes) for the full route table and request/response bodies.

| Mount point | Purpose |
|-------------|---------|
| `/api/health` | Health check |
| `/api/auth` | Google OAuth, magic links, session (`me`, `logout`) |
| `/api/subscriptions` | Subscription CRUD + search/filter |
| `/api/notifications` | Notification list + read state |
| `/api/user` | Profile updates |
| `/api/transactions/statements` | PDF statement upload + confirm |
| `/api/billing-reminders` | Manual reminder trigger |

## Authentication

Session-based auth via cookies (`credentials: "include"` on the frontend):

1. **Magic link** — `POST /api/auth/magic-link` emails a one-time token (15 min TTL, single use); `GET /api/auth/verify?token=...` creates the user if needed and logs them in.
2. **Google OAuth** — `GET /api/auth/google` → Google → `GET /api/auth/google/callback` → redirect to `{FRONTEND_URL}/dashboard`.

Users have `provider: "local" | "google"`. Sessions last 30 days.

## Testing

```bash
npm test
```

- Tests live in `src/__tests__/` and run against `app.ts` with Supertest.
- Mongoose models are mocked via `vi.mock` helpers in `mocks.ts` — no database required.
- Config: `vitest.config.ts` (30s timeouts, Node environment).

## Billing Reminder Cron

`server.ts` calls `runBillingReminders()` every hour:

- Finds active subscriptions billing within 7 days
- Skips users with `email_notifications_enabled: false`
- Converts currency when needed
- Sends 7-day, 3-day, and 1-day emails
- Idempotent via unique index on `(subscriptionId, billingDate, reminderType)`

Trigger manually: `POST /api/billing-reminders/run` (authenticated).

## License

Private — see [root README](../README.md).
