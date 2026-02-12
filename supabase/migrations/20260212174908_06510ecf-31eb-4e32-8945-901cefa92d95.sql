
-- Add vertical thumbnail column to courses
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS thumbnail_vertical_url text;
