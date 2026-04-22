-- ============================================================
-- CADD CENTRE — IMS ADD-ON MIGRATION
-- Safe to run on the LIVE Project 1 Supabase database.
-- This script ONLY adds new columns and new tables.
-- It NEVER drops or modifies any existing ASMS table or data.
-- ============================================================
-- Run this in: Supabase Dashboard → SQL Editor → New Query → Run
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ═══════════════════════════════════════════════════════════
-- STEP 1: Extend the existing `profiles` table
-- Add IMS-specific columns with IF NOT EXISTS so they're safe
-- to run repeatedly without error.
-- ═══════════════════════════════════════════════════════════

-- Expand the role CHECK constraint to include IMS roles.
-- We must drop the old constraint and recreate it.
DO $$
BEGIN
  -- Drop old role check (named or unnamed)
  ALTER TABLE public.profiles
    DROP CONSTRAINT IF EXISTS profiles_role_check;
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (role IN (
    -- Original ASMS roles (unchanged)
    'admin', 'academic_manager', 'trainer', 'student', 'coordinator',
    -- New IMS roles
    'super_admin', 'branch_manager',
    'marketing_staff', 'academic_staff', 'finance_officer', 'hr_officer', 'staff'
  ));

-- IMS staff profile fields
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS position             TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS department           TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS access_level         INTEGER DEFAULT 1;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS task_delete_permission BOOLEAN DEFAULT FALSE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS disabled             BOOLEAN DEFAULT FALSE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_active          TIMESTAMPTZ;

-- ═══════════════════════════════════════════════════════════
-- STEP 2: Update helper functions to include all IMS roles
-- ═══════════════════════════════════════════════════════════

-- is_admin: now includes super_admin and branch_manager
CREATE OR REPLACE FUNCTION public.is_admin() RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND role IN ('admin','super_admin','branch_manager')
      AND (disabled IS NULL OR disabled = FALSE)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- is_staff: all roles that can access the admin panel
CREATE OR REPLACE FUNCTION public.is_staff() RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND role IN (
        'admin','academic_manager','coordinator',
        'super_admin','branch_manager',
        'marketing_staff','academic_staff','finance_officer','hr_officer','staff'
      )
      AND (disabled IS NULL OR disabled = FALSE)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- New: is_ims_staff — IMS-specific helper used by new IMS table policies
CREATE OR REPLACE FUNCTION public.is_ims_staff() RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND role IN (
        'admin','super_admin','branch_manager',
        'marketing_staff','academic_staff','finance_officer','hr_officer','staff'
      )
      AND (disabled IS NULL OR disabled = FALSE)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ═══════════════════════════════════════════════════════════
