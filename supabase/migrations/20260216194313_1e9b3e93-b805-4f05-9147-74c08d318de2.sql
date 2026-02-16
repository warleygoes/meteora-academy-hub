
-- Add auto_translate column to menu_links
ALTER TABLE public.menu_links ADD COLUMN IF NOT EXISTS auto_translate boolean NOT NULL DEFAULT false;

-- Add auto_translate column to course_categories
ALTER TABLE public.course_categories ADD COLUMN IF NOT EXISTS auto_translate boolean NOT NULL DEFAULT true;
