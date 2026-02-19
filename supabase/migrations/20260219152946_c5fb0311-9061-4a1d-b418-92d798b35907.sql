-- Add multi-condition support to recommendation rules
ALTER TABLE public.diagnostic_recommendation_rules 
  ADD COLUMN IF NOT EXISTS conditions jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS conditions_logic text NOT NULL DEFAULT 'and',
  ADD COLUMN IF NOT EXISTS recommended_product_ids uuid[] DEFAULT '{}'::uuid[],
  ADD COLUMN IF NOT EXISTS recommended_package_ids uuid[] DEFAULT '{}'::uuid[];

-- Migrate existing single conditions to the new conditions array
UPDATE public.diagnostic_recommendation_rules 
SET conditions = jsonb_build_array(jsonb_build_object(
  'field', condition_field,
  'operator', condition_operator,
  'value', condition_value
))
WHERE (conditions = '[]'::jsonb) AND condition_field IS NOT NULL;

-- Migrate existing single product to array
UPDATE public.diagnostic_recommendation_rules
SET recommended_product_ids = ARRAY[recommended_product_id]
WHERE recommended_product_id IS NOT NULL AND recommended_product_ids = '{}'::uuid[];

-- Add field_key to questions for identifying objective data fields
ALTER TABLE public.diagnostic_questions
  ADD COLUMN IF NOT EXISTS field_key text;