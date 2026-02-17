-- Create new diagnostic system tables

-- 1. Diagnostic Questions
CREATE TABLE public.diagnostic_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    section TEXT NOT NULL, -- 'technical', 'financial', 'scale', 'expansion', 'commitment'
    type TEXT NOT NULL, -- 'scale', 'likert', 'single_choice', 'multiple_choice'
    question_text TEXT NOT NULL,
    description TEXT,
    options JSONB DEFAULT '[]'::jsonb, -- Array of {label, value/score}
    weight NUMERIC DEFAULT 1.0,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS for questions
ALTER TABLE public.diagnostic_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view diagnostic questions" ON public.diagnostic_questions FOR SELECT USING (true);
CREATE POLICY "Admins can manage diagnostic questions" ON public.diagnostic_questions FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- 2. Diagnostic Recommendation Rules
CREATE TABLE public.diagnostic_recommendation_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    condition_field TEXT NOT NULL, -- 'technical_score', 'financial_score', etc.
    condition_operator TEXT NOT NULL, -- '<', '>', '=', '>='
    condition_value NUMERIC NOT NULL,
    recommended_product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    priority INTEGER DEFAULT 0,
    title TEXT,
    description TEXT,
    cta_text TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS for rules
ALTER TABLE public.diagnostic_recommendation_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view diagnostic rules" ON public.diagnostic_recommendation_rules FOR SELECT USING (true);
CREATE POLICY "Admins can manage diagnostic rules" ON public.diagnostic_recommendation_rules FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- 3. Update Existing Diagnostics Table (Keep for backward compatibility but add columns for scores)
ALTER TABLE public.diagnostics 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS scores JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS results JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';

-- 4. Create Diagnostic Answers (Atomic responses)
CREATE TABLE public.diagnostic_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    diagnostic_id UUID REFERENCES public.diagnostics(id) ON DELETE CASCADE,
    question_id UUID REFERENCES public.diagnostic_questions(id) ON DELETE CASCADE,
    answer_value JSONB NOT NULL,
    score_contribution NUMERIC DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS for answers
ALTER TABLE public.diagnostic_answers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view all diagnostic answers" ON public.diagnostic_answers FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Anyone can insert diagnostic answers" ON public.diagnostic_answers FOR INSERT WITH CHECK (true);

-- 5. WhatsApp Config in platform_settings (ensure key exists)
INSERT INTO public.platform_settings (key, value)
VALUES ('whatsapp_advisor_url', 'https://wa.me/5500000000000')
ON CONFLICT (key) DO NOTHING;

-- Trigger to update updated_at
CREATE TRIGGER update_diagnostic_questions_updated_at
BEFORE UPDATE ON public.diagnostic_questions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
