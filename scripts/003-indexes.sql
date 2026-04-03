-- Performance indexes
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
