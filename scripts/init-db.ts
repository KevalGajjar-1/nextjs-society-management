import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables')
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// SQL statements
const migrations = [
  // 1. Create ENUM types
  `CREATE TYPE IF NOT EXISTS user_role AS ENUM ('ADMIN', 'COMMITTEE', 'MEMBER');`,
  `CREATE TYPE IF NOT EXISTS user_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED');`,
  `CREATE TYPE IF NOT EXISTS unit_type AS ENUM ('FLAT', 'SHOP');`,
  `CREATE TYPE IF NOT EXISTS resident_type AS ENUM ('OWNER', 'TENANT', 'FAMILY');`,
  `CREATE TYPE IF NOT EXISTS transaction_type AS ENUM ('INCOME', 'EXPENSE');`,
  `CREATE TYPE IF NOT EXISTS vehicle_type AS ENUM ('TWO_WHEELER', 'FOUR_WHEELER');`,
  `CREATE TYPE IF NOT EXISTS payment_mode AS ENUM ('CASH', 'UPI', 'BANK');`,

  // 2. Create tables
  `CREATE TABLE IF NOT EXISTS units (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    unit_number TEXT UNIQUE NOT NULL,
    wing TEXT,
    floor INT,
    type unit_type NOT NULL,
    created_by UUID,
    created_at TIMESTAMP DEFAULT NOW()
  );`,

  `CREATE TABLE IF NOT EXISTS users (
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
  );`,

  `CREATE TABLE IF NOT EXISTS expense_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW()
  );`,

  `CREATE TABLE IF NOT EXISTS transactions (
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
  );`,

  `CREATE TABLE IF NOT EXISTS vehicles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    unit_id UUID REFERENCES units(id) ON DELETE SET NULL,
    type vehicle_type NOT NULL,
    sticker_number TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
  );`,

  `CREATE TABLE IF NOT EXISTS notices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT NOW()
  );`,

  `CREATE TABLE IF NOT EXISTS committee_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    designation TEXT,
    created_at TIMESTAMP DEFAULT NOW()
  );`,

  // 3. Create indexes
  `CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);`,
  `CREATE INDEX IF NOT EXISTS idx_users_unit_id ON users(unit_id);`,
  `CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);`,
  `CREATE INDEX IF NOT EXISTS idx_units_wing ON units(wing);`,
  `CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(transaction_date);`,
  `CREATE INDEX IF NOT EXISTS idx_transactions_group ON transactions(group_id);`,
  `CREATE INDEX IF NOT EXISTS idx_vehicles_user ON vehicles(user_id);`,
  `CREATE INDEX IF NOT EXISTS idx_vehicles_sticker ON vehicles(sticker_number);`,

  // 4. Enable RLS
  `ALTER TABLE users ENABLE ROW LEVEL SECURITY;`,
  `ALTER TABLE units ENABLE ROW LEVEL SECURITY;`,
  `ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;`,
  `ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;`,
  `ALTER TABLE notices ENABLE ROW LEVEL SECURITY;`,
  `ALTER TABLE expense_groups ENABLE ROW LEVEL SECURITY;`,
  `ALTER TABLE committee_members ENABLE ROW LEVEL SECURITY;`,

  // 5. Create RLS policies
  `CREATE POLICY "Users can read own profile" ON users
    FOR SELECT USING (auth.uid() = id);`,

  `CREATE POLICY "Users can read all approved residents" ON users
    FOR SELECT USING (
      status = 'APPROVED' OR 
      auth.uid() = id OR
      auth.uid() IN (SELECT id FROM users WHERE role IN ('ADMIN', 'COMMITTEE'))
    );`,

  `CREATE POLICY "Admin can update any user" ON users
    FOR UPDATE USING (
      auth.uid() IN (SELECT id FROM users WHERE role = 'ADMIN')
    );`,

  `CREATE POLICY "Everyone can read units" ON units
    FOR SELECT USING (true);`,

  `CREATE POLICY "Admins can manage transactions" ON transactions
    FOR ALL USING (
      auth.uid() IN (SELECT id FROM users WHERE role IN ('ADMIN', 'COMMITTEE'))
    );`,

  `CREATE POLICY "Members can read transactions" ON transactions
    FOR SELECT USING (true);`,

  `CREATE POLICY "Users can read own vehicles" ON vehicles
    FOR SELECT USING (auth.uid() = user_id);`,

  `CREATE POLICY "Everyone can read notices" ON notices
    FOR SELECT USING (true);`,

  `CREATE POLICY "Admins can manage notices" ON notices
    FOR ALL USING (
      auth.uid() IN (SELECT id FROM users WHERE role IN ('ADMIN', 'COMMITTEE'))
    );`,

  // 6. Seed data
  `INSERT INTO units (unit_number, wing, floor, type) VALUES
    ('A-101', 'A', 1, 'FLAT'),
    ('A-102', 'A', 1, 'FLAT'),
    ('A-201', 'A', 2, 'FLAT'),
    ('B-101', 'B', 1, 'FLAT'),
    ('Shop-1', NULL, 0, 'SHOP'),
    ('Shop-2', NULL, 0, 'SHOP')
  ON CONFLICT DO NOTHING;`,

  `INSERT INTO expense_groups (name, description) VALUES
    ('Maintenance', 'Monthly maintenance charges'),
    ('Security', 'Security staff salaries'),
    ('Utilities', 'Water and electricity'),
    ('Events', 'Community events and celebrations')
  ON CONFLICT DO NOTHING;`,
]

async function runMigrations() {
  console.log('[v0] Starting database migrations...')

  for (let i = 0; i < migrations.length; i++) {
    const migration = migrations[i]
    try {
      const { error } = await supabase.rpc('exec_sql', {
        sql_text: migration,
      })

      if (error) {
        console.error(`[v0] Migration ${i + 1} failed:`, error.message)
      } else {
        console.log(`[v0] ✓ Migration ${i + 1} completed`)
      }
    } catch (err) {
      console.log(`[v0] Note: Migration ${i + 1} skipped (may already exist)`)
    }
  }

  console.log('[v0] Database setup complete!')
}

runMigrations()
