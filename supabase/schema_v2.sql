-- ============================================
-- BILIMMAKON — SCHEMA V2
-- Bu faylni schema.sql dan KEYIN ishga tushiring
-- ============================================

-- ============================================
-- ACCESS KEYS (Bir martalik kirish kalitlari)
-- ============================================
CREATE TABLE IF NOT EXISTS access_keys (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  created_by UUID REFERENCES profiles(id),
  used_by UUID REFERENCES profiles(id),
  max_devices INT DEFAULT 1,
  used_count INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMPTZ,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  used_at TIMESTAMPTZ
);

-- ============================================
-- USER SESSIONS (Qurilma nazorati)
-- ============================================
CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  device_fingerprint TEXT NOT NULL,
  device_info TEXT,
  ip_address TEXT,
  last_seen TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- USER BLOCKS (Bloklash)
-- ============================================
CREATE TABLE IF NOT EXISTS user_blocks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  blocked_by UUID REFERENCES profiles(id),
  reason TEXT,
  auto_blocked BOOLEAN DEFAULT false,
  unblocked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- MATERIALS (PDF, elektron darsliklar)
-- ============================================
ALTER TABLE materials ADD COLUMN IF NOT EXISTS file_size BIGINT;
ALTER TABLE materials ADD COLUMN IF NOT EXISTS course_id UUID REFERENCES courses(id) ON DELETE SET NULL;
ALTER TABLE materials ADD COLUMN IF NOT EXISTS module_id UUID REFERENCES modules(id) ON DELETE SET NULL;
ALTER TABLE materials ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT true;
ALTER TABLE materials ADD COLUMN IF NOT EXISTS order_index INT DEFAULT 1;

-- ============================================
-- PROFILES — qo'shimcha ustunlar
-- ============================================
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS access_key_id UUID REFERENCES access_keys(id);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS device_count INT DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_login TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS telegram_username TEXT;

-- ============================================
-- RLS for new tables
-- ============================================
ALTER TABLE access_keys ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage access keys" ON access_keys FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Users can read own key" ON access_keys FOR SELECT USING (
  used_by = auth.uid()
);

ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own sessions" ON user_sessions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Admins see all sessions" ON user_sessions FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

ALTER TABLE user_blocks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage blocks" ON user_blocks FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Users see own block" ON user_blocks FOR SELECT USING (auth.uid() = user_id);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_access_keys_key ON access_keys(key);
CREATE INDEX IF NOT EXISTS idx_access_keys_used_by ON access_keys(used_by);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_fingerprint ON user_sessions(device_fingerprint);
CREATE INDEX IF NOT EXISTS idx_user_blocks_user_id ON user_blocks(user_id);

-- ============================================
-- Function: check device limit and auto-block
-- ============================================
CREATE OR REPLACE FUNCTION check_device_limit(p_user_id UUID, p_fingerprint TEXT, p_device_info TEXT DEFAULT NULL, p_ip TEXT DEFAULT NULL)
RETURNS JSONB AS $$
DECLARE
  v_key_id UUID;
  v_max_devices INT;
  v_session_count INT;
  v_is_blocked BOOLEAN;
  v_existing_session UUID;
BEGIN
  -- Check if user is already blocked
  SELECT is_blocked INTO v_is_blocked FROM profiles WHERE id = p_user_id;
  IF v_is_blocked THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'blocked');
  END IF;

  -- Get user's access key max_devices
  SELECT ak.id, ak.max_devices INTO v_key_id, v_max_devices
  FROM profiles p
  JOIN access_keys ak ON ak.id = p.access_key_id
  WHERE p.id = p_user_id;

  IF v_max_devices IS NULL THEN v_max_devices := 1; END IF;

  -- Check if this device already has a session
  SELECT id INTO v_existing_session FROM user_sessions
  WHERE user_id = p_user_id AND device_fingerprint = p_fingerprint AND is_active = true;

  IF v_existing_session IS NOT NULL THEN
    -- Update last_seen
    UPDATE user_sessions SET last_seen = NOW(), ip_address = p_ip WHERE id = v_existing_session;
    RETURN jsonb_build_object('allowed', true, 'reason', 'existing_session');
  END IF;

  -- Count active sessions
  SELECT COUNT(*) INTO v_session_count FROM user_sessions
  WHERE user_id = p_user_id AND is_active = true;

  IF v_session_count >= v_max_devices THEN
    -- AUTO BLOCK
    UPDATE profiles SET is_blocked = true WHERE id = p_user_id;
    INSERT INTO user_blocks (user_id, reason, auto_blocked)
    VALUES (p_user_id, 'Ruxsat etilgan qurilmalar sonidan oshildi: ' || v_session_count || '/' || v_max_devices, true)
    ON CONFLICT (user_id) DO UPDATE SET reason = EXCLUDED.reason, auto_blocked = true, created_at = NOW(), unblocked_at = NULL;
    RETURN jsonb_build_object('allowed', false, 'reason', 'device_limit_exceeded');
  END IF;

  -- Register new session
  INSERT INTO user_sessions (user_id, device_fingerprint, device_info, ip_address)
  VALUES (p_user_id, p_fingerprint, p_device_info, p_ip);

  -- Update device count
  UPDATE profiles SET device_count = v_session_count + 1 WHERE id = p_user_id;

  RETURN jsonb_build_object('allowed', true, 'reason', 'new_session');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- ACCESS KEYS — used_by join uchun view
-- ============================================
-- Supabase JS client uchun foreign key alias
-- access_keys.used_by → profiles table
-- Bu avtomatik ishlaydi chunki FK mavjud

-- Admin foydalanuvchi tekshirish query (test uchun):
-- SELECT * FROM access_keys WHERE is_active = true ORDER BY created_at DESC;
-- SELECT * FROM user_sessions WHERE user_id = 'USER_ID';
-- SELECT * FROM user_blocks WHERE unblocked_at IS NULL;

-- ============================================
-- AUDIT LOGS (Barcha muhim amallar qayd etiladi)
-- ============================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  action TEXT NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  ip_address TEXT,
  details JSONB DEFAULT '{}',
  success BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins view audit logs" ON audit_logs FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "System can insert audit logs" ON audit_logs FOR INSERT WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- ============================================
-- ADMIN_LOGIN_WHITELIST (ixtiyoriy: faqat ma'lum IP lardan kirishga ruxsat)
-- Hozir ishlatilmaydi, kelajak uchun
-- ============================================
-- CREATE TABLE IF NOT EXISTS admin_ip_whitelist (
--   id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
--   ip_address TEXT NOT NULL UNIQUE,
--   note TEXT,
--   created_at TIMESTAMPTZ DEFAULT NOW()
-- );

-- ============================================
-- AI MENTOR LOGS (kunlik limit uchun)
-- ============================================
CREATE TABLE IF NOT EXISTS ai_mentor_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  question TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE ai_mentor_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own ai logs" ON ai_mentor_logs FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Admins view all ai logs" ON ai_mentor_logs FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE INDEX IF NOT EXISTS idx_ai_mentor_logs_user_date ON ai_mentor_logs(user_id, created_at DESC);
