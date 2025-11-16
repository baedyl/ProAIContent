-- =============================================
-- ProAI Writer Database Schema for Supabase
-- =============================================
-- Run this SQL in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- USER SETTINGS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS user_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  theme TEXT DEFAULT 'light',
  default_tone TEXT DEFAULT 'professional',
  default_style TEXT DEFAULT 'informative',
  default_length TEXT DEFAULT 'medium',
  preferred_persona TEXT DEFAULT 'default',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- =============================================
-- APPLICATION USERS TABLE (Credits & Billing)
-- =============================================
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

-- Projects describe a workspace (site, brand, etc.) that can contain many contents
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  slug TEXT,
  site_url TEXT,
  persona TEXT,
  status TEXT DEFAULT 'active',
  brief TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, name)
);

-- =============================================
-- PROJECT CONTENTS TABLE (Content items per project)
-- =============================================
CREATE TABLE IF NOT EXISTS project_contents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  content_type TEXT NOT NULL,
  status TEXT DEFAULT 'draft',
  is_published BOOLEAN DEFAULT FALSE,
  published_at TIMESTAMP WITH TIME ZONE,
  content TEXT NOT NULL,
  keywords TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- USAGE LOGS TABLE (Track API Usage)
-- =============================================
CREATE TABLE IF NOT EXISTS usage_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  action TEXT NOT NULL,
  credits_used INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- CREDIT TRANSACTION TYPES ENUM
-- =============================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'credit_transaction_type') THEN
    CREATE TYPE credit_transaction_type AS ENUM ('trial', 'purchase', 'usage', 'adjustment', 'refund');
  END IF;
END
$$;

-- =============================================
-- CREDIT TRANSACTIONS TABLE
-- =============================================
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

-- =============================================
-- GENERATED CONTENT TABLE
-- =============================================
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

-- =============================================
-- PURCHASE STATUS ENUM
-- =============================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'purchase_status') THEN
    CREATE TYPE purchase_status AS ENUM ('pending', 'paid', 'failed', 'refunded');
  END IF;
END
$$;

-- =============================================
-- PURCHASES TABLE
-- =============================================
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

-- =============================================
-- CREDIT USAGE DAILY VIEW
-- =============================================
CREATE OR REPLACE VIEW credit_usage_daily AS
SELECT
  user_id,
  date_trunc('day', created_at) AS usage_day,
  SUM(ABS(amount)) FILTER (WHERE amount < 0) AS credits_spent,
  SUM(amount) FILTER (WHERE amount > 0 AND type IN ('trial', 'purchase')) AS credits_added
