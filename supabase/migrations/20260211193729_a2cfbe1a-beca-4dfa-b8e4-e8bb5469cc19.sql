-- Add email column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email text;

-- Update handle_new_user to store email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (
    user_id,
    email,
    display_name,
    role_type,
    company_name,
    country,
    phone,
    client_count,
    network_type,
    cheapest_plan_usd,
    main_problems,
    main_desires
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email),
    NEW.raw_user_meta_data->>'role_type',
    NEW.raw_user_meta_data->>'company_name',
    NEW.raw_user_meta_data->>'country',
    NEW.raw_user_meta_data->>'phone',
    NEW.raw_user_meta_data->>'client_count',
    NEW.raw_user_meta_data->>'network_type',
    NULLIF(NEW.raw_user_meta_data->>'cheapest_plan_usd', '')::numeric,
    NEW.raw_user_meta_data->>'main_problems',
    NEW.raw_user_meta_data->>'main_desires'
  );
  RETURN NEW;
END;
$function$;

-- Backfill existing profiles with email from auth.users
UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE p.user_id = u.id AND p.email IS NULL;