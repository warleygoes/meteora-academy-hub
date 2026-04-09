
-- Create testimonials table
CREATE TABLE public.testimonials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  video_url TEXT,
  title TEXT,
  person_name TEXT NOT NULL,
  role TEXT,
  country TEXT,
  isp_size TEXT,
  result_text TEXT,
  description TEXT,
  tags TEXT[] DEFAULT '{}',
  destinations TEXT[] DEFAULT '{}',
  product_ids UUID[] DEFAULT '{}',
  sort_order INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;

-- Admin management
CREATE POLICY "Admins can manage testimonials"
  ON public.testimonials FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Authenticated users can view active testimonials
CREATE POLICY "Users can view active testimonials"
  ON public.testimonials FOR SELECT
  USING (active = true);
