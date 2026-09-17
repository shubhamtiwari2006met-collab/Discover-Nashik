-- Migration: Add Nearby Places Support
-- Run this script in your Supabase SQL Editor

-- 1. Add latitude and longitude columns to business_registrations
ALTER TABLE public.business_registrations
  ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;

-- 2. Create index for faster geospatial filtering
CREATE INDEX IF NOT EXISTS idx_br_lat_lng
  ON public.business_registrations(latitude, longitude)
  WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- 3. Create the nearby_places RPC function using haversine formula
-- This function returns approved businesses sorted by distance from user coordinates
CREATE OR REPLACE FUNCTION public.nearby_places(
  user_lat DOUBLE PRECISION,
  user_lng DOUBLE PRECISION,
  search_category TEXT DEFAULT NULL,
  search_radius_km DOUBLE PRECISION DEFAULT 10.0,
  result_limit INT DEFAULT 20
)
RETURNS TABLE (
  id UUID,
  business_name TEXT,
  category TEXT,
  subcategory TEXT,
  address TEXT,
  city_area TEXT,
  description TEXT,
  phone TEXT,
  email TEXT,
  website_url TEXT,
  opening_time TEXT,
  closing_time TEXT,
  working_days TEXT,
  photos TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  distance_km DOUBLE PRECISION
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
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
    -- Haversine distance in km
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
    AND br.latitude IS NOT NULL
    AND br.longitude IS NOT NULL
    -- Pre-filter by bounding box for performance (rough lat/lng degree filter)
    AND br.latitude BETWEEN (user_lat - (search_radius_km / 111.0)) AND (user_lat + (search_radius_km / 111.0))
    AND br.longitude BETWEEN (user_lng - (search_radius_km / (111.0 * cos(radians(user_lat))))) AND (user_lng + (search_radius_km / (111.0 * cos(radians(user_lat)))))
    -- Category filter (case-insensitive partial match)
    AND (
      search_category IS NULL
      OR search_category = ''
      OR br.category ILIKE '%' || search_category || '%'
      OR br.subcategory ILIKE '%' || search_category || '%'
    )
  HAVING (
    6371.0 * acos(
      LEAST(1.0, GREATEST(-1.0,
        cos(radians(user_lat)) * cos(radians(br.latitude))
        * cos(radians(br.longitude) - radians(user_lng))
        + sin(radians(user_lat)) * sin(radians(br.latitude))
      ))
    )
  ) <= search_radius_km
  ORDER BY distance_km ASC
  LIMIT result_limit;
$$;

-- 4. Grant execute permission to anon and authenticated roles
GRANT EXECUTE ON FUNCTION public.nearby_places(DOUBLE PRECISION, DOUBLE PRECISION, TEXT, DOUBLE PRECISION, INT) TO anon, authenticated, service_role;

-- 5. Reload PostgREST schema cache so the new function and columns are available
NOTIFY pgrst, 'reload schema';
