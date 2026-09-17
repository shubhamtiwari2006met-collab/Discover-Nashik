-- ============================================================================
-- Discover Nashik — Complete Supabase Schema
-- ============================================================================
-- SAFE TO RUN on both fresh and existing databases.
-- Uses IF NOT EXISTS / CREATE OR REPLACE / DROP ... IF EXISTS throughout.
-- This single file replaces all separate migration scripts.
-- ============================================================================

-- ============================================================
-- 1. Schema-level permissions for Supabase roles
-- ============================================================
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES    TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;

-- ============================================================
-- 2. Drop ALL existing RLS policies to start clean
--    (prevents "policy already exists" errors on re-run)
-- ============================================================
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN
        SELECT policyname, tablename
        FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename IN (
              'profiles',
              'business_registrations',
              'notifications',
              'groups',
              'group_members',
              'group_notes',
              'group_locations'
          )
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, pol.tablename);
    END LOOP;
END $$;

-- ============================================================
-- 3. Helper function: check admin role (SECURITY DEFINER avoids RLS recursion)
-- ============================================================
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'ADMIN'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;


-- ============================================================
-- 4. PROFILES table
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id         UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email      TEXT         NOT NULL,
  role       TEXT         NOT NULL DEFAULT 'VISITOR'
               CHECK (role IN ('ADMIN', 'BUSINESS', 'VISITOR')),
  created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
GRANT ALL ON TABLE public.profiles TO anon, authenticated, service_role;

-- Profiles RLS policies
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admins can update all profiles"
  ON public.profiles FOR UPDATE
  USING (public.is_admin());

-- Auto-create profile on user sign-up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (new.id, new.email, 'VISITOR')
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Backfill any existing auth.users that don't have a profile yet
INSERT INTO public.profiles (id, email, role)
SELECT id, email, 'VISITOR'
FROM auth.users
ON CONFLICT (id) DO NOTHING;


