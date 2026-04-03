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
  FOR INSERT WITH CHECK (true);

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
