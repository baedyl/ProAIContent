# ProAI Content Studio

Create production-ready, humanized content with precise word-count enforcement, real-time credit management, and Stripe-backed billing. This repository upgrades the original proof-of-concept into a full MVP with hardened APIs, transactional persistence, and a dashboard that keeps creators on budget.

## Feature Highlights
- Trial onboarding awards 10 000 credits automatically and tracks balances in Supabase.
- Credit transactions, generation history, and purchases are auditable through dedicated tables and APIs.
- Stripe Checkout handles Starter (50k), Pro (150k), and Business (350k) bundles with verified webhooks.
- Word count validation happens before and after generation, retrying automatically if tolerance (±10 %) is breached.
- **Dashboard:** Modern UI (Tailwind CSS + Recharts) with credit health, usage charts, quick actions, and recent generations.
- **Authentication:** Secure login/signup with JWT tokens, rate limiting (5 attempts/15min), and password reset flow.
- **Responsive Navigation:** Desktop and mobile-friendly navbar with credit balance badge and user dropdown.
- **Protected Routes:** Middleware automatically secures all routes except public auth pages.
- **Content Management:** Edit, delete, and organize content with project assignment. Full CRUD operations with intuitive modals.

## Architecture & Stack
- **Frontend:** Next.js 14 (App Router), React 18, Tailwind CSS, Recharts, SWR, Framer Motion.
- **Backend:** Next.js API routes with NextAuth, Supabase service client, Stripe SDK, OpenAI.
- **Database:** Supabase/PostgreSQL with migrations under `database/migrations/`.
- **Authentication:** NextAuth with Supabase adapter, JWT sessions (24h expiry), rate limiting, password reset.
- **Security:** httpOnly cookies, bcrypt hashing, input validation (Zod), RLS policies, CSRF protection.
- **Testing:** Vitest unit tests for critical utilities plus ESLint for static checks.

## Getting Started
1. Clone the repo and install dependencies.
   ```bash
   git clone <repo-url>
   cd ProAIContent
   npm install
   ```
2. Copy `.env.example` to `.env.local` and fill in Supabase, NextAuth, OpenAI, and Stripe credentials.
3. Apply the migration `database/migrations/20250114_add_credit_system.sql` (via Supabase SQL editor or `psql`).
4. Seed test accounts (optional but recommended for development).
   ```bash
   npm run seed:test
   ```
5. Run the dev server.
   ```bash
   npm run dev
   ```
6. Visit `http://localhost:3000` and sign in with a test account or create a new account.
   - Test account: `test@contentwriter.com` / `Test@123456` (100,000 credits)
   - See `AUTHENTICATION.md` for all test accounts

## Operational Notes
- **Stripe:** Update webhook endpoint to `/api/stripe/webhook` and add the signing secret to the env file.
- **Supabase:** Service role key is required for the `adjust_user_credits` RPC; ensure RLS policies remain enabled.
- **OpenAI:** Default model is `gpt-4-turbo-preview`; override via `OPENAI_MODEL` if needed.
- **Rate Limiting:** `lib/rate-limit.ts` enforces per-user throttling on generation (10 req/min).

## Quality & Tooling
- `npm run lint` — Next.js eslint rules.
- `npm run test` — Vitest unit suite (`lib/content-constraints`, `lib/rate-limit`).
- `npm run test:coverage` — Coverage snapshot (text + JSON summary).
- `npm run check-db` — Verifies required Supabase tables exist.
- `npm run seed:test` — Creates test accounts with predefined credits.

## Key Directories
- `app/api/` — Auth, credits, content, Stripe, and generation endpoints.
- `components/` — Dashboard widgets, generation form, content preview, UI primitives.
- `lib/` — Auth helpers, Supabase RPC wrappers, Stripe config, rate limiter, content constraints.
- `database/migrations/` — SQL migrations including credit/purchase schema and RLS policies.

## Documentation
- `AUTHENTICATION.md` — Complete auth system guide: login, signup, password reset, rate limiting, test accounts.
- `API_DOCUMENTATION.md` — Endpoint contract, request/response shapes, webhook notes.
- `ADVANCED_FEATURES.md` — Personas, SERP analysis, FAQ generation, and humanization playbooks.
- `CONTENT_MANAGEMENT.md` — Edit, delete, and organize content with project assignment features.
- `SUPABASE_SETUP_GUIDE.md` — Detailed database provisioning steps if you need a fresh project.

Enjoy building on top of ProAI Content Studio! Contributions are welcome—open an issue or PR with improvements or questions. 🚀
