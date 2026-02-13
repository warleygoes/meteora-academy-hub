
-- Add duration_days to packages for expiration calculation
ALTER TABLE public.packages ADD COLUMN IF NOT EXISTS duration_days integer DEFAULT NULL;
