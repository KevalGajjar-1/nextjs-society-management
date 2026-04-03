-- Units table (dependencies first)
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

-- Users table (all residents)
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

-- Committee members table
CREATE TABLE committee_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  designation text NOT NULL,
  created_at timestamp DEFAULT now()
);

-- Expense groups table
CREATE TABLE expense_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  created_at timestamp DEFAULT now()
);

-- Transactions table
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

-- Vehicles table
CREATE TABLE vehicles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  unit_id uuid NOT NULL REFERENCES units(id) ON DELETE CASCADE,
  type vehicle_type NOT NULL,
  sticker_number text UNIQUE NOT NULL,
  created_at timestamp DEFAULT now()
);

-- Notices table
CREATE TABLE notices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  created_by uuid NOT NULL REFERENCES users(id),
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);
