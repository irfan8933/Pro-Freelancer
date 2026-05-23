// Database Setup Script for Supabase instance
export const migrationSQL = `
-- Drop tables if they exist to allow clean re-run for development (Optional, handle with care in prod)
-- DROP TABLE IF EXISTS submissions, deposit_requests, withdraw_requests, points_ledger, tasks, conversion_settings, profiles CASCADE;

-- 1. Create Tables

CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  balance NUMERIC DEFAULT 0,
  pending_balance NUMERIC DEFAULT 0,
  points NUMERIC DEFAULT 0,
  referral_code TEXT UNIQUE,
  invited_by TEXT REFERENCES profiles(referral_code) ON DELETE SET NULL,
  is_banned BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  reward_points NUMERIC NOT NULL DEFAULT 0,
  link TEXT,
  category TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  screenshot_url TEXT NOT NULL,
  note TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS deposit_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  transaction_id TEXT NOT NULL,
  screenshot_url TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS withdraw_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  bkash_number TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS points_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
  points NUMERIC NOT NULL,
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS conversion_settings (
  id INTEGER PRIMARY KEY CHECK (id = 1), -- Single row table
  point_to_bdt_rate NUMERIC NOT NULL DEFAULT 1,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default conversion setting if not exists
INSERT INTO conversion_settings (id, point_to_bdt_rate) VALUES (1, 1.0) ON CONFLICT (id) DO NOTHING;

-- 2. Auth Trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  ref_code TEXT;
BEGIN
  -- Generate simple 6-char referral code
  ref_code := upper(substring(md5(random()::text) from 1 for 6));
  
  -- You could handle invited_by extraction here if passed via user_metadata
  
  INSERT INTO public.profiles (id, email, full_name, role, referral_code)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    -- Default to admin if specific email, or keep user
    CASE WHEN new.email = 'admin@profreelancer.com' THEN 'admin' ELSE 'user' END,
    ref_code
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists to avoid errors on re-run
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


-- 3. Storage
INSERT INTO storage.buckets (id, name, public) VALUES ('screenshots', 'screenshots', true) ON CONFLICT DO NOTHING;

-- Storage Policies
DROP POLICY IF EXISTS "Public View Access" ON storage.objects;
CREATE POLICY "Public View Access" ON storage.objects FOR SELECT USING ( bucket_id = 'screenshots' );

DROP POLICY IF EXISTS "Authenticated users can upload objects" ON storage.objects;
CREATE POLICY "Authenticated users can upload objects" ON storage.objects FOR INSERT TO authenticated WITH CHECK ( bucket_id = 'screenshots' );

-- 4. Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE deposit_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE withdraw_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE points_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversion_settings ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies

-- Profiles
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
CREATE POLICY "Users can read own profile" ON profiles FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can manage profiles" ON profiles;
CREATE POLICY "Admins can manage profiles" ON profiles FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Tasks
DROP POLICY IF EXISTS "Anyone can read tasks" ON tasks;
CREATE POLICY "Anyone can read tasks" ON tasks FOR SELECT USING (true); -- Public read

DROP POLICY IF EXISTS "Admins can manage tasks" ON tasks;
CREATE POLICY "Admins can manage tasks" ON tasks FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Submissions
DROP POLICY IF EXISTS "Users can read own submissions" ON submissions;
CREATE POLICY "Users can read own submissions" ON submissions FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create submissions" ON submissions;
CREATE POLICY "Users can create submissions" ON submissions FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can manage submissions" ON submissions;
CREATE POLICY "Admins can manage submissions" ON submissions FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Deposit Requests
DROP POLICY IF EXISTS "Users can read own deposits" ON deposit_requests;
CREATE POLICY "Users can read own deposits" ON deposit_requests FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create deposits" ON deposit_requests;
CREATE POLICY "Users can create deposits" ON deposit_requests FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can manage deposits" ON deposit_requests;
CREATE POLICY "Admins can manage deposits" ON deposit_requests FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Withdraw Requests
DROP POLICY IF EXISTS "Users can read own withdraws" ON withdraw_requests;
CREATE POLICY "Users can read own withdraws" ON withdraw_requests FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create withdraws" ON withdraw_requests;
CREATE POLICY "Users can create withdraws" ON withdraw_requests FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can manage withdraws" ON withdraw_requests;
CREATE POLICY "Admins can manage withdraws" ON withdraw_requests FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Points Ledger
DROP POLICY IF EXISTS "Users can read own points ledger" ON points_ledger;
CREATE POLICY "Users can read own points ledger" ON points_ledger FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view points ledger" ON points_ledger;
CREATE POLICY "Admins can view points ledger" ON points_ledger FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Conversion Settings
DROP POLICY IF EXISTS "Anyone can read conversion settings" ON conversion_settings;
CREATE POLICY "Anyone can read conversion settings" ON conversion_settings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage conversion settings" ON conversion_settings;
CREATE POLICY "Admins can manage conversion settings" ON conversion_settings FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- 6. Enable Realtime Publications
-- We need these tables to be broadcast via realtime.
ALTER PUBLICATION supabase_realtime ADD TABLE tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE submissions;
ALTER PUBLICATION supabase_realtime ADD TABLE deposit_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE withdraw_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE conversion_settings;

`;
