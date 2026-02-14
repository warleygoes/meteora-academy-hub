
-- Add independent payment link toggles for Stripe and Hotmart
ALTER TABLE public.offers ADD COLUMN IF NOT EXISTS stripe_link_active boolean NOT NULL DEFAULT false;
ALTER TABLE public.offers ADD COLUMN IF NOT EXISTS hotmart_link_active boolean NOT NULL DEFAULT false;

-- Migrate existing data: if payment_link_active was true, set both to true where links exist
UPDATE public.offers SET 
  stripe_link_active = CASE WHEN payment_link_active = true AND stripe_price_id IS NOT NULL AND stripe_price_id != '' THEN true ELSE false END,
  hotmart_link_active = CASE WHEN payment_link_active = true AND hotmart_url IS NOT NULL AND hotmart_url != '' THEN true ELSE false END;
