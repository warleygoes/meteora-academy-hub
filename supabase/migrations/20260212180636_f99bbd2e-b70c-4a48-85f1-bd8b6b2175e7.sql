
-- Services table
CREATE TABLE public.services (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  payment_type TEXT NOT NULL DEFAULT 'one_time' CHECK (payment_type IN ('monthly', 'one_time')),
  price NUMERIC NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage services" ON public.services FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Authenticated users can view active services" ON public.services FOR SELECT USING (auth.uid() IS NOT NULL AND active = true);

-- Plan-services junction table
CREATE TABLE public.plan_services (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_id UUID NOT NULL REFERENCES public.plans(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(plan_id, service_id)
);

ALTER TABLE public.plan_services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage plan_services" ON public.plan_services FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can view plan_services" ON public.plan_services FOR SELECT USING (auth.uid() IS NOT NULL);
