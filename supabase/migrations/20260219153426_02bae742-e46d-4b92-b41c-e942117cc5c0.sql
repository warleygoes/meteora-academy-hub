-- Add CTA configuration to recommendation rules
ALTER TABLE public.diagnostic_recommendation_rules
  ADD COLUMN IF NOT EXISTS cta_type text DEFAULT 'custom_url',
  ADD COLUMN IF NOT EXISTS cta_url text;

-- Add CTA configuration to products
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS cta_type text DEFAULT 'direct_purchase',
  ADD COLUMN IF NOT EXISTS cta_url text;

-- Add CTA configuration to packages
ALTER TABLE public.packages
  ADD COLUMN IF NOT EXISTS cta_type text DEFAULT 'direct_purchase',
  ADD COLUMN IF NOT EXISTS cta_url text;