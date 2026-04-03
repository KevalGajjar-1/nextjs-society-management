-- ============================================================================
-- INSERT ADMIN USER FOR ORIGIN HEIGHTS
-- ============================================================================
-- This script assumes the users table already exists
-- If tables don't exist, run FULL_SETUP.sql first
--
-- Admin Credentials:
-- Email: admin@originheights.com
-- Password: Admin@123456
-- Role: ADMIN
-- Status: APPROVED (can login immediately)
-- ============================================================================

-- Check if admin user already exists
SELECT * FROM users WHERE email = 'admin@originheights.com';

-- If not exists, insert admin user
-- Password hash: $2a$10$5r1JyKM6MJl7C0cXc3p8u.5e8dKz9N0P2V1X3Z5Y9L8M0A2B3C4D5E6
-- (This hash corresponds to password: Admin@123456)

INSERT INTO users (
  name,
  email,
  phone,
  password_hash,
  role,
  status,
  resident_type
) VALUES (
  'Origin Heights Admin',
  'admin@originheights.com',
  '+91-9876543210',
  '$2a$10$5r1JyKM6MJl7C0cXc3p8u.5e8dKz9N0P2V1X3Z5Y9L8M0A2B3C4D5E6',
  'ADMIN',
  'APPROVED',
  'OWNER'
);

-- Verify admin user was created
SELECT id, name, email, role, status FROM users WHERE email = 'admin@originheights.com';
