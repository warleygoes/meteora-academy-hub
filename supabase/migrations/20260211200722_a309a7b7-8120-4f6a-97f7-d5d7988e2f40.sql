
-- Add status column to profiles (pending, approved, rejected)
ALTER TABLE public.profiles ADD COLUMN status text NOT NULL DEFAULT 'pending';

-- Migrate existing data: approved=true -> 'approved', approved=false -> 'pending'
UPDATE public.profiles SET status = 'approved' WHERE approved = true;
UPDATE public.profiles SET status = 'pending' WHERE approved = false;