-- STEP 3: IMS — Marketing tables (NEW)
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.marketing_campaigns (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name       TEXT NOT NULL,
  source     TEXT NOT NULL DEFAULT 'Facebook'
               CHECK (source IN ('Facebook','Website','Walk-in','Referral','WhatsApp','Other')),
  start_date DATE,
  end_date   DATE,
  budget     NUMERIC(10,2) DEFAULT 0,
  notes      TEXT,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.marketing_leads (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name              TEXT NOT NULL,
  contact           TEXT,
  email             TEXT,
  dob               DATE,
  nic               TEXT,
  occupation        TEXT,
  course_interested TEXT,
  source            TEXT NOT NULL DEFAULT 'Walk-in'
                      CHECK (source IN ('Facebook','Website','Walk-in','Referral','WhatsApp','Other')),
  status            TEXT NOT NULL DEFAULT 'New'
                      CHECK (status IN ('New','Contacted','Follow-up','Converted','Lost')),
  assigned_to       UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  campaign_id       UUID REFERENCES public.marketing_campaigns(id) ON DELETE SET NULL,
  follow_ups        JSONB NOT NULL DEFAULT '[]',
  notes             TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mktg_leads_status     ON public.marketing_leads(status);
CREATE INDEX IF NOT EXISTS idx_mktg_leads_assigned   ON public.marketing_leads(assigned_to);
CREATE INDEX IF NOT EXISTS idx_mktg_leads_campaign   ON public.marketing_leads(campaign_id);

DROP TRIGGER IF EXISTS trg_marketing_leads_updated_at ON public.marketing_leads;
CREATE TRIGGER trg_marketing_leads_updated_at
  BEFORE UPDATE ON public.marketing_leads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE public.marketing_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_leads     ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "mktg_campaigns_all" ON public.marketing_campaigns;
DROP POLICY IF EXISTS "mktg_leads_all"     ON public.marketing_leads;

CREATE POLICY "mktg_campaigns_all" ON public.marketing_campaigns FOR ALL TO authenticated USING (public.is_ims_staff());
CREATE POLICY "mktg_leads_all"     ON public.marketing_leads     FOR ALL TO authenticated USING (public.is_ims_staff());

-- ═══════════════════════════════════════════════════════════
-- STEP 4: IMS — Finance tables (NEW)
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.ims_invoices (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_name TEXT NOT NULL,
  student_id   TEXT,
  course_name  TEXT,
  items        JSONB NOT NULL DEFAULT '[]',
  total        NUMERIC(10,2) NOT NULL DEFAULT 0,
  status       TEXT NOT NULL DEFAULT 'Unpaid'
                 CHECK (status IN ('Paid','Unpaid','Partial')),
  due_date     DATE,
  generated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.ims_payments (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_name TEXT NOT NULL,
  student_id   TEXT,
  course_id    TEXT,
  amount       NUMERIC(10,2) NOT NULL DEFAULT 0,
  method       TEXT NOT NULL DEFAULT 'Cash'
                 CHECK (method IN ('Cash','Bank Transfer','Online')),
  date         DATE NOT NULL,
  invoice_id   UUID REFERENCES public.ims_invoices(id) ON DELETE SET NULL,
  notes        TEXT,
  created_by   UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.ims_expenses (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category   TEXT NOT NULL DEFAULT 'Other'
               CHECK (category IN ('Utilities','Rent','Salaries','Marketing','Equipment','Maintenance','Other')),
  amount     NUMERIC(10,2) NOT NULL DEFAULT 0,
  date       DATE NOT NULL,
  notes      TEXT,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ims_payments_date    ON public.ims_payments(date);
CREATE INDEX IF NOT EXISTS idx_ims_invoices_status  ON public.ims_invoices(status);

ALTER TABLE public.ims_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ims_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ims_expenses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ims_invoices_all" ON public.ims_invoices;
DROP POLICY IF EXISTS "ims_payments_all" ON public.ims_payments;
DROP POLICY IF EXISTS "ims_expenses_all" ON public.ims_expenses;

CREATE POLICY "ims_invoices_all" ON public.ims_invoices FOR ALL TO authenticated USING (public.is_ims_staff());
CREATE POLICY "ims_payments_all" ON public.ims_payments FOR ALL TO authenticated USING (public.is_ims_staff());
CREATE POLICY "ims_expenses_all" ON public.ims_expenses FOR ALL TO authenticated USING (public.is_ims_staff());

-- ═══════════════════════════════════════════════════════════
-- STEP 5: IMS — HR tables (NEW)
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.hr_leave_requests (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  employee_name TEXT NOT NULL,
  type          TEXT NOT NULL DEFAULT 'Annual'
                  CHECK (type IN ('Annual','Sick','Emergency','Maternity/Paternity','Other')),
  from_date     DATE NOT NULL,
  to_date       DATE NOT NULL,
  reason        TEXT,
  status        TEXT NOT NULL DEFAULT 'Pending'
                  CHECK (status IN ('Pending','Approved','Rejected')),
  reviewed_by   UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.hr_salary_payouts (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  employee_name TEXT NOT NULL,
  month         TEXT NOT NULL,
  amount        NUMERIC(10,2) NOT NULL DEFAULT 0,
  paid_on       DATE,
  notes         TEXT,
  created_by    UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.hr_performance_reviews (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id   UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  employee_name TEXT NOT NULL,
  quarter       TEXT NOT NULL,
  score         INTEGER NOT NULL DEFAULT 0 CHECK (score BETWEEN 0 AND 100),
  notes         TEXT,
  reviewed_by   UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.hr_roster (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date          DATE NOT NULL,
  type          TEXT NOT NULL DEFAULT 'Shift'
                  CHECK (type IN ('Shift','Duty','On-call','Other')),
  shift         TEXT,
  assigned_to   UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  assigned_name TEXT,
  description   TEXT,
  created_by    UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hr_leave_user   ON public.hr_leave_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_hr_leave_status ON public.hr_leave_requests(status);
CREATE INDEX IF NOT EXISTS idx_hr_roster_date  ON public.hr_roster(date);

DROP TRIGGER IF EXISTS trg_hr_leave_updated_at ON public.hr_leave_requests;
CREATE TRIGGER trg_hr_leave_updated_at
  BEFORE UPDATE ON public.hr_leave_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE public.hr_leave_requests     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hr_salary_payouts     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hr_performance_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hr_roster             ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "hr_leave_all"   ON public.hr_leave_requests;
DROP POLICY IF EXISTS "hr_salary_all"  ON public.hr_salary_payouts;
DROP POLICY IF EXISTS "hr_review_all"  ON public.hr_performance_reviews;
DROP POLICY IF EXISTS "hr_roster_all"  ON public.hr_roster;

CREATE POLICY "hr_leave_all"  ON public.hr_leave_requests     FOR ALL TO authenticated USING (public.is_ims_staff() OR user_id = auth.uid());
CREATE POLICY "hr_salary_all" ON public.hr_salary_payouts     FOR ALL TO authenticated USING (public.is_ims_staff());
CREATE POLICY "hr_review_all" ON public.hr_performance_reviews FOR ALL TO authenticated USING (public.is_ims_staff());
CREATE POLICY "hr_roster_all" ON public.hr_roster             FOR ALL TO authenticated USING (public.is_ims_staff());

-- ═══════════════════════════════════════════════════════════
-- STEP 6: IMS — Operations / Tasks (NEW)
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.ops_tasks (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title               TEXT NOT NULL,
  description         TEXT,
  start_date          DATE,
  due_date            DATE NOT NULL,
  assigned_to         UUID[] NOT NULL DEFAULT '{}',
  assigned_department TEXT,
  status              TEXT NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending','completed')),
  priority            TEXT NOT NULL DEFAULT 'medium'
                        CHECK (priority IN ('low','medium','high')),
  completed_by        UUID[] DEFAULT '{}',
  created_by          UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.ops_minute_trackers (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date          DATE NOT NULL,
  total_minutes INTEGER NOT NULL DEFAULT 0,
  priority      TEXT NOT NULL DEFAULT 'medium'
                  CHECK (priority IN ('low','medium','high')),
  description   TEXT,
  task_template TEXT,
  members       UUID[] NOT NULL DEFAULT '{}',
  created_by    UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.ops_minute_tracker_tasks (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tracker_id  UUID NOT NULL REFERENCES public.ops_minute_trackers(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  minutes     INTEGER NOT NULL DEFAULT 0,
  member_id   UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  completed   BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ops_tasks_status  ON public.ops_tasks(status);
CREATE INDEX IF NOT EXISTS idx_ops_tasks_due     ON public.ops_tasks(due_date);

DROP TRIGGER IF EXISTS trg_ops_tasks_updated_at ON public.ops_tasks;
CREATE TRIGGER trg_ops_tasks_updated_at
  BEFORE UPDATE ON public.ops_tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE public.ops_tasks               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ops_minute_trackers     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ops_minute_tracker_tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ops_tasks_all"     ON public.ops_tasks;
DROP POLICY IF EXISTS "ops_trackers_all"  ON public.ops_minute_trackers;
DROP POLICY IF EXISTS "ops_tracker_tasks" ON public.ops_minute_tracker_tasks;

CREATE POLICY "ops_tasks_all"     ON public.ops_tasks               FOR ALL TO authenticated USING (public.is_ims_staff());
CREATE POLICY "ops_trackers_all"  ON public.ops_minute_trackers     FOR ALL TO authenticated USING (public.is_ims_staff());
CREATE POLICY "ops_tracker_tasks" ON public.ops_minute_tracker_tasks FOR ALL TO authenticated USING (public.is_ims_staff());

-- ═══════════════════════════════════════════════════════════
-- STEP 7: IMS — System / Audit tables (NEW)
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.ims_login_history (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  user_name   TEXT,
  email       TEXT,
  login_time  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ip_address  TEXT,
  device_info TEXT
);

CREATE TABLE IF NOT EXISTS public.ims_system_commands (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type             TEXT NOT NULL
                     CHECK (type IN ('force_logout','popup','broadcast','disable_user')),
  message          TEXT,
  target_user_id   UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  target_user_name TEXT,
  sent_by_id       UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  sent_by_name     TEXT,
  status           TEXT NOT NULL DEFAULT 'pending'
                     CHECK (status IN ('pending','delivered','cancelled')),
  sent_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_login_history_user ON public.ims_login_history(user_id);
CREATE INDEX IF NOT EXISTS idx_login_history_time ON public.ims_login_history(login_time);

ALTER TABLE public.ims_login_history   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ims_system_commands ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "login_history_ims" ON public.ims_login_history;
DROP POLICY IF EXISTS "sys_commands_admin" ON public.ims_system_commands;

CREATE POLICY "login_history_ims"  ON public.ims_login_history   FOR ALL TO authenticated USING (public.is_ims_staff());
CREATE POLICY "sys_commands_admin" ON public.ims_system_commands FOR ALL TO authenticated USING (public.is_admin());

-- ═══════════════════════════════════════════════════════════
-- STEP 8: IMS — Academic ops tables (simplified, IMS-side)
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.ims_academic_courses (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  duration    TEXT,
  fee         NUMERIC(10,2) DEFAULT 0,
  instructor  TEXT,
  schedule    TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.ims_academic_batches (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name         TEXT NOT NULL,
  course_id    UUID REFERENCES public.ims_academic_courses(id) ON DELETE SET NULL,
  course_name  TEXT,
  start_date   DATE,
  end_date     DATE,
  student_ids  UUID[] NOT NULL DEFAULT '{}',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.ims_academic_students (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name         TEXT NOT NULL,
  email        TEXT,
  contact      TEXT,
  student_id   TEXT UNIQUE NOT NULL,
  course_id    UUID REFERENCES public.ims_academic_courses(id) ON DELETE SET NULL,
  batch_id     UUID REFERENCES public.ims_academic_batches(id) ON DELETE SET NULL,
  enroll_date  DATE,
  status       TEXT NOT NULL DEFAULT 'Active'
                 CHECK (status IN ('Active','Completed','Dropped')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.ims_academic_attendance (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  batch_id    UUID NOT NULL REFERENCES public.ims_academic_batches(id) ON DELETE CASCADE,
  date        DATE NOT NULL,
  present     UUID[] NOT NULL DEFAULT '{}',
  absent      UUID[] NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(batch_id, date)
);

CREATE INDEX IF NOT EXISTS idx_ims_stu_course ON public.ims_academic_students(course_id);
CREATE INDEX IF NOT EXISTS idx_ims_stu_batch  ON public.ims_academic_students(batch_id);

DROP TRIGGER IF EXISTS trg_ims_academic_students_updated_at ON public.ims_academic_students;
CREATE TRIGGER trg_ims_academic_students_updated_at
  BEFORE UPDATE ON public.ims_academic_students
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE public.ims_academic_courses    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ims_academic_batches    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ims_academic_students   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ims_academic_attendance ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ims_acad_courses"  ON public.ims_academic_courses;
DROP POLICY IF EXISTS "ims_acad_batches"  ON public.ims_academic_batches;
DROP POLICY IF EXISTS "ims_acad_students" ON public.ims_academic_students;
DROP POLICY IF EXISTS "ims_acad_attend"   ON public.ims_academic_attendance;

CREATE POLICY "ims_acad_courses"  ON public.ims_academic_courses    FOR ALL TO authenticated USING (public.is_ims_staff());
CREATE POLICY "ims_acad_batches"  ON public.ims_academic_batches    FOR ALL TO authenticated USING (public.is_ims_staff());
CREATE POLICY "ims_acad_students" ON public.ims_academic_students   FOR ALL TO authenticated USING (public.is_ims_staff());
CREATE POLICY "ims_acad_attend"   ON public.ims_academic_attendance FOR ALL TO authenticated USING (public.is_ims_staff());

-- ═══════════════════════════════════════════════════════════
-- DONE — All IMS tables added safely.
-- Your existing ASMS data is completely untouched.
-- ═══════════════════════════════════════════════════════════

-- To promote your admin account to also have IMS access:
-- UPDATE public.profiles
--   SET role = 'super_admin', position = 'Super Admin', access_level = 2
--   WHERE email = 'your@email.com';

-- To create an IMS staff member (after they sign up at /auth/register):
-- UPDATE public.profiles
--   SET role = 'marketing_staff', position = 'Marketing Executive',
--       department = 'Marketing', access_level = 1
--   WHERE email = 'staff@email.com';
