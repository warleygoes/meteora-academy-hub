
-- Extend plans table with payment type, duration, stripe IDs, features
ALTER TABLE public.plans ADD COLUMN IF NOT EXISTS payment_type TEXT NOT NULL DEFAULT 'monthly' CHECK (payment_type IN ('one_time', 'monthly'));
ALTER TABLE public.plans ADD COLUMN IF NOT EXISTS duration_days INT;
ALTER TABLE public.plans ADD COLUMN IF NOT EXISTS stripe_price_id TEXT;
ALTER TABLE public.plans ADD COLUMN IF NOT EXISTS stripe_product_id TEXT;
ALTER TABLE public.plans ADD COLUMN IF NOT EXISTS features TEXT[] DEFAULT '{}';

-- Junction table: which courses are included in each plan
CREATE TABLE public.plan_courses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_id UUID NOT NULL REFERENCES public.plans(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(plan_id, course_id)
);
ALTER TABLE public.plan_courses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage plan_courses" ON public.plan_courses FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can view plan_courses" ON public.plan_courses FOR SELECT USING (auth.uid() IS NOT NULL);
