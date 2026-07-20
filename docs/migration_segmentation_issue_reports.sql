-- Migration: Track contributor-reported segmentation problems on segments.
-- Run this in the Supabase SQL editor before deploying the related UI.

ALTER TABLE public.segments
ADD COLUMN IF NOT EXISTS segmentation_issue_reported boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS segmentation_issue_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS segmentation_issue_reported_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS segmentation_issue_reported_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_segments_segmentation_issue_reported
ON public.segments (segmentation_issue_reported)
WHERE segmentation_issue_reported = true;
