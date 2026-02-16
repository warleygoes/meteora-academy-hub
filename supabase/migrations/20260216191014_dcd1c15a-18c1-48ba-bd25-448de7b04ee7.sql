
-- Sales page configuration table
CREATE TABLE public.product_sales_pages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  active BOOLEAN NOT NULL DEFAULT false,
  slug TEXT NOT NULL,
  
  -- 1. Hero
  hero_headline TEXT,
  hero_subheadline TEXT,
  hero_context_line TEXT,
  hero_cta_text TEXT,
  hero_cta_link TEXT,
  hero_background_image TEXT,
  hero_video_url TEXT,
  hero_badge_text TEXT,
  hero_social_proof_micro TEXT,
  
  -- 2. Before vs After
  problem_title TEXT,
  transformation_title TEXT,
  before_points JSONB DEFAULT '[]'::jsonb,
  after_points JSONB DEFAULT '[]'::jsonb,
  
  -- 3. Micro social proof
  social_micro_number TEXT,
  social_micro_text TEXT,
  social_micro_badge TEXT,
  
  -- 4. Problem explanation
  problem_explanation_title TEXT,
  problem_explanation_text TEXT,
  problem_bullet_points JSONB DEFAULT '[]'::jsonb,
  
  -- 5. Deliverables
  program_name TEXT,
  program_format TEXT,
  program_duration TEXT,
  program_access_time TEXT,
  modules JSONB DEFAULT '[]'::jsonb,
  core_benefits JSONB DEFAULT '[]'::jsonb,
  
  -- 6. Deep social proof (testimonial IDs)
  selected_testimonials JSONB DEFAULT '[]'::jsonb,
  
  -- 7. Objections
  objections JSONB DEFAULT '[]'::jsonb,
  
  -- 8. Value anchoring
  anchor_items JSONB DEFAULT '[]'::jsonb,
  anchor_total_value TEXT,
  anchor_comparison_text TEXT,
  
  -- 9. Pricing
  price_display TEXT,
  price_original TEXT,
  price_installments TEXT,
  price_currency TEXT DEFAULT 'USD',
  price_stripe_link TEXT,
  price_highlight_text TEXT,
  
  -- 10. Bonuses
  bonuses JSONB DEFAULT '[]'::jsonb,
  
  -- 11. Guarantee
  guarantee_title TEXT,
  guarantee_description TEXT,
  guarantee_days INTEGER,
  guarantee_type TEXT,
  
  -- 12. Urgency
  urgency_type TEXT,
  urgency_text TEXT,
  urgency_date TIMESTAMP WITH TIME ZONE,
  urgency_spots_remaining INTEGER,
  countdown_enabled BOOLEAN DEFAULT false,
  
  -- 13. Final CTA
  final_cta_title TEXT,
  final_cta_text TEXT,
  final_cta_button_text TEXT,
  final_cta_link TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  CONSTRAINT unique_product_sales_page UNIQUE(product_id),
  CONSTRAINT unique_slug UNIQUE(slug)
);

-- Enable RLS
ALTER TABLE public.product_sales_pages ENABLE ROW LEVEL SECURITY;

-- Admins can manage
CREATE POLICY "Admins can manage product_sales_pages" ON public.product_sales_pages
FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Anyone can view active sales pages (public)
CREATE POLICY "Anyone can view active sales pages" ON public.product_sales_pages
FOR SELECT USING (active = true);

-- Trigger for updated_at
CREATE TRIGGER update_product_sales_pages_updated_at
BEFORE UPDATE ON public.product_sales_pages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
