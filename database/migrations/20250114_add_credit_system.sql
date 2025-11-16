-- =============================================
-- Migration: Add credits, transactions, purchases schema
-- =============================================

-- Depends on uuid-ossp extension created during initial setup

-- Application users table (references Supabase auth.users)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  credits_balance BIGINT NOT NULL DEFAULT 0,
  trial_credits_given BOOLEAN NOT NULL DEFAULT FALSE,
  stripe_customer_id TEXT,
  last_login_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE users
  ADD CONSTRAINT users_credits_balance_non_negative
  CHECK (credits_balance >= 0);

-- Credit transaction type enum
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'credit_transaction_type') THEN
    CREATE TYPE credit_transaction_type AS ENUM ('trial', 'purchase', 'usage', 'adjustment', 'refund');
  END IF;
END
$$;

-- Credit transactions table
CREATE TABLE IF NOT EXISTS credit_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount BIGINT NOT NULL,
  type credit_transaction_type NOT NULL,
  description TEXT,
  balance_before BIGINT,
  balance_after BIGINT,
  stripe_payment_id TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE credit_transactions
  ADD CONSTRAINT credit_transactions_amount_non_zero
  CHECK (amount <> 0);

-- Generated content table
CREATE TABLE IF NOT EXISTS generated_content (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  word_count INTEGER NOT NULL,
  credits_used INTEGER NOT NULL,
  requested_length INTEGER NOT NULL,
  settings JSONB DEFAULT '{}'::jsonb,
  status TEXT DEFAULT 'completed',
  retry_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE generated_content
  ADD CONSTRAINT generated_content_word_count_positive
  CHECK (word_count > 0);

ALTER TABLE generated_content
  ADD CONSTRAINT generated_content_credits_used_non_negative
  CHECK (credits_used >= 0);

-- Purchase status enum
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'purchase_status') THEN
    CREATE TYPE purchase_status AS ENUM ('pending', 'paid', 'failed', 'refunded');
  END IF;
END
$$;

-- Purchases table
CREATE TABLE IF NOT EXISTS purchases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  stripe_session_id TEXT UNIQUE,
  stripe_payment_id TEXT UNIQUE,
  amount_cents INTEGER NOT NULL,
  credits_purchased INTEGER NOT NULL,
  status purchase_status NOT NULL DEFAULT 'pending',
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE purchases
  ADD CONSTRAINT purchases_amount_positive
  CHECK (amount_cents > 0);

ALTER TABLE purchases
  ADD CONSTRAINT purchases_credits_positive
  CHECK (credits_purchased > 0);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(LOWER(email));
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_id ON credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_created_at ON credit_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_generated_content_user_id ON generated_content(user_id);
CREATE INDEX IF NOT EXISTS idx_generated_content_created_at ON generated_content(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_generated_content_deleted_at ON generated_content(deleted_at);
CREATE INDEX IF NOT EXISTS idx_purchases_user_id ON purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_purchases_created_at ON purchases(created_at DESC);

-- View for credit usage analytics
CREATE OR REPLACE VIEW credit_usage_daily AS
SELECT
  user_id,
  date_trunc('day', created_at) AS usage_day,
  SUM(ABS(amount)) FILTER (WHERE amount < 0) AS credits_spent,
  SUM(amount) FILTER (WHERE amount > 0 AND type IN ('trial', 'purchase')) AS credits_added
FROM credit_transactions
GROUP BY user_id, usage_day;

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Users can view their profile" ON users;
CREATE POLICY "Users can view their profile"
  ON users FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their profile" ON users;
CREATE POLICY "Users can update their profile"
  ON users FOR UPDATE
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can view their credit transactions" ON credit_transactions;
CREATE POLICY "Users can view their credit transactions"
  ON credit_transactions FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view their generated content" ON generated_content;
CREATE POLICY "Users can view their generated content"
  ON generated_content FOR SELECT
  USING (auth.uid() = user_id AND deleted_at IS NULL);

DROP POLICY IF EXISTS "Users can insert their generated content" ON generated_content;
CREATE POLICY "Users can insert their generated content"
  ON generated_content FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their generated content" ON generated_content;
CREATE POLICY "Users can update their generated content"
  ON generated_content FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view their purchases" ON purchases;
CREATE POLICY "Users can view their purchases"
  ON purchases FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their purchases" ON purchases;
CREATE POLICY "Users can insert their purchases"
  ON purchases FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Timestamp triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_generated_content_updated_at ON generated_content;
CREATE TRIGGER update_generated_content_updated_at
  BEFORE UPDATE ON generated_content
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_purchases_updated_at ON purchases;
CREATE TRIGGER update_purchases_updated_at
  BEFORE UPDATE ON purchases
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Atomic credit adjustment helper
CREATE OR REPLACE FUNCTION adjust_user_credits(
  p_user_id UUID,
  p_amount BIGINT,
  p_type credit_transaction_type,
  p_description TEXT DEFAULT NULL,
  p_stripe_payment_id TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
) RETURNS credit_transactions AS $$
DECLARE
  current_balance BIGINT;
  new_balance BIGINT;
  inserted_txn credit_transactions;
BEGIN
  SELECT credits_balance INTO current_balance
  FROM users
  WHERE id = p_user_id
  FOR UPDATE;

  IF current_balance IS NULL THEN
    RAISE EXCEPTION 'User % not found', p_user_id;
  END IF;

  new_balance := current_balance + p_amount;

  IF new_balance < 0 THEN
    RAISE EXCEPTION 'Insufficient credits';
  END IF;

  UPDATE users
  SET credits_balance = new_balance,
      updated_at = NOW()
  WHERE id = p_user_id;

  INSERT INTO credit_transactions (
    user_id,
    amount,
    type,
    description,
    balance_before,
    balance_after,
    stripe_payment_id,
    metadata
  ) VALUES (
    p_user_id,
    p_amount,
    p_type,
    p_description,
    current_balance,
    new_balance,
    p_stripe_payment_id,
    COALESCE(p_metadata, '{}'::jsonb)
  )
  RETURNING * INTO inserted_txn;

  RETURN inserted_txn;
END;
$$ LANGUAGE plpgsql;

