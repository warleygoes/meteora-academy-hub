-- Function to check if email exists (callable by anon users during signup)
CREATE OR REPLACE FUNCTION public.check_email_exists(check_email text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE LOWER(email) = LOWER(check_email)
  )
$$;