FROM credit_transactions
GROUP BY user_id, usage_day;

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_projects_slug ON projects(user_id, slug);
CREATE INDEX IF NOT EXISTS idx_project_contents_project_id ON project_contents(project_id);
CREATE INDEX IF NOT EXISTS idx_project_contents_user_id ON project_contents(user_id);
CREATE INDEX IF NOT EXISTS idx_project_contents_created_at ON project_contents(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_project_contents_status ON project_contents(status);
CREATE INDEX IF NOT EXISTS idx_usage_logs_user_id ON usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_logs_created_at ON usage_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(LOWER(email));
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_id ON credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_created_at ON credit_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_generated_content_user_id ON generated_content(user_id);
CREATE INDEX IF NOT EXISTS idx_generated_content_created_at ON generated_content(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_generated_content_deleted_at ON generated_content(deleted_at);
CREATE INDEX IF NOT EXISTS idx_purchases_user_id ON purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_purchases_created_at ON purchases(created_at DESC);

-- =============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================

-- Enable RLS
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_contents ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;

-- User Settings Policies
DROP POLICY IF EXISTS "Users can view their own settings" ON user_settings;
CREATE POLICY "Users can view their own settings"
  ON user_settings FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own settings" ON user_settings;
CREATE POLICY "Users can insert their own settings"
  ON user_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own settings" ON user_settings;
CREATE POLICY "Users can update their own settings"
  ON user_settings FOR UPDATE
  USING (auth.uid() = user_id);

-- Projects Policies
DROP POLICY IF EXISTS "Users can view their own projects" ON projects;
CREATE POLICY "Users can view their own projects"
  ON projects FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own projects" ON projects;
CREATE POLICY "Users can insert their own projects"
  ON projects FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own projects" ON projects;
CREATE POLICY "Users can update their own projects"
  ON projects FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own projects" ON projects;
CREATE POLICY "Users can delete their own projects"
  ON projects FOR DELETE
  USING (auth.uid() = user_id);

-- Project Contents Policies
DROP POLICY IF EXISTS "Users can view their project contents" ON project_contents;
CREATE POLICY "Users can view their project contents"
  ON project_contents FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their project contents" ON project_contents;
CREATE POLICY "Users can insert their project contents"
  ON project_contents FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their project contents" ON project_contents;
CREATE POLICY "Users can update their project contents"
  ON project_contents FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their project contents" ON project_contents;
CREATE POLICY "Users can delete their project contents"
  ON project_contents FOR DELETE
  USING (auth.uid() = user_id);

-- Usage Logs Policies
DROP POLICY IF EXISTS "Users can view their own usage logs" ON usage_logs;
CREATE POLICY "Users can view their own usage logs"
  ON usage_logs FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own usage logs" ON usage_logs;
CREATE POLICY "Users can insert their own usage logs"
  ON usage_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users table policies
DROP POLICY IF EXISTS "Users can view their profile" ON users;
CREATE POLICY "Users can view their profile"
  ON users FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their profile" ON users;
CREATE POLICY "Users can update their profile"
  ON users FOR UPDATE
  USING (auth.uid() = id);

-- Credit transactions policies
DROP POLICY IF EXISTS "Users can view their credit transactions" ON credit_transactions;
CREATE POLICY "Users can view their credit transactions"
  ON credit_transactions FOR SELECT
  USING (auth.uid() = user_id);

-- Generated content policies
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

-- Purchases policies
DROP POLICY IF EXISTS "Users can view their purchases" ON purchases;
CREATE POLICY "Users can view their purchases"
  ON purchases FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their purchases" ON purchases;
CREATE POLICY "Users can insert their purchases"
  ON purchases FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- =============================================
-- FUNCTIONS
-- =============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for user_settings
DROP TRIGGER IF EXISTS update_user_settings_updated_at ON user_settings;
CREATE TRIGGER update_user_settings_updated_at
  BEFORE UPDATE ON user_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for projects
DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for project contents
DROP TRIGGER IF EXISTS update_project_contents_updated_at ON project_contents;
CREATE TRIGGER update_project_contents_updated_at
  BEFORE UPDATE ON project_contents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for users table
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for generated_content table
DROP TRIGGER IF EXISTS update_generated_content_updated_at ON generated_content;
CREATE TRIGGER update_generated_content_updated_at
  BEFORE UPDATE ON generated_content
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for purchases table
DROP TRIGGER IF EXISTS update_purchases_updated_at ON purchases;
CREATE TRIGGER update_purchases_updated_at
  BEFORE UPDATE ON purchases
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function: Adjust user credits atomically and record transaction
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

-- =============================================
-- SAMPLE DATA (Optional - for testing)
-- =============================================

-- Uncomment to add sample data
/*
-- Example: create a workspace and its first draft article
-- INSERT INTO projects (user_id, name, site_url) VALUES (auth.uid(), 'Demo Workspace', 'https://example.com');
-- INSERT INTO project_contents (project_id, user_id, title, content_type, content)
-- VALUES ((SELECT id FROM projects WHERE name = 'Demo Workspace' LIMIT 1), auth.uid(), 'Welcome Article', 'blog', 'Hello world!');
*/

-- =============================================
-- VERIFICATION QUERIES
-- =============================================

-- Check if tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'user_settings',
  'users',
  'projects',
  'project_contents',
  'usage_logs',
  'credit_transactions',
  'generated_content',
  'purchases'
);

-- Check RLS policies
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public';

-- =============================================
-- INSTRUCTIONS
-- =============================================

/*
1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Create a new query
4. Copy and paste this entire SQL file
5. Click "Run" to execute

This will create:
- 4 tables (user_settings, projects, project_contents, usage_logs)
- Indexes for performance
- Row Level Security policies
- Triggers for automatic timestamps

After running, verify by checking:
- Table Editor to see the new tables
- Authentication -> Policies to see RLS policies
*/

