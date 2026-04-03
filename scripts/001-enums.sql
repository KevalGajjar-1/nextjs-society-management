-- Create ENUM types for strict type definitions
CREATE TYPE user_role AS ENUM ('ADMIN', 'COMMITTEE', 'MEMBER');
CREATE TYPE user_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
CREATE TYPE unit_type AS ENUM ('FLAT', 'SHOP');
CREATE TYPE resident_type AS ENUM ('OWNER', 'TENANT', 'FAMILY');
CREATE TYPE transaction_type AS ENUM ('INCOME', 'EXPENSE');
CREATE TYPE vehicle_type AS ENUM ('TWO_WHEELER', 'FOUR_WHEELER');
CREATE TYPE payment_mode AS ENUM ('CASH', 'UPI', 'BANK');
