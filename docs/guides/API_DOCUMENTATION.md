# API Documentation

All endpoints live under `app/api/` (Next.js App Router). Unless noted, requests require an authenticated NextAuth session; session cookies are exchanged automatically when calling from the frontend.

## Authentication & Sessions
- `POST /api/auth/signup` triggers Supabase email verification; no credits are issued until the user confirms and logs in.
- On first authenticated session, `awardTrialCreditsIfNeeded` deposits **10 000** trial credits and creates default settings.
- Session cookies must be included (`credentials: 'include'`) for programmatic access. Unauthenticated calls return **401**.

## Standard Error Envelope
```json
{
  "error": "Readable description",
  "details": {} // optional Zod issues or metadata
}
```

---

## Content Generation

### `POST /api/generate`
- **Goal:** Produce Markdown content that respects requested word count (±10 % tolerance) and deduct credits equal to the final word count.
- **Body schema (Zod):**
  - `contentType` — string (`blog`, `product-review`, `comparison`, `affiliate`, …).
  - `topic` — string, min length 3.
  - `tone`, `style` — strings, min length 3.
  - `wordCount` — integer **50-5000**.
  - Optional: `keywords`, `targetAudience`, `additionalInstructions`, `personaId`, `includeFAQ`, `includeVideo`, `includeCompetitorHeaders`, `useSerpAnalysis`, `settings`.
- **Responses:**
  - `200` with `{ content, requestedWordCount, actualWordCount, creditsDeducted, remainingCredits, attemptCount, metadata }`.
  - `402` when credits < maximum tolerance bound; payload includes `currentBalance` and `requiredCredits`.
  - `422` if retries cannot land within tolerance.
  - `429` rate limit exceeded (10 requests / 60 s per user).
  - `500` unexpected OpenAI/Supabase issues; credits are refunded automatically.
- **Headers:** `X-RateLimit-Remaining`, `X-RateLimit-Reset`.

---

## Credit Management APIs

### `GET /api/credits/balance`
- Returns `{ balance, trialCreditsGiven, stripeCustomerId }`.

### `GET /api/credits/summary`
- Aggregates lifetime usage / generation counts plus estimated savings (`balance` + assumed $0.08 per word human cost).

### `GET /api/credits/usage?days=30`
- Daily breakdown powered by Supabase view `credit_usage_daily`.
- Query param `days` clamped to 1–180.

### `GET /api/credits/transactions?limit=20&cursor=timestamp`
- Paginates credit activity (usage, trial, purchase, adjustment, refund).
- Response: `{ transactions: CreditTransaction[], nextCursor, limit }`.

---

## Generated Content APIs

### `GET /api/contents?limit=10&cursor=timestamp&search=query`
- Lists latest content not soft-deleted. Search covers title and body (`ILIKE`).

### `POST /api/contents`
- Persists manual content entries. Requires `title` and `content`; server recalculates `word_count`.

### `GET /api/contents/:id`
- Fetch single record. Returns **404** if missing or `deleted_at` set.

### `PATCH /api/contents/:id`
- Accepts partial updates to `title`, `content`, `requested_length`, `settings`.
- Word count recalculated; `requested_length` minimum enforced at 50.

### `DELETE /api/contents/:id`
- Soft delete by setting `deleted_at`. Always returns `200` on success.

---

## Stripe & Purchases

### `GET /api/credits/packages`
- Static credit bundles: Starter (50 000), Pro (150 000), Business (350 000) with pricing.

### `POST /api/stripe/create-session`
- Body `{ "packageId": "starter" | "pro" | "business" }`.
- Creates Stripe Checkout session, stores pending purchase row, and returns `{ sessionId, url }`.
- Errors: **401** (no session), **404** (unknown package), **500** (Stripe/Supabase issues).

### `POST /api/stripe/webhook`
- Validated using `STRIPE_WEBHOOK_SECRET`.
- Handles:
  - `checkout.session.completed` & `checkout.session.async_payment_succeeded` → mark purchase `paid`, add credits via `adjust_user_credits`.
  - `payment_intent.payment_failed` → mark purchase `failed`, persist `failureReason`.
- Responds `{ received: true }` or **400** on signature mismatch.

### `GET /api/purchases?limit=20&cursor=timestamp`
- Paginated purchase history for UI tables.

---

## Status Code Reference
| Code | Usage | Notes |
| ---- | ----- | ----- |
| 200  | Successful request | Standard GET/PATCH/DELETE responses |
| 201  | Resource created | Currently used for manual content inserts |
| 202  | Webhook acknowledgement | Stripe webhook handler |
| 400  | Validation error | Zod schema failures |
| 401  | Unauthorized | Missing/expired NextAuth session |
| 402  | Payment required | Insufficient credits for generation |
| 404  | Not found | Missing content, purchase, or transaction |
| 409  | Conflict | Duplicate Stripe session or stale state |
| 422  | Unprocessable | Content generation tolerance failure |
| 429  | Rate limited | Generation throttle hit |
| 500  | Server error | Unhandled OpenAI, Stripe, or Supabase issue |

---

## Testing the API
- Use `npm run dev` and login through the UI to acquire session cookies.
- Stripe CLI command for local webhook forwarding:
  ```bash
  stripe listen --forward-to localhost:3000/api/stripe/webhook
  ```
- Set `OPENAI_MODEL=gpt-3.5-turbo` for cheaper local testing if accuracy tolerances permit.

_Last updated: 14 Nov 2025_


