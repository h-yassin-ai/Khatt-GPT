-- 1. Create a status enum type or use a check constraint for better flexibility
-- We'll use a check constraint for now for simplicity in Supabase unless enums are preferred.
ALTER TABLE public.transcriptions
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending'
  CHECK (status IN ('pending', 'validated', 'modified', 'rejected'));

-- 2. Backfill status from is_validated
UPDATE public.transcriptions
SET status = CASE 
    WHEN is_validated = true THEN 'validated'
    ELSE 'pending'
END
WHERE status = 'pending';

-- 3. Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    transcription_id uuid REFERENCES public.transcriptions(id) ON DELETE CASCADE,
    type text NOT NULL CHECK (type IN ('validated', 'modified', 'rejected')),
    message text,
    is_read boolean DEFAULT false,
    created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own notifications
CREATE POLICY "Users can see own notifications" ON public.notifications
    FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can mark their own notifications as read
CREATE POLICY "Users can update own notifications" ON public.notifications
    FOR UPDATE USING (auth.uid() = user_id);

-- Policy: Admins can do anything (assuming SERVICE ROLE is used or admin check)
-- (Supabase handles SERVICE ROLE automatically)
