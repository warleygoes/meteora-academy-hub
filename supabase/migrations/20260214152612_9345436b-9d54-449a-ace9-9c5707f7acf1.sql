
-- 1. Private lessons: add is_private flag
ALTER TABLE public.course_lessons ADD COLUMN IF NOT EXISTS is_private boolean NOT NULL DEFAULT false;

-- 2. User-lesson access table for private lessons
CREATE TABLE public.user_lesson_access (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  lesson_id uuid NOT NULL REFERENCES public.course_lessons(id) ON DELETE CASCADE,
  granted_at timestamp with time zone NOT NULL DEFAULT now(),
  granted_by uuid,
  UNIQUE(user_id, lesson_id)
);

ALTER TABLE public.user_lesson_access ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage user_lesson_access" ON public.user_lesson_access FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can view own lesson access" ON public.user_lesson_access FOR SELECT USING (auth.uid() = user_id);

-- 3. Lesson ratings table (5 stars)
CREATE TABLE public.lesson_ratings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  lesson_id uuid NOT NULL REFERENCES public.course_lessons(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, lesson_id)
);

ALTER TABLE public.lesson_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view ratings" ON public.lesson_ratings FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can create own ratings" ON public.lesson_ratings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own ratings" ON public.lesson_ratings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage ratings" ON public.lesson_ratings FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- 4. Platform settings table (for OpenAI key etc.)
CREATE TABLE public.platform_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key text NOT NULL UNIQUE,
  value text,
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage platform_settings" ON public.platform_settings FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- 5. Add images to packages (package = trail now)
ALTER TABLE public.packages ADD COLUMN IF NOT EXISTS thumbnail_url text;
ALTER TABLE public.packages ADD COLUMN IF NOT EXISTS thumbnail_vertical_url text;
