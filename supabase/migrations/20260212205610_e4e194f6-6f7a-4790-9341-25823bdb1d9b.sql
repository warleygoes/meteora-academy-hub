
CREATE TABLE public.user_products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, product_id)
);

ALTER TABLE public.user_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage user_products" ON public.user_products FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can view own products" ON public.user_products FOR SELECT USING (auth.uid() = user_id);
