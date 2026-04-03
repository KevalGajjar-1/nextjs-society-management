-- ============================================================================
-- NoBrokerHood SaaS - Complete Database Schema
-- ============================================================================

-- ============================================================================
-- 1. ENUMS (STRICT TYPE DEFINITIONS)
-- ============================================================================

CREATE TYPE user_role AS ENUM ('ADMIN', 'COMMITTEE', 'MEMBER');
CREATE TYPE user_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
CREATE TYPE unit_type AS ENUM ('FLAT', 'SHOP');
CREATE TYPE resident_type AS ENUM ('OWNER', 'TENANT', 'FAMILY');
CREATE TYPE transaction_type AS ENUM ('INCOME', 'EXPENSE');
CREATE TYPE vehicle_type AS ENUM ('TWO_WHEELER', 'FOUR_WHEELER');
CREATE TYPE payment_mode AS ENUM ('CASH', 'UPI', 'BANK');

-- ============================================================================
-- 2. UNITS TABLE (FLATS / SHOPS) - Created first as dependency
-- ============================================================================

CREATE TABLE units (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_number text NOT NULL,
  wing text,
  floor int,
  type unit_type NOT NULL,
  created_by uuid,
  created_at timestamp DEFAULT now(),
  UNIQUE(unit_number, type)
);

-- ============================================================================
-- 3. USERS TABLE (ALL RESIDENTS)
-- ============================================================================

CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  phone text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  
  role user_role DEFAULT 'MEMBER',
  status user_status DEFAULT 'PENDING',
  
  unit_id uuid NOT NULL REFERENCES units(id),
  resident_type resident_type NOT NULL,
  
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- ============================================================================
-- 4. COMMITTEE MEMBERS TABLE
-- ============================================================================

CREATE TABLE committee_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  designation text NOT NULL,
  created_at timestamp DEFAULT now()
);

-- ============================================================================
-- 5. EXPENSE GROUPS TABLE
-- ============================================================================

CREATE TABLE expense_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  created_at timestamp DEFAULT now()
);

-- ============================================================================
-- 6. TRANSACTIONS TABLE
-- ============================================================================

CREATE TABLE transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type transaction_type NOT NULL,
  title text NOT NULL,
  amount numeric(12, 2) NOT NULL CHECK (amount > 0),
  
  group_id uuid REFERENCES expense_groups(id) ON DELETE SET NULL,
  unit_id uuid REFERENCES units(id) ON DELETE SET NULL,
  
  payment_mode payment_mode NOT NULL,
  transaction_date date NOT NULL,
  
  created_by uuid NOT NULL REFERENCES users(id),
  created_at timestamp DEFAULT now()
);

-- ============================================================================
-- 7. VEHICLES TABLE
-- ============================================================================

CREATE TABLE vehicles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  unit_id uuid NOT NULL REFERENCES units(id) ON DELETE CASCADE,
  
  type vehicle_type NOT NULL,
  sticker_number text UNIQUE NOT NULL,
  
  created_at timestamp DEFAULT now()
);

-- ============================================================================
-- 8. NOTICES TABLE
-- ============================================================================

CREATE TABLE notices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  created_by uuid NOT NULL REFERENCES users(id),
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- ============================================================================
-- INDEXES (FOR PERFORMANCE)
-- ============================================================================

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_unit_id ON users(unit_id);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_role ON users(role);

CREATE INDEX idx_transactions_type ON transactions(type);
CREATE INDEX idx_transactions_group_id ON transactions(group_id);
CREATE INDEX idx_transactions_unit_id ON transactions(unit_id);
CREATE INDEX idx_transactions_created_by ON transactions(created_by);
CREATE INDEX idx_transactions_date ON transactions(transaction_date);

CREATE INDEX idx_vehicles_user_id ON vehicles(user_id);
CREATE INDEX idx_vehicles_unit_id ON vehicles(unit_id);
CREATE INDEX idx_vehicles_sticker ON vehicles(sticker_number);

CREATE INDEX idx_notices_created_by ON notices(created_by);
CREATE INDEX idx_committee_user_id ON committee_members(user_id);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) - Data isolation & role-based access
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE units ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE committee_members ENABLE ROW LEVEL SECURITY;

-- USERS - Policy: Users can view themselves + ADMIN/COMMITTEE see all
CREATE POLICY "users_self_select" ON users
  FOR SELECT USING (auth.uid() = id OR EXISTS(
    SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('ADMIN', 'COMMITTEE')
  ));