-- ============================================================
-- 5. BUSINESS REGISTRATIONS table
-- ============================================================
CREATE TABLE IF NOT EXISTS public.business_registrations (
  id                  UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id            UUID          REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  business_name       TEXT          NOT NULL,
  category            TEXT          NOT NULL,
  subcategory         TEXT,
  contact_name        TEXT          NOT NULL,
  phone               TEXT          NOT NULL,
  email               TEXT          NOT NULL,
  address             TEXT          NOT NULL,
  city_area           TEXT,
  description         TEXT,
  opening_time        TEXT,
  closing_time        TEXT,
  working_days        TEXT,
  website_url         TEXT,
  documents           TEXT,          -- comma-separated URLs or JSON string
  photos              TEXT,          -- comma-separated URLs or JSON string
  latitude            DOUBLE PRECISION,
  longitude           DOUBLE PRECISION,
  verification_status TEXT          NOT NULL DEFAULT 'pending'
                        CHECK (verification_status IN (
                          'not_submitted', 'pending', 'approved', 'rejected', 'deactivated'
                        )),
  rejection_reason    TEXT,
  admin_remarks       TEXT,
  created_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- If upgrading from an older schema, add any missing columns
ALTER TABLE public.business_registrations
  ADD COLUMN IF NOT EXISTS category          TEXT,
  ADD COLUMN IF NOT EXISTS subcategory       TEXT,
  ADD COLUMN IF NOT EXISTS city_area         TEXT,
  ADD COLUMN IF NOT EXISTS opening_time      TEXT,
  ADD COLUMN IF NOT EXISTS closing_time      TEXT,
  ADD COLUMN IF NOT EXISTS working_days      TEXT,
  ADD COLUMN IF NOT EXISTS website_url       TEXT,
  ADD COLUMN IF NOT EXISTS admin_remarks     TEXT,
  ADD COLUMN IF NOT EXISTS latitude          DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS longitude         DOUBLE PRECISION;

-- Ensure the CHECK constraint matches all valid statuses
ALTER TABLE public.business_registrations
  DROP CONSTRAINT IF EXISTS business_registrations_verification_status_check;
ALTER TABLE public.business_registrations
  ADD CONSTRAINT business_registrations_verification_status_check
  CHECK (verification_status IN ('not_submitted', 'pending', 'approved', 'rejected', 'deactivated'));

ALTER TABLE public.business_registrations ENABLE ROW LEVEL SECURITY;
GRANT ALL ON TABLE public.business_registrations TO anon, authenticated, service_role;

-- Business Registrations RLS policies
CREATE POLICY "Users can insert their own registrations"
  ON public.business_registrations FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can view their own registrations"
  ON public.business_registrations FOR SELECT
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can update their own registrations"
  ON public.business_registrations FOR UPDATE
  USING (auth.uid() = owner_id);

CREATE POLICY "Admins have full access to business registrations"
  ON public.business_registrations FOR ALL
  USING (public.is_admin());

CREATE POLICY "Anyone can view approved business registrations"
  ON public.business_registrations FOR SELECT
  USING (verification_status = 'approved');

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_br_verification_status ON public.business_registrations(verification_status);
CREATE INDEX IF NOT EXISTS idx_br_category            ON public.business_registrations(category);
CREATE INDEX IF NOT EXISTS idx_br_status_category     ON public.business_registrations(verification_status, category);
CREATE INDEX IF NOT EXISTS idx_br_lat_lng             ON public.business_registrations(latitude, longitude)
  WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- Backfill: promote any existing business owners
UPDATE public.profiles
SET role = 'BUSINESS'
WHERE id IN (SELECT owner_id FROM public.business_registrations);

-- Backfill: promote the first registered user to ADMIN if none exists yet
UPDATE public.profiles
SET role = 'ADMIN'
WHERE id = (
  SELECT id FROM auth.users ORDER BY created_at ASC LIMIT 1
)
AND NOT EXISTS (
  SELECT 1 FROM public.profiles WHERE role = 'ADMIN'
);


-- ============================================================
-- 6. NOTIFICATIONS table
-- ============================================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id         UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID          REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  admin_id   UUID          REFERENCES auth.users(id) ON DELETE SET NULL,
  title      TEXT          NOT NULL,
  message    TEXT          NOT NULL,
  is_read    BOOLEAN       NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
GRANT ALL ON TABLE public.notifications TO anon, authenticated, service_role;

-- Notifications RLS policies
CREATE POLICY "Users can view their own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins have full access to notifications"
  ON public.notifications FOR ALL
  USING (public.is_admin());


-- ============================================================
-- 7. GROUP TRACKER tables
-- ============================================================
CREATE TABLE IF NOT EXISTS public.groups (
  id               UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  code             TEXT          UNIQUE NOT NULL,
  group_name       TEXT          NOT NULL DEFAULT 'Nashik Explorers',
  coordinator_name TEXT          NOT NULL,
  coordinator_id   UUID          REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.group_members (
  id           UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  group_code   TEXT          NOT NULL REFERENCES public.groups(code) ON DELETE CASCADE,
  user_id      UUID          REFERENCES auth.users(id) ON DELETE SET NULL,
  display_name TEXT          NOT NULL,
  role         TEXT          NOT NULL DEFAULT 'member'
                 CHECK (role IN ('coordinator', 'member')),
  joined_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.group_notes (
  id          UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  group_code  TEXT          NOT NULL REFERENCES public.groups(code) ON DELETE CASCADE,
  sender_name TEXT          NOT NULL,
  sender_role TEXT          NOT NULL DEFAULT 'member',
  message     TEXT          NOT NULL,
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.group_locations (
  id           UUID              PRIMARY KEY DEFAULT gen_random_uuid(),
  group_code   TEXT              NOT NULL REFERENCES public.groups(code) ON DELETE CASCADE,
  user_id      TEXT              NOT NULL,
  display_name TEXT              NOT NULL,
  lat          DOUBLE PRECISION  NOT NULL,
  lng          DOUBLE PRECISION  NOT NULL,
  updated_at   TIMESTAMPTZ       NOT NULL DEFAULT NOW()
);

ALTER TABLE public.groups          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_notes     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_locations ENABLE ROW LEVEL SECURITY;

GRANT ALL ON TABLE public.groups          TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.group_members   TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.group_notes     TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.group_locations TO anon, authenticated, service_role;

-- Groups RLS policies
CREATE POLICY "Anyone can view groups by code"              ON public.groups          FOR SELECT USING (true);
CREATE POLICY "Anyone can insert groups"                    ON public.groups          FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can view group members"               ON public.group_members   FOR SELECT USING (true);
CREATE POLICY "Anyone can insert group members"             ON public.group_members   FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can delete group members"             ON public.group_members   FOR DELETE USING (true);

CREATE POLICY "Anyone can view group notes"                 ON public.group_notes     FOR SELECT USING (true);
CREATE POLICY "Anyone can insert group notes"               ON public.group_notes     FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can view group locations"             ON public.group_locations FOR SELECT USING (true);
CREATE POLICY "Anyone can insert/update group locations"    ON public.group_locations FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update group locations"           ON public.group_locations FOR UPDATE USING (true);


-- ============================================================
-- 8. NEARBY PLACES RPC (Haversine distance search)
-- ============================================================
CREATE OR REPLACE FUNCTION public.nearby_places(
  user_lat         DOUBLE PRECISION,
  user_lng         DOUBLE PRECISION,
  search_category  TEXT             DEFAULT NULL,
  search_radius_km DOUBLE PRECISION DEFAULT 10.0,
  result_limit     INT              DEFAULT 20
)
RETURNS TABLE (
  id           UUID,
  business_name TEXT,
  category     TEXT,
  subcategory  TEXT,
  address      TEXT,
  city_area    TEXT,
  description  TEXT,
  phone        TEXT,
  email        TEXT,
  website_url  TEXT,
  opening_time TEXT,
  closing_time TEXT,
  working_days TEXT,
  photos       TEXT,
  latitude     DOUBLE PRECISION,
  longitude    DOUBLE PRECISION,
  distance_km  DOUBLE PRECISION
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT
    sub.id,
    sub.business_name,
    sub.category,
    sub.subcategory,
    sub.address,
    sub.city_area,
    sub.description,
    sub.phone,
    sub.email,
    sub.website_url,
    sub.opening_time,
    sub.closing_time,
    sub.working_days,
    sub.photos,
    sub.latitude,
    sub.longitude,
    sub.distance_km
  FROM (
    SELECT
      br.id,
      br.business_name,
      br.category,
      br.subcategory,
      br.address,
      br.city_area,
      br.description,
      br.phone,
      br.email,
      br.website_url,
      br.opening_time,
      br.closing_time,
      br.working_days,
      br.photos,
      br.latitude,
      br.longitude,
      (
        6371.0 * acos(
          LEAST(1.0, GREATEST(-1.0,
            cos(radians(user_lat)) * cos(radians(br.latitude))
            * cos(radians(br.longitude) - radians(user_lng))
            + sin(radians(user_lat)) * sin(radians(br.latitude))
          ))
        )
      ) AS distance_km
    FROM public.business_registrations br
    WHERE br.verification_status = 'approved'
      AND br.latitude  IS NOT NULL
      AND br.longitude IS NOT NULL
      AND br.latitude  BETWEEN (user_lat - (search_radius_km / 111.0))
                          AND (user_lat + (search_radius_km / 111.0))
      AND br.longitude BETWEEN (user_lng - (search_radius_km / (111.0 * cos(radians(user_lat)))))
                          AND (user_lng + (search_radius_km / (111.0 * cos(radians(user_lat)))))
      AND (
        search_category IS NULL
        OR search_category = ''
        OR br.category    ILIKE '%' || search_category || '%'
        OR br.subcategory ILIKE '%' || search_category || '%'
      )
  ) sub
  WHERE sub.distance_km <= search_radius_km
  ORDER BY sub.distance_km ASC
  LIMIT result_limit;
$$;

GRANT EXECUTE ON FUNCTION public.nearby_places(
  DOUBLE PRECISION, DOUBLE PRECISION, TEXT, DOUBLE PRECISION, INT
) TO anon, authenticated, service_role;


-- ============================================================
-- 9. Global sequence permissions
-- ============================================================
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;


-- ============================================================
-- 10. Reload PostgREST schema cache
-- ============================================================
NOTIFY pgrst, 'reload schema';
