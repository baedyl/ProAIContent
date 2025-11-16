# Bug Fix: Stripe Create Session 500 Error

## Issue
Users were receiving a 500 error when attempting to purchase credits:
```
POST http://localhost:3000/api/stripe/create-session
{"error":"Cannot coerce the result to a single JSON object"}
```

## Root Cause
The error "Cannot coerce the result to a single JSON object" is a Supabase error that occurs when using `.single()` on a query that returns 0 or multiple rows.

The issue occurred in two places:
1. `getUserProfile()` - When fetching user profile, if the user doesn't exist in the `users` table
2. `setStripeCustomerId()` - When updating the Stripe customer ID for a user that might not exist

This commonly happens when:
- A user signs up through NextAuth but their profile hasn't been created in the `users` table yet
- The authentication flow creates the user in Supabase Auth but not in the `users` table
- Race conditions between auth and profile creation

## Solution

### 1. Changed `.single()` to `.maybeSingle()`

**Before:**
```typescript
export async function getUserProfile(userId: string): Promise<UserRecord | null> {
  const { data, error } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('id', userId)
    .single()  // ❌ Throws error if 0 or >1 rows

  if (error) {
    if (isNotFoundError(error)) {
      return null
    }
    console.error('Error fetching user profile:', error)
    throw error
  }

  return data
}
```

**After:**
```typescript
export async function getUserProfile(userId: string): Promise<UserRecord | null> {
  const { data, error } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('id', userId)
    .maybeSingle()  // ✅ Returns null if 0 rows, no error

  if (error) {
    console.error('Error fetching user profile:', error)
    throw error
  }

  return data
}
```

### 2. Updated `setStripeCustomerId()` with better error handling

**Before:**
```typescript
export async function setStripeCustomerId(userId: string, stripeCustomerId: string): Promise<UserRecord> {
  const { data, error } = await supabaseAdmin
    .from('users')
    .update({ stripe_customer_id: stripeCustomerId })
    .eq('id', userId)
    .select()
    .single()  // ❌ Throws error if update affects 0 rows

  if (error) {
    console.error('Error updating stripe customer id:', error)
    throw error
  }

  return data
}
```

**After:**
```typescript
export async function setStripeCustomerId(userId: string, stripeCustomerId: string): Promise<UserRecord> {
  const { data, error } = await supabaseAdmin
    .from('users')
    .update({ stripe_customer_id: stripeCustomerId })
    .eq('id', userId)
    .select()
    .maybeSingle()  // ✅ Returns null if 0 rows updated

  if (error) {
    console.error('Error updating stripe customer id:', error)
    throw error
  }

  if (!data) {
    throw new Error('User not found when updating Stripe customer ID')
  }

  return data
}
```

### 3. Ensured user profile exists before Stripe operations

**Updated `/app/api/stripe/create-session/route.ts`:**

**Before:**
```typescript
const profile = await getUserProfile(session.user.id)
let stripeCustomerId = profile?.stripe_customer_id || undefined
```

**After:**
```typescript
// Ensure user profile exists before proceeding
const profile = await ensureUserProfile(
  session.user.id,
  session.user.email || session.user.name || session.user.id
)

let stripeCustomerId = profile?.stripe_customer_id || undefined
```

This ensures that:
1. If the user profile doesn't exist, it gets created with trial credits
2. The profile is guaranteed to exist before we try to update the Stripe customer ID
3. All subsequent operations have a valid user record to work with

## Files Modified

1. **`lib/supabase.ts`**
   - Changed `getUserProfile()` to use `.maybeSingle()`
   - Changed `setStripeCustomerId()` to use `.maybeSingle()` with null check

2. **`app/api/stripe/create-session/route.ts`**
   - Added `ensureUserProfile()` import
   - Call `ensureUserProfile()` before fetching Stripe customer ID

## Testing

### Before Fix:
```bash
# User tries to buy credits
POST /api/stripe/create-session
→ 500 Error: Cannot coerce the result to a single JSON object
```

### After Fix:
```bash
# User tries to buy credits
POST /api/stripe/create-session
→ 200 OK: { sessionId: "...", url: "https://checkout.stripe.com/..." }
```

## Supabase Query Methods Comparison

| Method | Returns 0 rows | Returns 1 row | Returns >1 rows |
|--------|---------------|---------------|-----------------|
| `.single()` | ❌ Throws error | ✅ Returns data | ❌ Throws error |
| `.maybeSingle()` | ✅ Returns null | ✅ Returns data | ❌ Throws error |
| (no modifier) | ✅ Returns [] | ✅ Returns [data] | ✅ Returns [data, ...] |

**When to use each:**
- `.single()` - When you're 100% certain exactly 1 row exists (e.g., after INSERT with RETURNING)
- `.maybeSingle()` - When 0 or 1 rows might exist (e.g., fetching by unique key that might not exist)
- No modifier - When you expect 0 or more rows (e.g., listing, filtering)

## Prevention

To prevent similar issues in the future:

1. **Always use `.maybeSingle()` for GET operations** where the record might not exist
2. **Use `.single()` only after INSERT/UPDATE** where you're certain a row was affected
3. **Always check for null** after `.maybeSingle()` if the value is required
4. **Ensure user profiles exist** before performing operations that depend on them
5. **Add proper error handling** for all Supabase operations

## Related Issues

This fix also prevents similar errors in:
- Credit balance queries
- Transaction history fetching
- User settings retrieval
- Any other single-record lookups

## Status

✅ **Fixed** - The Stripe checkout flow now works correctly even for users whose profiles haven't been fully initialized.

## Additional Notes

The `ensureUserProfile()` function already existed in the codebase and handles:
- Creating user profile if it doesn't exist
- Awarding trial credits on first profile creation
- Updating last login timestamp
- Returning the existing or newly created profile

This makes it the perfect function to call before any operation that requires a user profile to exist.

