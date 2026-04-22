-- ============================================================
-- ADMIN ACCOUNT ROLE FIX
-- Run this in Supabase SQL Editor to fix the admin account role
-- ============================================================

-- Fix the admin@campus.lk account role to 'super_admin'
UPDATE profiles
SET 
  role = 'super_admin',
  is_active = true,
  permissions = '["ims_overview","ims_marketing","ims_academic","ims_finance","ims_hr","ims_users","ims_tasks","ims_roster","ims_control_panel","asms_full","task_delete"]'::jsonb
WHERE email = 'admin@campus.lk';

-- Verify the update
SELECT id, email, full_name, role, permissions
FROM profiles
WHERE email = 'admin@campus.lk';
