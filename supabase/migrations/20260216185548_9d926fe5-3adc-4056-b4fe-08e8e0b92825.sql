
-- Add SaaS advanced fields to products table
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS trial_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS trial_days integer DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS recurring_type text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS features_list jsonb DEFAULT '[]'::jsonb;

-- Add comment for documentation
COMMENT ON COLUMN public.products.trial_enabled IS 'Whether this SaaS product offers a free trial';
COMMENT ON COLUMN public.products.trial_days IS 'Number of days for the free trial period';
COMMENT ON COLUMN public.products.recurring_type IS 'Type of recurring billing: monthly, quarterly, semi_annual, annual';
COMMENT ON COLUMN public.products.features_list IS 'JSON array of feature strings included in this product';
