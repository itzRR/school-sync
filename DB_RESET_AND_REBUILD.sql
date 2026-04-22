-- ============================================================
-- ASMS production reset + rebuild
-- WARNING: destroys existing data in public schema tables used by ASMS
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

DROP TABLE IF EXISTS public.event_registrations CASCADE;
DROP TABLE IF EXISTS public.events CASCADE;
DROP TABLE IF EXISTS public.learning_resources CASCADE;
DROP TABLE IF EXISTS public.certificates CASCADE;
DROP TABLE IF EXISTS public.assessments CASCADE;
DROP TABLE IF EXISTS public.module_progress CASCADE;
DROP TABLE IF EXISTS public.attendance CASCADE;
DROP TABLE IF EXISTS public.enrollments CASCADE;
DROP TABLE IF EXISTS public.trainer_allocations CASCADE;
DROP TABLE IF EXISTS public.batches CASCADE;
DROP TABLE IF EXISTS public.modules CASCADE;
DROP TABLE IF EXISTS public.contact_messages CASCADE;
DROP TABLE IF EXISTS public.courses CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

DROP FUNCTION IF EXISTS public.increment_batch_enrolled(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.increment_event_booked(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.generate_student_id() CASCADE;
DROP FUNCTION IF EXISTS public.generate_certificate_number() CASCADE;
DROP FUNCTION IF EXISTS public.update_updated_at() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.is_admin() CASCADE;
DROP FUNCTION IF EXISTS public.is_staff() CASCADE;
DROP FUNCTION IF EXISTS public.is_trainer() CASCADE;

-- ============================================================
-- ASMS — Academic & Student Management System
-- CADD Centre Lanka — Complete Supabase Schema
-- Run this entire script in your Supabase SQL Editor
-- ============================================================

-- ── EXTENSIONS ───────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── PROFILES ────────────────────────────────────────────────
-- Extends Supabase auth.users with CADD-specific role data
CREATE TABLE IF NOT EXISTS public.profiles (
  id                   UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email                TEXT NOT NULL,
  full_name            TEXT,
  phone                TEXT,
  role                 TEXT NOT NULL DEFAULT 'student'
                         CHECK (role IN ('admin','academic_manager','trainer','student','coordinator')),
  avatar_url           TEXT,
  -- student fields
  student_id           TEXT UNIQUE,          -- auto-generated e.g. CADD-2025-0001
  education_background TEXT,
  -- trainer fields
  specialization       TEXT,
  bio                  TEXT,
  is_active            BOOLEAN NOT NULL DEFAULT TRUE,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── COURSES ──────────────────────────────────────────────────
-- Supports CADD multi-level structure (Proficient / Master / Expert)
CREATE TABLE IF NOT EXISTS public.courses (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug              TEXT UNIQUE NOT NULL,
  title             TEXT NOT NULL,
  description       TEXT NOT NULL,
  short_description TEXT,
  price             NUMERIC(10,2) NOT NULL DEFAULT 0,
  original_price    NUMERIC(10,2),
  level             TEXT NOT NULL DEFAULT 'Proficient Certificate'
                      CHECK (level IN ('Proficient Certificate','Master Certificate','Expert Certificate')),
  category          TEXT NOT NULL DEFAULT '',   -- BIM, CAD, Project Management
  total_hours       INTEGER NOT NULL DEFAULT 80, -- 80 / 160 / 240 hours
  image_url         TEXT,
  tags              TEXT[] NOT NULL DEFAULT '{}',
  is_active         BOOLEAN NOT NULL DEFAULT TRUE,
  is_featured       BOOLEAN NOT NULL DEFAULT FALSE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── MODULES ──────────────────────────────────────────────────
-- Each course has multiple modules (e.g. Revit Architecture, MEP, Navisworks)
CREATE TABLE IF NOT EXISTS public.modules (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id      UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title          TEXT NOT NULL,
  description    TEXT,
  duration_hours INTEGER NOT NULL DEFAULT 0,
  order_index    INTEGER NOT NULL DEFAULT 0,
  topics         TEXT[] NOT NULL DEFAULT '{}',  -- sub-topics list
  is_active      BOOLEAN NOT NULL DEFAULT TRUE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── BATCHES ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.batches (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id      UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  name           TEXT NOT NULL,                -- e.g. "BIM Batch 01 – 2025"
  start_date     DATE NOT NULL,
  end_date       DATE,
  schedule       TEXT NOT NULL DEFAULT '',     -- e.g. "Mon, Wed, Fri — 9:00 AM–12:00 PM"
  mode           TEXT NOT NULL DEFAULT 'classroom'
                   CHECK (mode IN ('classroom','online','hybrid')),
  venue          TEXT,
  seats          INTEGER NOT NULL DEFAULT 20,
  enrolled_count INTEGER NOT NULL DEFAULT 0,
  is_active      BOOLEAN NOT NULL DEFAULT TRUE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── TRAINER ALLOCATIONS ──────────────────────────────────────
-- Maps a trainer to a batch, optionally per module
CREATE TABLE IF NOT EXISTS public.trainer_allocations (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  batch_id   UUID NOT NULL REFERENCES public.batches(id) ON DELETE CASCADE,
  trainer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  module_id  UUID REFERENCES public.modules(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(batch_id, trainer_id, module_id)
);

-- ── ENROLLMENTS ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.enrollments (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id        UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  course_id      UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  batch_id       UUID REFERENCES public.batches(id) ON DELETE SET NULL,
  status         TEXT NOT NULL DEFAULT 'confirmed'
                   CHECK (status IN ('pending','confirmed','cancelled','completed')),
  payment_status TEXT NOT NULL DEFAULT 'paid'
                   CHECK (payment_status IN ('pending','paid','failed','refunded')),
  amount_paid    NUMERIC(10,2) NOT NULL DEFAULT 0,
  enrolled_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, course_id)
);

-- ── ATTENDANCE ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.attendance (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  enrollment_id UUID NOT NULL REFERENCES public.enrollments(id) ON DELETE CASCADE,
  batch_id      UUID NOT NULL REFERENCES public.batches(id) ON DELETE CASCADE,
  date          DATE NOT NULL,
  status        TEXT NOT NULL DEFAULT 'present'
                  CHECK (status IN ('present','absent','late','excused')),
  notes         TEXT,
  marked_by     UUID REFERENCES public.profiles(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(enrollment_id, date)
);

-- ── MODULE PROGRESS ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.module_progress (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  enrollment_id   UUID NOT NULL REFERENCES public.enrollments(id) ON DELETE CASCADE,
  module_id       UUID NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
  status          TEXT NOT NULL DEFAULT 'not_started'
                    CHECK (status IN ('not_started','in_progress','completed')),
  score           NUMERIC(5,2),
  practical_score NUMERIC(5,2),
  theory_score    NUMERIC(5,2),
  completed_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(enrollment_id, module_id)
);

-- ── ASSESSMENTS ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.assessments (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  enrollment_id   UUID NOT NULL REFERENCES public.enrollments(id) ON DELETE CASCADE,
  module_id       UUID REFERENCES public.modules(id) ON DELETE SET NULL,
  type            TEXT NOT NULL DEFAULT 'module_test'
                    CHECK (type IN ('module_test','practical','final_project')),
  title           TEXT NOT NULL,
  marks_obtained  NUMERIC(5,2),
  total_marks     NUMERIC(5,2) NOT NULL DEFAULT 100,
  grade           TEXT,
  conducted_at    TIMESTAMPTZ,
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── CERTIFICATES ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.certificates (
  id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  enrollment_id      UUID NOT NULL REFERENCES public.enrollments(id) ON DELETE CASCADE,
  user_id            UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  course_id          UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  certificate_number TEXT UNIQUE NOT NULL,   -- e.g. CADD-CERT-2025-00001
  type               TEXT NOT NULL DEFAULT 'course_completion'
                       CHECK (type IN ('course_completion','professional_bim')),
  issued_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  qr_code_data       TEXT NOT NULL DEFAULT '',
  pdf_url            TEXT,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── LEARNING RESOURCES ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.learning_resources (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  module_id   UUID REFERENCES public.modules(id) ON DELETE SET NULL,
  course_id   UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  description TEXT,
  type        TEXT NOT NULL DEFAULT 'document'
                CHECK (type IN ('ebook','video','guide','document')),
  url         TEXT NOT NULL,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── CONTACT MESSAGES ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.contact_messages (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name       TEXT NOT NULL,
  email      TEXT NOT NULL,
  phone      TEXT,
  subject    TEXT NOT NULL,
  message    TEXT NOT NULL,
  is_read    BOOLEAN NOT NULL DEFAULT FALSE,
  replied_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── INDEXES ──────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_courses_active       ON public.courses(is_active);
CREATE INDEX IF NOT EXISTS idx_courses_featured     ON public.courses(is_featured);
CREATE INDEX IF NOT EXISTS idx_courses_slug         ON public.courses(slug);
CREATE INDEX IF NOT EXISTS idx_modules_course       ON public.modules(course_id);
CREATE INDEX IF NOT EXISTS idx_batches_course       ON public.batches(course_id);
CREATE INDEX IF NOT EXISTS idx_batches_active       ON public.batches(is_active);
CREATE INDEX IF NOT EXISTS idx_enrollments_user     ON public.enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course   ON public.enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_batch    ON public.enrollments(batch_id);
CREATE INDEX IF NOT EXISTS idx_attendance_enroll    ON public.attendance(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_attendance_batch     ON public.attendance(batch_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date      ON public.attendance(date);
CREATE INDEX IF NOT EXISTS idx_mod_progress_enroll  ON public.module_progress(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_assessments_enroll   ON public.assessments(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_certificates_user    ON public.certificates(user_id);
CREATE INDEX IF NOT EXISTS idx_certificates_num     ON public.certificates(certificate_number);
CREATE INDEX IF NOT EXISTS idx_resources_module     ON public.learning_resources(module_id);
CREATE INDEX IF NOT EXISTS idx_resources_course     ON public.learning_resources(course_id);

-- ── TRIGGERS: updated_at ──────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  EXECUTE 'DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles';
  EXECUTE 'DROP TRIGGER IF EXISTS trg_courses_updated_at ON public.courses';
  EXECUTE 'DROP TRIGGER IF EXISTS trg_modules_updated_at ON public.modules';
  EXECUTE 'DROP TRIGGER IF EXISTS trg_batches_updated_at ON public.batches';
  EXECUTE 'DROP TRIGGER IF EXISTS trg_enrollments_updated_at ON public.enrollments';
  EXECUTE 'DROP TRIGGER IF EXISTS trg_mod_progress_updated_at ON public.module_progress';
  EXECUTE 'DROP TRIGGER IF EXISTS trg_assessments_updated_at ON public.assessments';
  EXECUTE 'DROP TRIGGER IF EXISTS trg_resources_updated_at ON public.learning_resources';
END $$;

CREATE TRIGGER trg_profiles_updated_at     BEFORE UPDATE ON public.profiles          FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_courses_updated_at      BEFORE UPDATE ON public.courses           FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_modules_updated_at      BEFORE UPDATE ON public.modules           FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_batches_updated_at      BEFORE UPDATE ON public.batches           FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_enrollments_updated_at  BEFORE UPDATE ON public.enrollments       FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_mod_progress_updated_at BEFORE UPDATE ON public.module_progress   FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_assessments_updated_at  BEFORE UPDATE ON public.assessments       FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_resources_updated_at    BEFORE UPDATE ON public.learning_resources FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── HELPER FUNCTIONS (RPC) ────────────────────────────────────

CREATE OR REPLACE FUNCTION increment_batch_enrolled(p_batch_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.batches SET enrolled_count = enrolled_count + 1 WHERE id = p_batch_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION generate_student_id()
RETURNS TEXT AS $$
DECLARE
  new_id TEXT;
  counter INTEGER;
BEGIN
  SELECT COUNT(*) + 1 INTO counter FROM public.profiles WHERE role = 'student';
  new_id := 'CADD-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(counter::TEXT, 4, '0');
  RETURN new_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION generate_certificate_number()
RETURNS TEXT AS $$
DECLARE
  new_num TEXT;
  counter INTEGER;
BEGIN
  SELECT COUNT(*) + 1 INTO counter FROM public.certificates;
  new_num := 'CADD-CERT-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(counter::TEXT, 5, '0');
  RETURN new_num;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── AUTO-CREATE PROFILE ON SIGNUP ─────────────────────────────
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, is_active)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    'student',
    TRUE
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ── ROW LEVEL SECURITY ────────────────────────────────────────
ALTER TABLE public.profiles           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modules            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.batches            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trainer_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.module_progress    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessments        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificates       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_messages   ENABLE ROW LEVEL SECURITY;

-- Helper: check role
CREATE OR REPLACE FUNCTION is_admin() RETURNS BOOLEAN AS $$
BEGIN RETURN EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'); END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION is_staff() RETURNS BOOLEAN AS $$
BEGIN RETURN EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','academic_manager','coordinator')); END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION is_trainer() RETURNS BOOLEAN AS $$
BEGIN RETURN EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'trainer'); END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ── PROFILES RLS ──────────────────────────────────────────────
DROP POLICY IF EXISTS "profiles_select_own"   ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_staff" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own"   ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_admin" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own"   ON public.profiles;

CREATE POLICY "profiles_select_own"   ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_select_staff" ON public.profiles FOR SELECT USING (is_staff());
CREATE POLICY "profiles_update_own"   ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_update_admin" ON public.profiles FOR UPDATE USING (is_admin());
CREATE POLICY "profiles_insert_own"   ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- ── COURSES RLS ───────────────────────────────────────────────
DROP POLICY IF EXISTS "courses_select_active" ON public.courses;
DROP POLICY IF EXISTS "courses_select_staff"  ON public.courses;
DROP POLICY IF EXISTS "courses_insert_staff"  ON public.courses;
DROP POLICY IF EXISTS "courses_update_staff"  ON public.courses;
DROP POLICY IF EXISTS "courses_delete_admin"  ON public.courses;

CREATE POLICY "courses_select_active" ON public.courses FOR SELECT USING (is_active = TRUE);
CREATE POLICY "courses_select_staff"  ON public.courses FOR SELECT USING (is_staff());
CREATE POLICY "courses_insert_staff"  ON public.courses FOR INSERT WITH CHECK (is_staff());
CREATE POLICY "courses_update_staff"  ON public.courses FOR UPDATE USING (is_staff());
CREATE POLICY "courses_delete_admin"  ON public.courses FOR DELETE USING (is_admin());

-- ── MODULES RLS ───────────────────────────────────────────────
CREATE POLICY "modules_select_all"   ON public.modules FOR SELECT USING (TRUE);
CREATE POLICY "modules_insert_staff" ON public.modules FOR INSERT WITH CHECK (is_staff());
CREATE POLICY "modules_update_staff" ON public.modules FOR UPDATE USING (is_staff());
CREATE POLICY "modules_delete_admin" ON public.modules FOR DELETE USING (is_admin());

-- ── BATCHES RLS ───────────────────────────────────────────────
CREATE POLICY "batches_select_all"   ON public.batches FOR SELECT USING (TRUE);
CREATE POLICY "batches_insert_staff" ON public.batches FOR INSERT WITH CHECK (is_staff());
CREATE POLICY "batches_update_staff" ON public.batches FOR UPDATE USING (is_staff());
CREATE POLICY "batches_delete_admin" ON public.batches FOR DELETE USING (is_admin());

-- ── TRAINER ALLOCATIONS RLS ───────────────────────────────────
CREATE POLICY "alloc_select_all"   ON public.trainer_allocations FOR SELECT USING (TRUE);
CREATE POLICY "alloc_insert_staff" ON public.trainer_allocations FOR INSERT WITH CHECK (is_staff());
CREATE POLICY "alloc_delete_staff" ON public.trainer_allocations FOR DELETE USING (is_staff());

-- ── ENROLLMENTS RLS ───────────────────────────────────────────
CREATE POLICY "enroll_select_own"   ON public.enrollments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "enroll_select_staff" ON public.enrollments FOR SELECT USING (is_staff());
CREATE POLICY "enroll_select_trainer" ON public.enrollments FOR SELECT USING (is_trainer());
CREATE POLICY "enroll_insert_own"   ON public.enrollments FOR INSERT WITH CHECK (auth.uid() = user_id OR is_staff());
CREATE POLICY "enroll_update_staff" ON public.enrollments FOR UPDATE USING (is_staff());

-- ── ATTENDANCE RLS ────────────────────────────────────────────
CREATE POLICY "att_select_own"     ON public.attendance FOR SELECT USING (
  auth.uid() = (SELECT user_id FROM public.enrollments WHERE id = enrollment_id)
);
CREATE POLICY "att_select_staff"   ON public.attendance FOR SELECT USING (is_staff());
CREATE POLICY "att_select_trainer" ON public.attendance FOR SELECT USING (is_trainer());
CREATE POLICY "att_insert_trainer" ON public.attendance FOR INSERT WITH CHECK (is_trainer() OR is_staff());
CREATE POLICY "att_update_trainer" ON public.attendance FOR UPDATE USING (is_trainer() OR is_staff());

-- ── MODULE PROGRESS RLS ───────────────────────────────────────
CREATE POLICY "mp_select_own"   ON public.module_progress FOR SELECT USING (
  auth.uid() = (SELECT user_id FROM public.enrollments WHERE id = enrollment_id)
);
CREATE POLICY "mp_select_staff" ON public.module_progress FOR SELECT USING (is_staff() OR is_trainer());
CREATE POLICY "mp_insert_staff" ON public.module_progress FOR INSERT WITH CHECK (is_staff() OR is_trainer());
CREATE POLICY "mp_update_staff" ON public.module_progress FOR UPDATE USING (is_staff() OR is_trainer());

-- ── ASSESSMENTS RLS ───────────────────────────────────────────
CREATE POLICY "assess_select_own"   ON public.assessments FOR SELECT USING (
  auth.uid() = (SELECT user_id FROM public.enrollments WHERE id = enrollment_id)
);
CREATE POLICY "assess_select_staff" ON public.assessments FOR SELECT USING (is_staff() OR is_trainer());
CREATE POLICY "assess_insert_staff" ON public.assessments FOR INSERT WITH CHECK (is_staff() OR is_trainer());
CREATE POLICY "assess_update_staff" ON public.assessments FOR UPDATE USING (is_staff() OR is_trainer());

-- ── CERTIFICATES RLS ──────────────────────────────────────────
CREATE POLICY "cert_select_own"   ON public.certificates FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "cert_select_staff" ON public.certificates FOR SELECT USING (is_staff());
CREATE POLICY "cert_insert_admin" ON public.certificates FOR INSERT WITH CHECK (is_admin());

-- ── LEARNING RESOURCES RLS ────────────────────────────────────
CREATE POLICY "res_select_enrolled" ON public.learning_resources FOR SELECT USING (
  is_active = TRUE AND (
    is_staff() OR is_trainer() OR
    EXISTS (
      SELECT 1 FROM public.enrollments e
      WHERE e.user_id = auth.uid()
        AND e.course_id = learning_resources.course_id
        AND e.status IN ('confirmed','completed')
    )
  )
);
CREATE POLICY "res_insert_staff" ON public.learning_resources FOR INSERT WITH CHECK (is_staff());
CREATE POLICY "res_update_staff" ON public.learning_resources FOR UPDATE USING (is_staff());
CREATE POLICY "res_delete_admin" ON public.learning_resources FOR DELETE USING (is_admin());

-- ── CONTACT MESSAGES RLS ─────────────────────────────────────
CREATE POLICY "msg_insert_any"    ON public.contact_messages FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "msg_select_admin"  ON public.contact_messages FOR SELECT USING (is_admin());
CREATE POLICY "msg_update_admin"  ON public.contact_messages FOR UPDATE USING (is_admin());

-- ============================================================
-- SEED DATA — CADD Centre Lanka Programs
-- ============================================================

-- BIM Master Certificate Course
INSERT INTO public.courses (slug, title, description, short_description, price, original_price, level, category, total_hours, tags, is_active, is_featured)
VALUES (
  'bim-master-certificate',
  'BIM Master Certificate',
  'Comprehensive Building Information Modelling program covering Revit Architecture, Revit MEP, Navisworks, and Project Management. Industry-oriented training with practical and software-based learning.',
  'Master BIM with Revit, Navisworks & Project Management',
  95000, 120000, 'Master Certificate', 'BIM', 148,
  ARRAY['BIM','Revit','Navisworks','MEP','Project Management'],
  TRUE, TRUE
)
ON CONFLICT (slug) DO NOTHING;

-- CAD Proficient Certificate
INSERT INTO public.courses (slug, title, description, short_description, price, original_price, level, category, total_hours, tags, is_active, is_featured)
VALUES (
  'cad-proficient-certificate',
  'CAD Proficient Certificate',
  'Foundation course in Computer-Aided Design using industry-standard tools. Covers 2D drafting, 3D modelling, and technical documentation for engineering and architectural applications.',
  'Foundation CAD skills for engineering & architecture',
  45000, 60000, 'Proficient Certificate', 'CAD', 80,
  ARRAY['CAD','AutoCAD','2D Drafting','3D Modelling'],
  TRUE, TRUE
)
ON CONFLICT (slug) DO NOTHING;

-- Project Management Expert Certificate
INSERT INTO public.courses (slug, title, description, short_description, price, original_price, level, category, total_hours, tags, is_active, is_featured)
VALUES (
  'project-management-expert',
  'Project Management Expert Certificate',
  'Advanced project management using MS Project and Primavera. Covers scheduling, resource planning, WBS, and reporting for construction and engineering projects.',
  'Expert project management with MS Project & Primavera',
  120000, 150000, 'Expert Certificate', 'Project Management', 240,
  ARRAY['Project Management','MS Project','Primavera','WBS','Scheduling'],
  TRUE, FALSE
)
ON CONFLICT (slug) DO NOTHING;

-- Modules for BIM Master Certificate
WITH bim AS (SELECT id FROM public.courses WHERE slug = 'bim-master-certificate')
INSERT INTO public.modules (course_id, title, description, duration_hours, order_index, topics)
SELECT
  bim.id,
  m.title, m.description, m.duration_hours, m.order_index, m.topics
FROM bim,
(VALUES
  ('Revit Architecture', 'Parametric 3D building modelling with Autodesk Revit', 40, 1,
   ARRAY['3D Modeling (walls, floors, roofs)', 'Views (plan, section, elevation)', 'Families & components', 'Rendering & walkthroughs']),
  ('Revit MEP', 'Mechanical, Electrical & Plumbing design in Revit', 40, 2,
   ARRAY['HVAC systems', 'Plumbing & electrical', 'Quantity take-off', 'Performance analysis']),
  ('Navisworks', 'Model coordination and clash detection', 35, 3,
   ARRAY['Clash detection', '4D simulation', 'Model coordination']),
  ('Project Management', 'Construction project planning and control', 33, 4,
   ARRAY['Scheduling', 'Resource planning', 'WBS & reporting'])
) AS m(title, description, duration_hours, order_index, topics)
ON CONFLICT DO NOTHING;

-- ── MAKE A USER ADMIN ───────────────────────────────────────
-- After registering your first account, run:
-- UPDATE public.profiles SET role = 'admin' WHERE email = 'your@email.com';


-- ── EVENTS & WORKSHOPS ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.events (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug              TEXT UNIQUE NOT NULL,
  title             TEXT NOT NULL,
  description       TEXT NOT NULL,
  short_description TEXT,
  start_date        DATE NOT NULL,
  end_date          DATE,
  start_time        TEXT,
  end_time          TEXT,
  venue             TEXT NOT NULL,
  capacity          INTEGER NOT NULL DEFAULT 100,
  booked_count      INTEGER NOT NULL DEFAULT 0,
  price             NUMERIC(10,2) NOT NULL DEFAULT 0,
  category          TEXT NOT NULL DEFAULT 'Workshop',
  organizer         TEXT NOT NULL DEFAULT 'CADD Centre Lanka',
  image_url         TEXT,
  tags              TEXT[] NOT NULL DEFAULT '{}',
  agenda            JSONB NOT NULL DEFAULT '[]'::jsonb,
  speakers          JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_active         BOOLEAN NOT NULL DEFAULT TRUE,
  is_featured       BOOLEAN NOT NULL DEFAULT FALSE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.event_registrations (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id        UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  event_id       UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  quantity       INTEGER NOT NULL DEFAULT 1,
  status         TEXT NOT NULL DEFAULT 'confirmed'
                   CHECK (status IN ('pending','confirmed','cancelled')),
  payment_status TEXT NOT NULL DEFAULT 'paid'
                   CHECK (payment_status IN ('pending','paid','failed','refunded')),
  amount_paid    NUMERIC(10,2) NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, event_id)
);

CREATE INDEX IF NOT EXISTS idx_events_slug               ON public.events(slug);
CREATE INDEX IF NOT EXISTS idx_events_active             ON public.events(is_active);
CREATE INDEX IF NOT EXISTS idx_event_regs_user           ON public.event_registrations(user_id);
CREATE INDEX IF NOT EXISTS idx_event_regs_event          ON public.event_registrations(event_id);

CREATE OR REPLACE FUNCTION increment_event_booked(p_event_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.events SET booked_count = booked_count + 1 WHERE id = p_event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DO $$ BEGIN
  EXECUTE 'DROP TRIGGER IF EXISTS trg_events_updated_at ON public.events';
  EXECUTE 'DROP TRIGGER IF EXISTS trg_event_regs_updated_at ON public.event_registrations';
END $$;

CREATE TRIGGER trg_events_updated_at     BEFORE UPDATE ON public.events              FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_event_regs_updated_at BEFORE UPDATE ON public.event_registrations FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE public.events               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_registrations  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "events_select_active"      ON public.events FOR SELECT USING (is_active = TRUE OR is_staff());
CREATE POLICY "events_insert_staff"       ON public.events FOR INSERT WITH CHECK (is_staff());
CREATE POLICY "events_update_staff"       ON public.events FOR UPDATE USING (is_staff());
CREATE POLICY "events_delete_admin"       ON public.events FOR DELETE USING (is_admin());
CREATE POLICY "event_reg_select_own"      ON public.event_registrations FOR SELECT USING (auth.uid() = user_id OR is_staff());
CREATE POLICY "event_reg_insert_auth"     ON public.event_registrations FOR INSERT WITH CHECK (auth.uid() = user_id OR is_staff());
CREATE POLICY "event_reg_update_staff"    ON public.event_registrations FOR UPDATE USING (is_staff());
CREATE POLICY "event_reg_delete_staff"    ON public.event_registrations FOR DELETE USING (is_staff());


-- ============================================================
-- ASMS PHASE 2 ALIGNMENT: leads, academic records, verification
-- ============================================================

CREATE TABLE IF NOT EXISTS public.student_leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  interested_course TEXT,
  preferred_level TEXT CHECK (preferred_level IN ('Proficient Certificate','Master Certificate','Expert Certificate')),
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new','contacted','qualified','enrolled','lost')),
  notes TEXT,
  assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.academic_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  enrollment_id UUID NOT NULL REFERENCES public.enrollments(id) ON DELETE CASCADE,
  module_id UUID REFERENCES public.modules(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('assignment','practical_project','software_skill')),
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started','in_progress','completed')),
  score NUMERIC(5,2),
  max_score NUMERIC(5,2),
  notes TEXT,
  evidence_url TEXT,
  assessed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.attendance ADD COLUMN IF NOT EXISTS entry_method TEXT NOT NULL DEFAULT 'manual' CHECK (entry_method IN ('manual','biometric'));
ALTER TABLE public.assessments ADD COLUMN IF NOT EXISTS delivery_mode TEXT NOT NULL DEFAULT 'offline' CHECK (delivery_mode IN ('online','offline'));

CREATE INDEX IF NOT EXISTS idx_student_leads_status ON public.student_leads(status);
CREATE INDEX IF NOT EXISTS idx_academic_records_enrollment ON public.academic_records(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_academic_records_module ON public.academic_records(module_id);

DO $$ BEGIN
  EXECUTE 'DROP TRIGGER IF EXISTS trg_student_leads_updated_at ON public.student_leads';
  EXECUTE 'DROP TRIGGER IF EXISTS trg_academic_records_updated_at ON public.academic_records';
EXCEPTION WHEN undefined_table THEN NULL; END $$;

CREATE TRIGGER trg_student_leads_updated_at BEFORE UPDATE ON public.student_leads FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_academic_records_updated_at BEFORE UPDATE ON public.academic_records FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE public.student_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academic_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "leads_select_staff" ON public.student_leads;
DROP POLICY IF EXISTS "leads_insert_staff" ON public.student_leads;
DROP POLICY IF EXISTS "leads_update_staff" ON public.student_leads;
DROP POLICY IF EXISTS "academic_records_select_own" ON public.academic_records;
DROP POLICY IF EXISTS "academic_records_select_staff" ON public.academic_records;
DROP POLICY IF EXISTS "academic_records_insert_staff" ON public.academic_records;
DROP POLICY IF EXISTS "academic_records_update_staff" ON public.academic_records;

CREATE POLICY "leads_select_staff" ON public.student_leads FOR SELECT USING (is_staff());
CREATE POLICY "leads_insert_staff" ON public.student_leads FOR INSERT WITH CHECK (is_staff());
CREATE POLICY "leads_update_staff" ON public.student_leads FOR UPDATE USING (is_staff());
CREATE POLICY "academic_records_select_own" ON public.academic_records FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.enrollments e WHERE e.id = academic_records.enrollment_id AND e.user_id = auth.uid())
);
CREATE POLICY "academic_records_select_staff" ON public.academic_records FOR SELECT USING (is_staff() OR is_trainer());
CREATE POLICY "academic_records_insert_staff" ON public.academic_records FOR INSERT WITH CHECK (is_staff() OR is_trainer());
CREATE POLICY "academic_records_update_staff" ON public.academic_records FOR UPDATE USING (is_staff() OR is_trainer());
