import { pool } from '../lib/db.js';

const sql = `
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  full_name TEXT NOT NULL,
  phone TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  email TEXT,
  age INTEGER,
  country TEXT DEFAULT 'مصر',
  city TEXT,
  gender TEXT,
  role TEXT NOT NULL CHECK (role IN ('admin','volunteer','patient','doctor','place_supervisor')),
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS places (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  country TEXT DEFAULT 'مصر',
  city TEXT,
  address TEXT,
  phone TEXT,
  map_link TEXT,
  description TEXT,
  image_url TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS volunteer_profiles (
  id SERIAL PRIMARY KEY,
  user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  bio TEXT,
  rating NUMERIC DEFAULT 0,
  completed_visits INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS doctor_profiles (
  id SERIAL PRIMARY KEY,
  user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  specialization TEXT,
  workplace TEXT,
  bio TEXT
);

CREATE TABLE IF NOT EXISTS patient_profiles (
  id SERIAL PRIMARY KEY,
  user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  place_id INTEGER REFERENCES places(id) ON DELETE SET NULL,
  case_description TEXT,
  preferred_visit_times TEXT,
  preferred_visitor_gender TEXT DEFAULT 'any',
  current_status TEXT,
  rating NUMERIC DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS visit_requests (
  id SERIAL PRIMARY KEY,
  volunteer_id INTEGER REFERENCES volunteer_profiles(id) ON DELETE CASCADE,
  patient_id INTEGER REFERENCES patient_profiles(id) ON DELETE CASCADE,
  requested_date DATE NOT NULL,
  requested_time TEXT NOT NULL,
  message TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS messages (
  id SERIAL PRIMARY KEY,
  visit_request_id INTEGER REFERENCES visit_requests(id) ON DELETE CASCADE,
  sender_user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS reports (
  id SERIAL PRIMARY KEY,
  reporter_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  target_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  reason TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
`;

await pool.query(sql);
console.log('Database initialized');
await pool.end();
