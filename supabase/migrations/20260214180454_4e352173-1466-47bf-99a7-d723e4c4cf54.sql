
-- Table for custom menu links
CREATE TABLE public.menu_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT 'link',
  url TEXT NOT NULL,
  open_mode TEXT NOT NULL DEFAULT 'same_tab',
  sort_order INT NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Junction: packages
CREATE TABLE public.menu_link_packages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  menu_link_id UUID NOT NULL REFERENCES public.menu_links(id) ON DELETE CASCADE,
  package_id UUID NOT NULL REFERENCES public.packages(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(menu_link_id, package_id)
);

-- Junction: products
CREATE TABLE public.menu_link_products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  menu_link_id UUID NOT NULL REFERENCES public.menu_links(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(menu_link_id, product_id)
);

-- RLS
ALTER TABLE public.menu_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_link_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_link_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read menu_links" ON public.menu_links FOR SELECT USING (true);
CREATE POLICY "Anyone can read menu_link_packages" ON public.menu_link_packages FOR SELECT USING (true);
CREATE POLICY "Anyone can read menu_link_products" ON public.menu_link_products FOR SELECT USING (true);

CREATE POLICY "Admins manage menu_links" ON public.menu_links FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage menu_link_packages" ON public.menu_link_packages FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage menu_link_products" ON public.menu_link_products FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_menu_links_updated_at
  BEFORE UPDATE ON public.menu_links
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
