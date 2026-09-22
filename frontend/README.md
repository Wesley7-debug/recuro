# Recuro Frontend

React SPA for the Recuro subscription tracker — landing page, authentication (Google OAuth + magic links), and the authenticated dashboard.

## Stack

- **React 19** + TypeScript (strict), built with **Vite 8**
- **Tailwind CSS v4** (via `@tailwindcss/vite`)
- **React Router 6** for routing
- **Zustand** for state (user, subscriptions, notifications)
- **Oxlint** for linting

## Getting Started

```bash
cd frontend
npm install
cp .env.example .env   # VITE_API_URL=http://localhost:3001
npm run dev
```

The app runs at `http://localhost:5173` and proxies `/api` requests to `http://localhost:3001` (see `vite.config.ts`). Make sure the [backend](../backend/README.md) is running.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server with HMR (port 5173) |
| `npm run build` | Type-check (`tsc -b`) and build for production |
| `npm run preview` | Preview the production build |
| `npm run lint` | Run Oxlint |

## Environment Variables

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Backend base URL (default `""` → same-origin, works with the dev proxy) |

## Project Structure

```
src/
  components/
    landing/            Landing page sections (Hero, Features, Pricing, CTA, ...)
    AuthLayout.tsx      Shared auth page shell
    MagicLinkForm.tsx   Email magic-link request form
    OAuthButtons.tsx    "Continue with Google" button
    ProtectedRoute.tsx  PublicRoute/ProtectedRoute guards
    Toast.tsx, Modal.tsx, FormField.tsx, StatCard.tsx, ...
  contexts/
    AuthContext.tsx     Exposes user state to the tree
  lib/
    api/client.ts       Fetch wrapper (credentials: "include") + API methods
    exchangeRate.ts     FX rates with 1h cache + fallbacks
    utils.ts            Shared helpers
  pages/
    LandingPage.tsx     Marketing page (/)
    LoginPage.tsx       /login
    SignupPage.tsx      /signup
    VerifyPage.tsx      /auth/verify — magic-link redirect handler
    dashboard/
      DashboardLayout.tsx      Authenticated shell + nested routes
      OverviewPage.tsx         Stats cards, spending by category
      SubscriptionsPage.tsx    CRUD table, search/filter, PDF upload
      NotificationsPage.tsx    Notification feed
      SettingsPage.tsx         Profile, currency, email prefs
  stores/
    userStore.ts            Current user (fetch/logout/refresh)
    subscriptionStore.ts    Subscription list + filters
    notificationStore.ts    Notifications + unread state
  App.tsx                Route definitions
  main.tsx               Entry point
```

## Routes

| Path | Access | Page |
|------|--------|------|
| `/` | Public | LandingPage |
| `/login` | Public only | LoginPage (Google OAuth or magic link) |
| `/signup` | Public only | SignupPage (magic link + currency/consent) |
| `/auth/verify` | Public | VerifyPage (magic-link verification) |
| `/dashboard` | Auth only | OverviewPage |
| `/dashboard/subscriptions` | Auth only | SubscriptionsPage |
| `/dashboard/notifications` | Auth only | NotificationsPage |
| `/dashboard/settings` | Auth only | SettingsPage |

Access control is handled by `ProtectedRoute` / `PublicRoute` in `src/components/ProtectedRoute.tsx`, backed by `AuthContext` + `userStore` (`GET /api/auth/me`).

## Authentication Flow

- **Magic link**: submit email → backend emails a one-time link → `/auth/verify?token=...` → backend verifies, sets session cookie, redirects to `/dashboard`.
- **Google OAuth**: "Continue with Google" → backend `/api/auth/google` → Google → callback → redirect to `/dashboard`.
- All API calls use `credentials: "include"` so the session cookie is sent cross-origin; in dev, the `/api` proxy avoids CORS entirely.

## API Client

All requests go through `src/lib/api/client.ts`:

```ts
api.auth.googleURL()        // → ${VITE_API_URL}/api/auth/google
api.auth.requestMagicLink(email, emailConsent?, preferredCurrency?)
api.auth.me() / api.auth.logout()
api.subscriptions.list/get/create/update/delete
api.notifications.list / markRead / markAllRead
api.user.updateProfile
api.statements.upload(file) / confirm(detectionId, indices)
```

Errors throw `Error` with the backend's `message`; the full API surface is documented in the [root README](../README.md#backend-api-routes).

## Build & Lint

```bash
npm run build   # tsc -b && vite build → dist/
npm run lint    # oxlint
```

## License

Private — see [root README](../README.md).
