
-- Content type enum
CREATE TYPE public.lesson_content_type AS ENUM ('video', 'text', 'image', 'audio', 'link', 'pdf');

-- Multiple contents per lesson
CREATE TABLE public.lesson_contents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lesson_id UUID NOT NULL REFERENCES public.course_lessons(id) ON DELETE CASCADE,
  type public.lesson_content_type NOT NULL,
  title TEXT NOT NULL,
  content TEXT, -- url for video/image/audio/pdf/link, markdown for text
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.lesson_contents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage lesson_contents" ON public.lesson_contents FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can view lesson_contents" ON public.lesson_contents FOR SELECT USING (auth.uid() IS NOT NULL);

-- Track student progress (last lesson watched per course)
CREATE TABLE public.lesson_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES public.course_lessons(id) ON DELETE CASCADE,
  completed BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, course_id)
);

ALTER TABLE public.lesson_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own progress" ON public.lesson_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own progress" ON public.lesson_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own progress" ON public.lesson_progress FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage progress" ON public.lesson_progress FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
