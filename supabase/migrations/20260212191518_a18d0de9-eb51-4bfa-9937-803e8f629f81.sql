
-- Add has_content flag to products table
ALTER TABLE public.products ADD COLUMN has_content boolean NOT NULL DEFAULT false;

-- Set has_content = true for existing course products
UPDATE public.products SET has_content = true WHERE type = 'course';
