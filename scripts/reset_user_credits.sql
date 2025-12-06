-- Reset all user credits to 0
-- This script resets the credits_balance for all users to 0

UPDATE users 
SET credits_balance = 0 
WHERE credits_balance != 0;

-- Log the reset action
INSERT INTO credit_transactions (
  user_id, 
  amount, 
  type, 
  description, 
  balance_before, 
  balance_after
)
SELECT 
  id as user_id,
  -(credits_balance) as amount,
  'adjustment' as type,
  'System reset: credits set to 0' as description,
  credits_balance as balance_before,
  0 as balance_after
FROM users 
WHERE credits_balance != 0;