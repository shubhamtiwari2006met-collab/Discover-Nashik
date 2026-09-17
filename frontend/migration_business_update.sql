-- SQL Migration to update business_registrations table schema
ALTER TABLE public.business_registrations
  ADD COLUMN IF NOT EXISTS category TEXT,
  ADD COLUMN IF NOT EXISTS subcategory TEXT,
  ADD COLUMN IF NOT EXISTS city_area TEXT,
  ADD COLUMN IF NOT EXISTS opening_time TEXT,
  ADD COLUMN IF NOT EXISTS closing_time TEXT,
  ADD COLUMN IF NOT EXISTS working_days TEXT,
  ADD COLUMN IF NOT EXISTS website_url TEXT,
  ADD COLUMN IF NOT EXISTS admin_remarks TEXT;

-- Update column verification_status check constraint or default if needed
ALTER TABLE public.business_registrations
  DROP CONSTRAINT IF EXISTS business_registrations_verification_status_check;

ALTER TABLE public.business_registrations
  ADD CONSTRAINT business_registrations_verification_status_check
  CHECK (verification_status IN ('not_submitted', 'pending', 'approved', 'rejected', 'deactivated'));