CREATE POLICY "users_insert_public" ON users
  FOR INSERT WITH CHECK (true); -- Signup is public

CREATE POLICY "users_update_self" ON users
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "users_update_admin" ON users
  FOR UPDATE USING (EXISTS(
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'ADMIN'
  ));

CREATE POLICY "users_delete_admin" ON users
  FOR DELETE USING (EXISTS(
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'ADMIN'
  ));

-- UNITS - Policy: All authenticated users can view
CREATE POLICY "units_select_all" ON units
  FOR SELECT USING (true);

CREATE POLICY "units_insert_admin" ON units
  FOR INSERT WITH CHECK (EXISTS(
    SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('ADMIN', 'COMMITTEE')
  ));

CREATE POLICY "units_update_admin" ON units
  FOR UPDATE USING (EXISTS(
    SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('ADMIN', 'COMMITTEE')
  ));

-- TRANSACTIONS - Policy: Members see only their own, ADMIN/COMMITTEE see all
CREATE POLICY "transactions_select_member" ON transactions
  FOR SELECT USING (
    unit_id = (SELECT unit_id FROM users WHERE id = auth.uid()) OR
    EXISTS(SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('ADMIN', 'COMMITTEE'))
  );

CREATE POLICY "transactions_insert" ON transactions
  FOR INSERT WITH CHECK (EXISTS(
    SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('ADMIN', 'COMMITTEE')
  ));

CREATE POLICY "transactions_update_admin" ON transactions
  FOR UPDATE USING (EXISTS(
    SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('ADMIN', 'COMMITTEE')
  ));

CREATE POLICY "transactions_delete_admin" ON transactions
  FOR DELETE USING (EXISTS(
    SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('ADMIN', 'COMMITTEE')
  ));

-- VEHICLES - Policy: Users see their own, ADMIN/COMMITTEE see all
CREATE POLICY "vehicles_select_self" ON vehicles
  FOR SELECT USING (
    user_id = auth.uid() OR
    EXISTS(SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('ADMIN', 'COMMITTEE'))
  );

CREATE POLICY "vehicles_insert_self" ON vehicles
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "vehicles_update_self" ON vehicles
  FOR UPDATE USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "vehicles_delete_self" ON vehicles
  FOR DELETE USING (user_id = auth.uid());

-- NOTICES - Policy: All authenticated users can view
CREATE POLICY "notices_select_all" ON notices
  FOR SELECT USING (true);

CREATE POLICY "notices_insert_admin" ON notices
  FOR INSERT WITH CHECK (EXISTS(
    SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('ADMIN', 'COMMITTEE')
  ));

CREATE POLICY "notices_update_admin" ON notices
  FOR UPDATE USING (EXISTS(
    SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('ADMIN', 'COMMITTEE')
  ));

-- EXPENSE GROUPS - Policy: All authenticated users can view, only ADMIN creates
CREATE POLICY "expense_groups_select" ON expense_groups
  FOR SELECT USING (true);

CREATE POLICY "expense_groups_insert_admin" ON expense_groups
  FOR INSERT WITH CHECK (EXISTS(
    SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('ADMIN', 'COMMITTEE')
  ));

-- COMMITTEE MEMBERS - Policy: All can view, only ADMIN manages
CREATE POLICY "committee_select" ON committee_members
  FOR SELECT USING (true);

CREATE POLICY "committee_insert_admin" ON committee_members
  FOR INSERT WITH CHECK (EXISTS(
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'ADMIN'
  ));

CREATE POLICY "committee_update_admin" ON committee_members
  FOR UPDATE USING (EXISTS(
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'ADMIN'
  ));

CREATE POLICY "committee_delete_admin" ON committee_members
  FOR DELETE USING (EXISTS(
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'ADMIN'
  ));

-- ============================================================================
-- SEED DATA (SAMPLE)
-- ============================================================================

-- Sample units
INSERT INTO units (unit_number, wing, floor, type) VALUES
  ('A-101', 'A', 1, 'FLAT'),
  ('A-102', 'A', 1, 'FLAT'),
  ('B-201', 'B', 2, 'FLAT'),
  ('Shop-1', 'Ground', 0, 'SHOP');

-- Sample expense groups
INSERT INTO expense_groups (name, description) VALUES
  ('Building Maintenance', 'Monthly maintenance costs'),
  ('Electricity', 'Common area electricity'),
  ('Water', 'Water supply and tanker'),
  ('Security', 'Security personnel salary'),
  ('Holi 2026', 'Community Holi celebration');

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================
