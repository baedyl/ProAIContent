# Stripe Webhook Setup Guide

## Problem: Purchases Stay "Pending" in Development

When testing Stripe payments locally, you'll notice that:
- ✅ Payment succeeds on Stripe's side
- ❌ Purchase status remains "pending" in your database
- ❌ Credits are not added to your account

**Why?** Stripe webhooks can't reach `localhost` automatically. Webhooks are HTTP callbacks that Stripe sends to your server when events occur (like successful payments).

## Solutions

### Option 1: Manual Completion (Quick Test) ⚡

**Best for:** Quick testing without additional setup

1. **Complete your test purchase** on Stripe checkout
2. **Visit the dev tools page:** `http://localhost:3000/dev-tools`
3. **Click "Complete Purchase"** next to your pending purchase
4. **Credits will be added immediately**

**How it works:**
- The dev tools page calls `/api/stripe/manual-complete`
- This endpoint simulates what the webhook would do
- Only available in development mode (disabled in production)

**Limitations:**
- Manual process (not automatic)
- Doesn't test the actual webhook flow
- Need to remember to complete purchases manually

---

### Option 2: Stripe CLI (Recommended) 🎯

**Best for:** Realistic testing that mirrors production

#### Step 1: Install Stripe CLI

**macOS (Homebrew):**
```bash
brew install stripe/stripe-cli/stripe
```

**Windows (Scoop):**
```bash
scoop bucket add stripe https://github.com/stripe/scoop-stripe-cli.git
scoop install stripe
```

**Linux:**
```bash
# Download from https://github.com/stripe/stripe-cli/releases/latest
tar -xvf stripe_X.X.X_linux_x86_64.tar.gz
sudo mv stripe /usr/local/bin/
```

**Verify installation:**
```bash
stripe --version
```

#### Step 2: Login to Stripe

```bash
stripe login
```

This will:
1. Open your browser
2. Ask you to authorize the CLI
3. Connect to your Stripe account

#### Step 3: Forward Webhooks to Localhost

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

**Expected output:**
```
> Ready! Your webhook signing secret is whsec_1234567890abcdef...
> Forwarding webhooks to http://localhost:3000/api/stripe/webhook
```

#### Step 4: Update Environment Variables

Copy the webhook signing secret from the CLI output and add it to `.env.local`:

```env
STRIPE_WEBHOOK_SECRET=whsec_1234567890abcdef...
```

**Important:** Restart your Next.js dev server after updating `.env.local`

```bash
# Stop the server (Ctrl+C)
# Start it again
npm run dev
```

#### Step 5: Test the Flow

1. Make a test purchase
2. Watch the Stripe CLI terminal - you'll see webhook events in real-time
3. Purchase status will automatically change to "paid"
4. Credits will be added to your account immediately

**Example CLI output:**
```
2024-01-15 10:30:45  --> checkout.session.completed [evt_1234...]
2024-01-15 10:30:45  <-- [200] POST http://localhost:3000/api/stripe/webhook
```

---

## Production Setup

In production, Stripe will send webhooks directly to your server. No CLI needed!

### Step 1: Deploy Your Application

Deploy to Vercel, Netlify, or your hosting provider.

### Step 2: Configure Webhook Endpoint in Stripe Dashboard

