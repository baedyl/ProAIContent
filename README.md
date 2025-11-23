# ProAI Content Studio

Create production-ready, humanized content with precise word-count enforcement, real-time credit management, and Stripe-backed billing. This repository upgrades the original proof-of-concept into a full MVP with hardened APIs, transactional persistence, and a dashboard that keeps creators on budget.

## 🚀 Quick Deploy to Render

**Having build issues?** See [RENDER_SETUP.md](./RENDER_SETUP.md) for a step-by-step fix guide.

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com)

**Important:** After deployment, you MUST configure environment variables in Render dashboard. See [DEPLOYMENT.md](./DEPLOYMENT.md) for complete instructions.

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
- **OpenAI:** Default model is `gpt-4o`; override via `OPENAI_MODEL` if needed.
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

All documentation has been organized in the `docs/` directory:

### 📚 Setup & Installation
- [Quick Start](docs/setup/QUICK_START.md) — Get started quickly with minimal setup
- [Quickstart Guide](docs/setup/QUICKSTART.md) — Alternative quickstart guide
- [Installation Complete](docs/setup/INSTALLATION_COMPLETE.md) — Post-installation checklist
- [Setup Guide](docs/setup/SETUP.md) — Detailed setup instructions
- [Database Setup](docs/setup/DATABASE_SETUP_GUIDE.md) — Comprehensive database setup
- [Database Instructions](docs/setup/SETUP_DATABASE_INSTRUCTIONS.md) — Step-by-step database setup
- [Quick Migration](docs/setup/QUICK_START_MIGRATION.md) — Migration guide for existing projects
- [Database Migration](docs/setup/DATABASE_MIGRATION_INSTRUCTIONS.md) — Database migration instructions
- [Supabase Setup](docs/setup/SUPABASE_SETUP_GUIDE.md) — Detailed Supabase provisioning
- [Stripe Webhook Setup](docs/setup/STRIPE_WEBHOOK_SETUP.md) — Configure Stripe webhooks

### ⭐ Features
- [Features Overview](docs/features/FEATURES.md) — All available features
- [Advanced Features](docs/features/ADVANCED_FEATURES.md) — Personas, SERP analysis, FAQ generation
- [Content Management](docs/features/CONTENT_MANAGEMENT.md) — Edit, delete, organize content
- [Personas Feature](docs/features/PERSONAS_FEATURE.md) — Writing personas and styles
- [Personas Migration](docs/features/PERSONAS_MIGRATION_GUIDE.md) — Migrate to persona system
- [What's New](docs/features/WHATS_NEW.md) — Latest features and updates

### 🔧 Implementation Details
- [Authentication](docs/implementation/AUTHENTICATION.md) — Complete auth system guide
- [Auth Implementation](docs/implementation/IMPLEMENTATION_AUTH.md) — Auth implementation details
- [Auth Summary](docs/implementation/AUTH_IMPLEMENTATION_SUMMARY.md) — Auth summary
- [Auth & Logo Summary](docs/implementation/AUTH_AND_LOGO_SUMMARY.md) — Auth and branding
- [Implementation Complete](docs/implementation/IMPLEMENTATION_COMPLETE.md) — Implementation checklist
- [Implementation Summary](docs/implementation/IMPLEMENTATION_SUMMARY.md) — Overall implementation summary
- [Humanization Implementation](docs/implementation/HUMANIZATION_IMPLEMENTATION_SUMMARY.md) — Humanization features
- [Project Summary](docs/implementation/PROJECT_SUMMARY.md) — Complete project overview

### 📖 Guides
- [API Documentation](docs/guides/API_DOCUMENTATION.md) — Endpoint contracts and webhooks
- [Humanization Guide](docs/guides/HUMANIZATION_GUIDE.md) — Create human-like content
- [Humanization Quick Tips](docs/guides/HUMANIZATION_QUICK_TIPS.md) — Quick humanization tips
- [Humanization Visual Guide](docs/guides/HUMANIZATION_VISUAL_GUIDE.md) — Visual humanization guide
- [SERP Analysis Guide](docs/guides/SERP_ANALYSIS_GUIDE.md) — SEO and competitor analysis
- [Contributing](docs/guides/CONTRIBUTING.md) — Contribution guidelines

### 🗄️ Database
- [Database Schema](docs/database/database_schema.sql) — Complete database schema
- [Quick Database Setup](docs/database/QUICK_DATABASE_SETUP.sql) — Quick setup SQL script

### 📝 Changelog & Bug Fixes
- [Changelog](docs/changelog/CHANGELOG.md) — Version history
- [Bug Fixes 2025-01-16](docs/changelog/BUGFIXES_2025_01_16.md) — Recent bug fixes
- [Max Tokens Fix](docs/changelog/BUGFIX_MAX_TOKENS.md) — Token limit fix
- [Stripe 500 Fix](docs/changelog/BUGFIX_STRIPE_500.md) — Stripe error resolution
- [Word Count Fix](docs/changelog/BUGFIX_WORD_COUNT.md) — Word count validation fix
- [Projects Error Fix](docs/changelog/FIX_PROJECTS_ERROR.md) — Projects feature fix
- [Formatting & Persona Fix](docs/changelog/FORMATTING_AND_PERSONA_FIX.md) — Formatting improvements
- [Troubleshooting Generation](docs/changelog/TROUBLESHOOTING_GENERATION.md) — Common generation issues

Enjoy building on top of ProAI Content Studio! Contributions are welcome—open an issue or PR with improvements or questions. 🚀
