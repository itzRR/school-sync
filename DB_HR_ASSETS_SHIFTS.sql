-- ================================================================
-- SCHOLAR SYNC — HR Shifts & Assets Migration
-- Run this in: Supabase Dashboard → SQL Editor → New Query → Run
--
-- Safe to run multiple times (uses IF NOT EXISTS).
-- Adds 'work_schedule' and 'office_assets' JSONB columns to the profiles table.
-- ================================================================

-- 1. Add work_schedule column (stores assigned shifts)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS work_schedule JSONB NOT NULL DEFAULT '[]';

-- 2. Add office_assets column (stores assigned items/laptops)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS office_assets JSONB NOT NULL DEFAULT '[]';

-- ================================================================
-- DONE. No existing data is affected.
-- ================================================================
