-- Migration: Add image_url, page_image_url, polygon and xp_awarded to transcriptions table
-- Run this in the Supabase SQL Editor

-- 1. Add segment image_url (pre-cropped image at submission time)
ALTER TABLE public.transcriptions
  ADD COLUMN IF NOT EXISTS image_url text;

-- 2. Add page_image_url (full page image URL at submission time — what contributor actually saw)
ALTER TABLE public.transcriptions
  ADD COLUMN IF NOT EXISTS page_image_url text;

-- 3. Add polygon (segment polygon at submission time — coordinates on the full page)
ALTER TABLE public.transcriptions
  ADD COLUMN IF NOT EXISTS polygon jsonb;

-- 4. Add xp_awarded (XP given at submission time, used to deduct on rejection/modification)
ALTER TABLE public.transcriptions
  ADD COLUMN IF NOT EXISTS xp_awarded integer DEFAULT 0;

-- Backfill image_url from current segment (best effort for old transcriptions)
UPDATE public.transcriptions t
SET image_url = s.image_url
FROM public.segments s
WHERE t.segment_id = s.id
  AND t.image_url IS NULL;

-- Backfill page_image_url from the segment's page
UPDATE public.transcriptions t
SET page_image_url = p.image_url,
    polygon = s.polygon
FROM public.segments s
JOIN public.pages p ON p.id = s.page_id
WHERE t.segment_id = s.id
  AND t.page_image_url IS NULL;

-- Note: xp_awarded for old transcriptions stays NULL/0 — no XP will be deducted on rejection of those
