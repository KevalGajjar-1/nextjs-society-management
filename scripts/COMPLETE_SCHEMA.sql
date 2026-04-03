-- NoBrokerHood - Complete Database Schema
-- Run this in Supabase SQL Editor to set up the database

-- ============================================================================
-- 1. CREATE ENUMS
-- ============================================================================

CREATE TYPE user_role AS ENUM ('ADMIN', 'COMMITTEE', 'MEMBER');
CREATE TYPE user_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
CREATE TYPE unit_type AS ENUM ('FLAT', 'SHOP');
CREATE TYPE resident_type AS ENUM ('OWNER', 'TENANT', 'FAMILY');
CREATE TYPE transaction_type AS ENUM ('INCOME', 'EXPENSE');
CREATE TYPE vehicle_type AS ENUM ('TWO_WHEELER', 'FOUR_WHEELER');
CREATE TYPE payment_mode AS ENUM ('CASH', 'UPI', 'BANK');

-- ============================================================================
-- 2. CREATE TABLES
-- ============================================================================

-- Units (Flats and Shops)
CREATE TABLE units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_number TEXT UNIQUE NOT NULL,
  wing TEXT,
  floor INT,
  type unit_type NOT NULL,
  created_by UUID,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Users (All residents)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT UNIQUE,
  password_hash TEXT NOT NULL,
  role user_role DEFAULT 'MEMBER',
  status user_status DEFAULT 'PENDING',
  unit_id UUID NOT NULL REFERENCES units(id) ON DELETE RESTRICT,
  resident_type resident_type NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Expense Groups
CREATE TABLE expense_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Transactions
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type transaction_type NOT NULL,
  title TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  group_id UUID REFERENCES expense_groups(id) ON DELETE SET NULL,
  unit_id UUID REFERENCES units(id) ON DELETE SET NULL,
  payment_mode payment_mode,
  transaction_date DATE NOT NULL,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Vehicles
CREATE TABLE vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  unit_id UUID REFERENCES units(id) ON DELETE SET NULL,
  type vehicle_type NOT NULL,
  sticker_number TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Notices
CREATE TABLE notices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Committee Members
CREATE TABLE committee_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  designation TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- 3. CREATE INDEXES
-- ============================================================================

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_unit_id ON users(unit_id);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_units_wing ON units(wing);
CREATE INDEX idx_transactions_date ON transactions(transaction_date);
CREATE INDEX idx_transactions_group ON transactions(group_id);
CREATE INDEX idx_vehicles_user ON vehicles(user_id);
CREATE INDEX idx_vehicles_sticker ON vehicles(sticker_number);

-- ============================================================================
-- 4. ENABLE ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE units ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE committee_members ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 5. CREATE RLS POLICIES
-- ============================================================================

-- Users can view their own profile
CREATE POLICY "Users can read own profile" ON users
  FOR SELECT USING (auth.uid() = id);

-- Users can view other approved residents
CREATE POLICY "Users can read approved residents" ON users
  FOR SELECT USING (
    status = 'APPROVED' OR 
    auth.uid() = id OR
    auth.uid() IN (SELECT id FROM users WHERE role IN ('ADMIN', 'COMMITTEE'))
  );

-- Admins can update users
CREATE POLICY "Admins can update users" ON users
  FOR UPDATE USING (
    auth.uid() IN (SELECT id FROM users WHERE role = 'ADMIN')
  );

-- Everyone can read units
CREATE POLICY "Everyone can read units" ON units
  FOR SELECT USING (true);

-- Admins can manage transactions
CREATE POLICY "Admins can manage transactions" ON transactions
  FOR ALL USING (
    auth.uid() IN (SELECT id FROM users WHERE role IN ('ADMIN', 'COMMITTEE'))
  );

-- Members can read transactions
CREATE POLICY "Members can read transactions" ON transactions
  FOR SELECT USING (true);

-- Users can read own vehicles
CREATE POLICY "Users can read own vehicles" ON vehicles
  FOR SELECT USING (auth.uid() = user_id);

-- Everyone can read notices
CREATE POLICY "Everyone can read notices" ON notices
  FOR SELECT USING (true);

-- Admins can manage notices
CREATE POLICY "Admins can manage notices" ON notices
  FOR ALL USING (
    auth.uid() IN (SELECT id FROM users WHERE role IN ('ADMIN', 'COMMITTEE'))
  );

-- ============================================================================
-- 6. SEED DATA
-- ============================================================================

-- Insert sample units
INSERT INTO units (unit_number, wing, floor, type) VALUES
  ('A-101', 'A', 1, 'FLAT'),
  ('A-102', 'A', 1, 'FLAT'),
  ('A-201', 'A', 2, 'FLAT'),
  ('B-101', 'B', 1, 'FLAT'),
  ('B-102', 'B', 1, 'FLAT'),
  ('Shop-1', NULL, 0, 'SHOP'),
  ('Shop-2', NULL, 0, 'SHOP')
ON CONFLICT DO NOTHING;

-- Insert sample expense groups
INSERT INTO expense_groups (name, description) VALUES
  ('Maintenance', 'Monthly maintenance charges'),
  ('Security', 'Security staff salaries'),
  ('Utilities', 'Water and electricity'),
  ('Events', 'Community events and celebrations'),
  ('Repairs', 'Building repairs and maintenance')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- NOTES
-- ============================================================================
-- 
-- To create an admin user manually, use:
--
-- INSERT INTO users (name, email, phone, password_hash, role, status, unit_id, resident_type)
-- VALUES (
--   'Admin User',
--   'admin@example.com',
--   '9876543210',
--   '$2a$10$...',  -- bcrypt hash of password
--   'ADMIN',
--   'APPROVED',
--   (SELECT id FROM units LIMIT 1),
--   'OWNER'
-- );
--
-- Generate bcrypt hash in Node.js:
-- const bcrypt = require('bcryptjs');
-- const hash = bcrypt.hashSync('your-password', 10);
-- console.log(hash);
--
