
-- Course categories
CREATE TABLE public.course_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.course_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage categories" ON public.course_categories FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Authenticated users can view categories" ON public.course_categories FOR SELECT USING (auth.uid() IS NOT NULL);

-- Courses table
CREATE TABLE public.courses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  category_id UUID REFERENCES public.course_categories(id) ON DELETE SET NULL,
  thumbnail_url TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage courses" ON public.courses FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can view published courses" ON public.courses FOR SELECT USING (auth.uid() IS NOT NULL AND status = 'published');

-- Course modules
CREATE TABLE public.course_modules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.course_modules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage modules" ON public.course_modules FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can view modules of published courses" ON public.course_modules FOR SELECT USING (
  auth.uid() IS NOT NULL AND EXISTS (SELECT 1 FROM public.courses WHERE courses.id = course_modules.course_id AND courses.status = 'published')
);

-- Course lessons
CREATE TABLE public.course_lessons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  module_id UUID NOT NULL REFERENCES public.course_modules(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  video_url TEXT,
  duration_minutes INT DEFAULT 0,
  sort_order INT NOT NULL DEFAULT 0,
  is_free BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.course_lessons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage lessons" ON public.course_lessons FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can view lessons" ON public.course_lessons FOR SELECT USING (auth.uid() IS NOT NULL);

-- Course enrollments
CREATE TABLE public.course_enrollments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  enrolled_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(course_id, user_id)
);
ALTER TABLE public.course_enrollments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage enrollments" ON public.course_enrollments FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can view own enrollments" ON public.course_enrollments FOR SELECT USING (auth.uid() = user_id);

-- Triggers for updated_at
CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON public.courses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
