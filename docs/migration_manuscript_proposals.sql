-- Migration: Academic Metadata & Manuscript Proposals System
-- Run this in the Supabase SQL Editor to support the scholarly fields and public proposals.

-- 1. Extend public.manuscripts with scholarly & paleographic columns
ALTER TABLE public.manuscripts
  ADD COLUMN IF NOT EXISTS author text,
  ADD COLUMN IF NOT EXISTS shelfmark text,
  ADD COLUMN IF NOT EXISTS script_type text,
  ADD COLUMN IF NOT EXISTS century text,
  ADD COLUMN IF NOT EXISTS license text DEFAULT 'Open Access / Domaine Public',
  ADD COLUMN IF NOT EXISTS iiif_manifest_url text;

-- 2. Create public.manuscript_proposals table for external scholars and crowd submissions
CREATE TABLE IF NOT EXISTS public.manuscript_proposals (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  author text,
  institution text,
  shelfmark text,
  script_type text,
  century text,
  facsimile_url text,
  sample_image_url text,
  proposer_name text,
  proposer_email text,
  proposer_affiliation text,
  scholarly_justification text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_notes text,
  created_manuscript_id uuid REFERENCES public.manuscripts(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  reviewed_at timestamptz,
  reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

-- 3. Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_manuscript_proposals_status ON public.manuscript_proposals (status);
CREATE INDEX IF NOT EXISTS idx_manuscript_proposals_created_at ON public.manuscript_proposals (created_at DESC);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.manuscript_proposals ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies
CREATE POLICY Allow public insert on manuscript_proposals
  ON public.manuscript_proposals
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY Allow authenticated read on manuscript_proposals
  ON public.manuscript_proposals
  FOR SELECT
  USING (true);

CREATE POLICY Allow authenticated update on manuscript_proposals
  ON public.manuscript_proposals
  FOR UPDATE
  USING (auth.role() = 'authenticated');