1. Go to [Stripe Dashboard → Developers → Webhooks](https://dashboard.stripe.com/webhooks)
2. Click **"Add endpoint"**
3. Enter your webhook URL:
   ```
   https://your-domain.com/api/stripe/webhook
   ```
4. Select events to listen to:
   - ✅ `checkout.session.completed`
   - ✅ `checkout.session.async_payment_succeeded`
   - ✅ `payment_intent.payment_failed`
5. Click **"Add endpoint"**

### Step 3: Copy Webhook Signing Secret

1. Click on your newly created webhook endpoint
2. Click **"Reveal"** next to "Signing secret"
3. Copy the secret (starts with `whsec_`)
4. Add it to your production environment variables:
   ```env
   STRIPE_WEBHOOK_SECRET=whsec_production_secret_here
   ```

### Step 4: Test in Production

1. Make a real purchase (or use test mode)
2. Check Stripe Dashboard → Webhooks → Your endpoint
3. You'll see successful webhook deliveries
4. Credits should be added automatically

---

## Troubleshooting

### Issue: "Webhook signature verification failed"

**Cause:** Wrong webhook secret or secret not set

**Solution:**
```bash
# Development: Check Stripe CLI output for the correct secret
stripe listen --forward-to localhost:3000/api/stripe/webhook

# Production: Get secret from Stripe Dashboard → Webhooks → Your endpoint
```

Update `.env.local` (dev) or environment variables (production):
```env
STRIPE_WEBHOOK_SECRET=whsec_your_actual_secret
```

Then restart your server.

---

### Issue: Stripe CLI says "Connection refused"

**Cause:** Next.js dev server not running or wrong port

**Solution:**
```bash
# Make sure dev server is running
npm run dev

# Check which port it's using (usually 3000)
# Update the forward-to URL if needed
stripe listen --forward-to localhost:3001/api/stripe/webhook  # if using port 3001
```

---

### Issue: Purchase still pending after webhook

**Cause:** Error in webhook handler

**Solution:**
1. Check your terminal for error messages
2. Check Stripe CLI output for the response code
3. Common issues:
   - Database connection error
   - User profile doesn't exist
   - Invalid purchase record

**Debug:**
```bash
# Check webhook handler logs
# Look for errors in your terminal where Next.js is running

# Check Stripe CLI for response codes
# 200 = Success
# 400/500 = Error (check server logs)
```

---

### Issue: Credits added twice

**Cause:** Webhook processed multiple times or manual completion after webhook

**Solution:**
The webhook handler checks if the purchase is already marked as "paid" and skips processing:

```typescript
if (purchase.status === 'paid') {
  return  // Already processed, skip
}
```

If you see duplicate credits:
1. Check your database for duplicate transactions
2. Ensure you're not manually completing after webhook succeeds
3. Check Stripe Dashboard for duplicate webhook deliveries

---

## Webhook Events Explained

### `checkout.session.completed`
- **When:** Immediately after successful payment
- **What we do:** Add credits, mark purchase as paid
- **Most common event**

### `checkout.session.async_payment_succeeded`
- **When:** Payment succeeds after initial checkout (e.g., bank transfer)
- **What we do:** Same as above
- **Less common, but important for some payment methods**

### `payment_intent.payment_failed`
- **When:** Payment fails
- **What we do:** Mark purchase as failed, log reason
- **Helps track failed transactions**

---

## Testing Checklist

### Development (with Stripe CLI):
- [ ] Install and login to Stripe CLI
- [ ] Start webhook forwarding
- [ ] Copy webhook secret to `.env.local`
- [ ] Restart Next.js dev server
- [ ] Make test purchase
- [ ] Verify credits added automatically
- [ ] Check CLI shows 200 response

### Development (manual completion):
- [ ] Make test purchase
- [ ] Visit `/dev-tools`
- [ ] Click "Complete Purchase"
- [ ] Verify credits added
- [ ] Verify purchase status changed to "paid"

### Production:
- [ ] Configure webhook endpoint in Stripe Dashboard
- [ ] Add webhook secret to production env vars
- [ ] Make test purchase
- [ ] Verify credits added automatically
- [ ] Check Stripe Dashboard for successful webhook delivery

---

## Best Practices

### Development
1. **Use Stripe CLI** for realistic testing
2. **Keep CLI running** while testing payments
3. **Check CLI output** for webhook events and errors
4. **Use test cards** from [Stripe Testing Docs](https://stripe.com/docs/testing)

### Production
1. **Monitor webhooks** in Stripe Dashboard
2. **Set up alerts** for failed webhook deliveries
3. **Log webhook events** for debugging
4. **Test thoroughly** before going live
5. **Use webhook retry** feature in Stripe (automatic)

---

## Stripe Test Cards

Use these for testing:

| Card Number | Description |
|-------------|-------------|
| 4242 4242 4242 4242 | Successful payment |
| 4000 0000 0000 9995 | Declined (insufficient funds) |
| 4000 0000 0000 0002 | Declined (generic) |
| 4000 0025 0000 3155 | Requires authentication (3D Secure) |

**Details for all test cards:**
- **Expiry:** Any future date (e.g., 12/34)
- **CVC:** Any 3 digits (e.g., 123)
- **ZIP:** Any 5 digits (e.g., 12345)

---

## Quick Reference

### Start Stripe CLI forwarding:
```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

### Test a webhook manually:
```bash
stripe trigger checkout.session.completed
```

### View recent webhook events:
```bash
stripe events list --limit 10
```

### Check webhook endpoint status:
```bash
stripe webhook_endpoints list
```

---

## Support

### Stripe CLI Issues
- [Stripe CLI Documentation](https://stripe.com/docs/stripe-cli)
- [Stripe CLI GitHub](https://github.com/stripe/stripe-cli)

### Webhook Issues
- [Stripe Webhooks Guide](https://stripe.com/docs/webhooks)
- [Testing Webhooks](https://stripe.com/docs/webhooks/test)

### ProAI Writer Issues
- Check `/dev-tools` page for pending purchases
- Review server logs for webhook errors
- Verify environment variables are set correctly

---

## Summary

**For Development:**
- ✅ **Option 1:** Use `/dev-tools` page for quick manual completion
- ✅ **Option 2:** Use Stripe CLI for automatic webhook forwarding (recommended)

**For Production:**
- ✅ Configure webhook endpoint in Stripe Dashboard
- ✅ Add webhook secret to production environment
- ✅ Monitor webhook deliveries in Stripe Dashboard

**Remember:**
- Webhooks don't work on localhost without Stripe CLI
- Always restart your server after changing `.env.local`
- Test thoroughly before deploying to production
- Monitor webhook deliveries in Stripe Dashboard

🎉 **You're all set!** Choose the method that works best for your workflow.

