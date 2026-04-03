-- Sample units
INSERT INTO units (unit_number, wing, floor, type) VALUES
  ('A-101', 'A', 1, 'FLAT'),
  ('A-102', 'A', 1, 'FLAT'),
  ('B-201', 'B', 2, 'FLAT'),
  ('B-202', 'B', 2, 'FLAT'),
  ('Shop-1', 'Ground', 0, 'SHOP'),
  ('Shop-2', 'Ground', 0, 'SHOP');

-- Sample expense groups
INSERT INTO expense_groups (name, description) VALUES
  ('Building Maintenance', 'Monthly maintenance costs'),
  ('Electricity', 'Common area electricity'),
  ('Water', 'Water supply and tanker'),
  ('Security', 'Security personnel salary'),
  ('Holi 2026', 'Community Holi celebration'),
  ('Diwali 2026', 'Community Diwali celebration');
