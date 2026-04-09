
-- Add approval and lead qualification columns to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS approved boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS role_type text, -- 'owner' or 'employee'
ADD COLUMN IF NOT EXISTS country text,
ADD COLUMN IF NOT EXISTS client_count text,
ADD COLUMN IF NOT EXISTS network_type text, -- 'radio', 'fiber', 'both'
ADD COLUMN IF NOT EXISTS cheapest_plan_usd numeric,
ADD COLUMN IF NOT EXISTS main_problems text,
ADD COLUMN IF NOT EXISTS main_desires text,
ADD COLUMN IF NOT EXISTS company_name text,
ADD COLUMN IF NOT EXISTS phone text;
