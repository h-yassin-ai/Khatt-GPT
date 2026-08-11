-- Resources and review flags used by the public scholarly record and contributor workflow.
-- Run this in the Supabase SQL editor before production launch.

ALTER TABLE public.manuscripts
  ADD COLUMN IF NOT EXISTS pdf_url text,
  ADD COLUMN IF NOT EXISTS reference_text_url text;

ALTER TABLE public.segments
  ADD COLUMN IF NOT EXISTS segmentation_issue_reported boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS segmentation_issue_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS segmentation_issue_reported_at timestamptz,
  ADD COLUMN IF NOT EXISTS segmentation_issue_reported_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_segments_segmentation_issue_reported
  ON public.segments (segmentation_issue_reported)
  WHERE segmentation_issue_reported = true;
