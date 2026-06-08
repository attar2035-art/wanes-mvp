-- ========== USERS TABLE ==========
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  phone TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('أدمن', 'طبيب', 'متطوع', 'مريض')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'rejected')),
  display_name TEXT,
  story TEXT,
  need TEXT,
  governorate TEXT,
  city TEXT,
  place TEXT,
  place_type TEXT,
  lat DECIMAL(10, 8),
  lng DECIMAL(11, 8),
  visit_status TEXT DEFAULT 'تحتاج زيارة',
  country TEXT DEFAULT 'مصر',
  password_hash TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========== VISITS TABLE ==========
CREATE TABLE visits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  volunteer_id TEXT NOT NULL,
  patient_id UUID REFERENCES users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
  visit_date DATE,
  visit_time TIME,
  notes TEXT,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========== PLACES TABLE ==========
CREATE TABLE places (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  governorate TEXT NOT NULL,
  city TEXT NOT NULL,
  address TEXT,
  lat DECIMAL(10, 8),
  lng DECIMAL(11, 8),
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========== INDEXES ==========
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_governorate ON users(governorate);
CREATE INDEX idx_visits_volunteer ON visits(volunteer_id);
CREATE INDEX idx_visits_patient ON visits(patient_id);
CREATE INDEX idx_visits_status ON visits(status);

-- ========== RLS POLICIES ==========
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE places ENABLE ROW LEVEL SECURITY;

-- المرضى النشطين يظهرون للكل
CREATE POLICY "patients_public" ON users
  FOR SELECT USING (role = 'مريض' AND status = 'active');

-- كل مستخدم يشوف بياناته
CREATE POLICY "users_own_data" ON users
  FOR ALL USING (phone = current_user);

-- الزيارات للمتطوع والمريض المعني
CREATE POLICY "visits_own" ON visits
  FOR ALL USING (true);

-- الأماكن عامة للكل
CREATE POLICY "places_public" ON places
  FOR SELECT USING (true);

-- ========== ADMIN USER ==========
INSERT INTO users (phone, role, status, display_name, country)
VALUES ('+201000000000', 'أدمن', 'active', 'مدير النظام', 'مصر');
