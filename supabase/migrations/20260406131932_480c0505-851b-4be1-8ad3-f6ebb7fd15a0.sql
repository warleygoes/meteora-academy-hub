
-- Update courses policy to allow access via packages or direct product ownership
DROP POLICY IF EXISTS "Users can view published courses" ON public.courses;
CREATE POLICY "Users can view accessible courses" ON public.courses
FOR SELECT TO authenticated
USING (
  (status = 'published')
  OR
  EXISTS (
    SELECT 1 FROM public.user_plans up
    JOIN public.package_products pp ON pp.package_id = up.package_id
    JOIN public.products p ON p.id = pp.product_id
    WHERE up.user_id = auth.uid()
      AND up.status = 'active'
      AND p.course_id = courses.id
  )
  OR
  EXISTS (
    SELECT 1 FROM public.user_products upr
    JOIN public.products p ON p.id = upr.product_id
    WHERE upr.user_id = auth.uid()
      AND p.course_id = courses.id
  )
);

-- Update course_modules policy to match
DROP POLICY IF EXISTS "Users can view modules of published courses" ON public.course_modules;
CREATE POLICY "Users can view modules of accessible courses" ON public.course_modules
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.courses c
    WHERE c.id = course_modules.course_id
      AND c.status = 'published'
  )
  OR
  EXISTS (
    SELECT 1 FROM public.user_plans up
    JOIN public.package_products pp ON pp.package_id = up.package_id
    JOIN public.products p ON p.id = pp.product_id
    WHERE up.user_id = auth.uid()
      AND up.status = 'active'
      AND p.course_id = course_modules.course_id
  )
  OR
  EXISTS (
    SELECT 1 FROM public.user_products upr
    JOIN public.products p ON p.id = upr.product_id
    WHERE upr.user_id = auth.uid()
      AND p.course_id = course_modules.course_id
  )
);
