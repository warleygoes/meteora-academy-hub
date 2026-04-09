
CREATE TABLE public.diagnostics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  country TEXT,
  company_name TEXT,
  role_type TEXT,
  client_count TEXT,
  network_type TEXT,
  cheapest_plan NUMERIC,
  main_problems TEXT,
  tech_knowledge TEXT,
  main_goals TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.diagnostics ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts (public form)
CREATE POLICY "Anyone can insert diagnostics"
ON public.diagnostics
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Only admins can view
CREATE POLICY "Admins can view diagnostics"
ON public.diagnostics
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Only admins can delete
CREATE POLICY "Admins can delete diagnostics"
ON public.diagnostics
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'::app_role));
