-- Migration: Add image_url and xp_awarded to transcriptions table
-- Run this in the Supabase SQL Editor

-- 1. Add image_url to transcriptions (stores the segment image URL at submission time)
ALTER TABLE public.transcriptions
  ADD COLUMN IF NOT EXISTS image_url text;

-- 2. Add xp_awarded to transcriptions (stores the XP given at submission time)
ALTER TABLE public.transcriptions
  ADD COLUMN IF NOT EXISTS xp_awarded integer DEFAULT 0;

-- Backfill image_url for existing transcriptions from their segment
UPDATE public.transcriptions t
SET image_url = s.image_url
FROM public.segments s
WHERE t.segment_id = s.id
  AND t.image_url IS NULL;

-- Note: xp_awarded for old transcriptions stays NULL/0 - no XP will be deducted on rejection of old transcriptions
