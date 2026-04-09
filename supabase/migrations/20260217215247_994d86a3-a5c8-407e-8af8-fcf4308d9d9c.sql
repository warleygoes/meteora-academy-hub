
-- Create diagnostic lead tracking table
CREATE TABLE public.diagnostic_lead_tracking (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  diagnostic_id uuid NOT NULL REFERENCES public.diagnostics(id) ON DELETE CASCADE,
  lead_temperature text NOT NULL DEFAULT 'cold',
  commercial_status text NOT NULL DEFAULT 'new',
  assigned_advisor text,
  recommended_product_auto text,
  assigned_level_auto text,
  last_action text,
  last_action_at timestamp with time zone,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(diagnostic_id)
);

-- Enable RLS
ALTER TABLE public.diagnostic_lead_tracking ENABLE ROW LEVEL SECURITY;

-- Admin-only policies
CREATE POLICY "Admins can manage lead tracking"
  ON public.diagnostic_lead_tracking
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_diagnostic_lead_tracking_updated_at
  BEFORE UPDATE ON public.diagnostic_lead_tracking
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
