
-- 1. Create product_type enum
CREATE TYPE public.product_type AS ENUM ('course', 'service', 'consultation', 'implementation', 'virtual_event', 'in_person_event');

-- 2. Create products table
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  type product_type NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  payment_type TEXT NOT NULL DEFAULT 'one_time',
  active BOOLEAN NOT NULL DEFAULT true,
  course_id UUID REFERENCES public.courses(id) ON DELETE SET NULL,
  thumbnail_url TEXT,
  thumbnail_vertical_url TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  _source_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Create packages table (replaces plans)
CREATE TABLE public.packages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  payment_type TEXT NOT NULL DEFAULT 'one_time',
  active BOOLEAN NOT NULL DEFAULT true,
  features TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Create offers table
CREATE TABLE public.offers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  package_id UUID REFERENCES public.packages(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Oferta Padrão',
  price NUMERIC NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  stripe_price_id TEXT,
  is_default BOOLEAN NOT NULL DEFAULT false,
  active BOOLEAN NOT NULL DEFAULT true,
  valid_from TIMESTAMPTZ,
  valid_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT offers_one_parent CHECK (
    (product_id IS NOT NULL AND package_id IS NULL) OR
    (product_id IS NULL AND package_id IS NOT NULL)
  )
);

-- 5. Create package_products junction
CREATE TABLE public.package_products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  package_id UUID NOT NULL REFERENCES public.packages(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(package_id, product_id)
);

-- 6. Migrate courses → products
INSERT INTO public.products (type, name, description, payment_type, active, course_id, thumbnail_url, thumbnail_vertical_url, sort_order, created_at, updated_at)
SELECT 'course'::product_type, title, description, 'one_time',
  CASE WHEN status = 'published' THEN true ELSE false END,
  id, thumbnail_url, thumbnail_vertical_url, sort_order, created_at, updated_at
FROM public.courses;

-- 7. Migrate services → products (with _source_id for later mapping)
INSERT INTO public.products (type, name, description, payment_type, active, _source_id, created_at)
SELECT 'service'::product_type, title, description, payment_type, active, id, created_at
FROM public.services;

-- 8. Migrate plans → packages (preserving IDs!)
INSERT INTO public.packages (id, name, description, payment_type, active, features, created_at)
SELECT id, name, description, payment_type, active, features, created_at
FROM public.plans;

-- 9. Create default offers for course products
INSERT INTO public.offers (product_id, name, price, currency, is_default, active)
SELECT p.id, 'Oferta Padrão', 0, 'USD', true, true
FROM public.products p WHERE p.type = 'course';

-- 10. Create default offers for service products
INSERT INTO public.offers (product_id, name, price, currency, is_default, active)
SELECT p.id, 'Oferta Padrão', s.price, s.currency, true, true
FROM public.products p
JOIN public.services s ON s.id = p._source_id
WHERE p.type = 'service';

-- 11. Create default offers for packages (from plans)
INSERT INTO public.offers (package_id, name, price, currency, stripe_price_id, is_default, active)
SELECT id, 'Oferta Padrão', price, currency, stripe_price_id, true, true
FROM public.plans;

-- 12. Migrate plan_courses → package_products
INSERT INTO public.package_products (package_id, product_id)
SELECT pc.plan_id, p.id
FROM public.plan_courses pc
JOIN public.products p ON p.course_id = pc.course_id
ON CONFLICT DO NOTHING;

-- 13. Migrate plan_services → package_products
INSERT INTO public.package_products (package_id, product_id)
SELECT ps.plan_id, p.id
FROM public.plan_services ps
JOIN public.products p ON p._source_id = ps.service_id AND p.type = 'service'
ON CONFLICT DO NOTHING;

-- 14. Drop temp column
ALTER TABLE public.products DROP COLUMN _source_id;

-- 15. Update user_plans: plan_id → package_id referencing packages
ALTER TABLE public.user_plans DROP CONSTRAINT IF EXISTS user_plans_plan_id_fkey;
ALTER TABLE public.user_plans RENAME COLUMN plan_id TO package_id;
ALTER TABLE public.user_plans ADD CONSTRAINT user_plans_package_id_fkey FOREIGN KEY (package_id) REFERENCES public.packages(id) ON DELETE CASCADE;

-- 16. Update plan_meetings: plan_id → package_id referencing packages
ALTER TABLE public.plan_meetings DROP CONSTRAINT IF EXISTS plan_meetings_plan_id_fkey;
ALTER TABLE public.plan_meetings RENAME COLUMN plan_id TO package_id;
ALTER TABLE public.plan_meetings ADD CONSTRAINT plan_meetings_package_id_fkey FOREIGN KEY (package_id) REFERENCES public.packages(id) ON DELETE CASCADE;

-- 17. RLS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.package_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage products" ON public.products FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can view active products" ON public.products FOR SELECT USING (auth.uid() IS NOT NULL AND active = true);

CREATE POLICY "Admins can manage offers" ON public.offers FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can view active offers" ON public.offers FOR SELECT USING (auth.uid() IS NOT NULL AND active = true);

CREATE POLICY "Admins can manage packages" ON public.packages FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can view active packages" ON public.packages FOR SELECT USING (auth.uid() IS NOT NULL AND active = true);

CREATE POLICY "Admins can manage package_products" ON public.package_products FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can view package_products" ON public.package_products FOR SELECT USING (auth.uid() IS NOT NULL);

-- 18. Triggers
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_packages_updated_at BEFORE UPDATE ON public.packages FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
