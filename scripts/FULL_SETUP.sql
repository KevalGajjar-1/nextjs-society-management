-- ============================================================================
-- NoBrokerHood SaaS - Complete Setup for Origin Heights Society
-- ============================================================================
-- This script sets up the entire database with enums, tables, RLS policies,
-- seed data (Origin Heights, Wings A & B, shops), and admin user.
-- ============================================================================

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

CREATE TABLE IF NOT EXISTS units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_number TEXT NOT NULL UNIQUE,
  wing TEXT NOT NULL,
  floor INTEGER NOT NULL,
  type unit_type NOT NULL,
  created_by UUID,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT UNIQUE,
  password_hash TEXT NOT NULL,
  role user_role DEFAULT 'MEMBER',
  status user_status DEFAULT 'PENDING',
  unit_id UUID,
  resident_type resident_type,
  created_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (unit_id) REFERENCES units(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS expense_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type transaction_type NOT NULL,
  title TEXT NOT NULL,
  amount NUMERIC(12, 2) NOT NULL,
  group_id UUID,
  unit_id UUID,
  payment_mode payment_mode,
  transaction_date DATE NOT NULL,
  created_by UUID,
  created_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (group_id) REFERENCES expense_groups(id) ON DELETE SET NULL,
  FOREIGN KEY (unit_id) REFERENCES units(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  unit_id UUID NOT NULL,
  type vehicle_type NOT NULL,
  sticker_number TEXT UNIQUE,
  created_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (unit_id) REFERENCES units(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS notices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  created_by UUID,
  created_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS committee_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  designation TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================================================
-- 3. CREATE INDEXES
-- ============================================================================

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_unit_id ON users(unit_id);
CREATE INDEX idx_units_wing ON units(wing);
CREATE INDEX idx_units_floor ON units(floor);
CREATE INDEX idx_transactions_type ON transactions(type);
CREATE INDEX idx_transactions_date ON transactions(transaction_date);
CREATE INDEX idx_vehicles_user_id ON vehicles(user_id);
CREATE INDEX idx_vehicles_sticker ON vehicles(sticker_number);
CREATE INDEX idx_notices_created_by ON notices(created_by);

-- ============================================================================
-- 4. ENABLE ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE units ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE committee_members ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 5. CREATE RLS POLICIES
-- ============================================================================

-- Units - Everyone can read, only admin can write
CREATE POLICY "Units are viewable by everyone" ON units
  FOR SELECT USING (true);

CREATE POLICY "Units can be created by admin only" ON units
  FOR INSERT WITH CHECK (
    (SELECT role FROM users WHERE id = auth.uid()) = 'ADMIN'
  );

-- Users - Members see own data, admins see all
CREATE POLICY "Users can view their own profile" ON users
  FOR SELECT USING (
    auth.uid() = id OR
    (SELECT role FROM users WHERE id = auth.uid()) = 'ADMIN'
  );

CREATE POLICY "Users can update their own profile" ON users
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Only admin can approve users" ON users
  FOR UPDATE USING ((SELECT role FROM users WHERE id = auth.uid()) = 'ADMIN')
  WITH CHECK ((SELECT role FROM users WHERE id = auth.uid()) = 'ADMIN');

-- Transactions - Unit residents can view their transactions, admins see all
CREATE POLICY "Users can view their unit's transactions" ON transactions
  FOR SELECT USING (
    (SELECT unit_id FROM users WHERE id = auth.uid()) = unit_id OR
    (SELECT role FROM users WHERE id = auth.uid()) IN ('ADMIN', 'COMMITTEE')
  );

CREATE POLICY "Admins and committee can create transactions" ON transactions
  FOR INSERT WITH CHECK (
    (SELECT role FROM users WHERE id = auth.uid()) IN ('ADMIN', 'COMMITTEE')
  );

-- Vehicles - Own or admin
CREATE POLICY "Users can view own vehicles" ON vehicles
  FOR SELECT USING (
    user_id = auth.uid() OR
    (SELECT role FROM users WHERE id = auth.uid()) = 'ADMIN'
  );

CREATE POLICY "Users can add vehicles" ON vehicles
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Notices - Everyone can read
CREATE POLICY "Notices are viewable by everyone" ON notices
  FOR SELECT USING (true);

CREATE POLICY "Only admin can create notices" ON notices
  FOR INSERT WITH CHECK (
    (SELECT role FROM users WHERE id = auth.uid()) = 'ADMIN'
  );

-- Expense Groups - Everyone can read
CREATE POLICY "Expense groups are viewable by everyone" ON expense_groups
  FOR SELECT USING (true);

CREATE POLICY "Only admin can create expense groups" ON expense_groups
  FOR INSERT WITH CHECK (
    (SELECT role FROM users WHERE id = auth.uid()) = 'ADMIN'
  );

-- Committee Members - Everyone can read
CREATE POLICY "Committee members are viewable by everyone" ON committee_members
  FOR SELECT USING (true);

CREATE POLICY "Only admin can manage committee" ON committee_members
  FOR INSERT WITH CHECK (
    (SELECT role FROM users WHERE id = auth.uid()) = 'ADMIN'
  );

-- ============================================================================
-- 6. SEED DATA - UNITS (Origin Heights Society)
-- ============================================================================

-- Wing A - Flats
INSERT INTO units (unit_number, wing, floor, type) VALUES
('A-101', 'A', 1, 'FLAT'),
('A-102', 'A', 1, 'FLAT'),
('A-103', 'A', 1, 'FLAT'),
('A-201', 'A', 2, 'FLAT'),
('A-202', 'A', 2, 'FLAT'),
('A-203', 'A', 2, 'FLAT'),
('A-301', 'A', 3, 'FLAT'),
('A-302', 'A', 3, 'FLAT'),
('A-303', 'A', 3, 'FLAT');

-- Wing B - Flats
INSERT INTO units (unit_number, wing, floor, type) VALUES
('B-101', 'B', 1, 'FLAT'),
('B-102', 'B', 1, 'FLAT'),
('B-103', 'B', 1, 'FLAT'),
('B-201', 'B', 2, 'FLAT'),
('B-202', 'B', 2, 'FLAT'),
('B-203', 'B', 2, 'FLAT'),
('B-301', 'B', 3, 'FLAT'),
('B-302', 'B', 3, 'FLAT'),
('B-303', 'B', 3, 'FLAT');

-- Shops
INSERT INTO units (unit_number, wing, floor, type) VALUES
('Shop-1', 'Ground', 0, 'SHOP'),
('Shop-2', 'Ground', 0, 'SHOP'),
('Shop-3', 'Ground', 0, 'SHOP'),
('Shop-4', 'Ground', 0, 'SHOP');

-- ============================================================================
-- 7. SEED DATA - EXPENSE GROUPS
-- ============================================================================

INSERT INTO expense_groups (name, description) VALUES
('Maintenance', 'Regular maintenance charges'),
('Utilities', 'Water, electricity, and other utilities'),
('Security', 'Security staff and equipment'),
('Repairs', 'Building repairs and upkeep'),
('Events', 'Community events and celebrations'),
('Insurance', 'Building insurance'),
('Miscellaneous', 'Other expenses');

-- ============================================================================
-- 8. SEED DATA - ADMIN USER
-- ============================================================================
-- Admin User: admin@originheights.com
-- Password: Admin@123456 (hashed with bcrypt)
-- Hash generated from bcrypt with 10 rounds
-- This is a pre-generated hash - in production, never store plaintext passwords!

INSERT INTO users (
  id,
  name,
  email,
  phone,
  password_hash,
  role,
  status,
  unit_id,
  resident_type
) VALUES (
  gen_random_uuid(),
  'Origin Heights Admin',
  'admin@originheights.com',
  '+91-9876543210',
  '$2b$10$jgiCVB5SMq4E9C9anykIq.cIMW8FQt.RCSdO/Gei2MsqcG/6FdF8O',
  'ADMIN',
  'APPROVED',
  NULL,
  NULL
);

-- ============================================================================
-- 9. COMMIT COMMENT
-- ============================================================================
-- Setup Complete!
-- Society: Origin Heights
-- Wings: A, B
-- Shops: 4 units
-- Admin User Created: admin@originheights.com
-- Next Step: Create more users and assign them to units
-- ============================================================================
