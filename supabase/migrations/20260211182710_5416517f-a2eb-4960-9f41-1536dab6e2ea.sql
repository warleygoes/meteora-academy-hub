
-- 1. Add input validation constraints
ALTER TABLE public.profiles
  ADD CONSTRAINT phone_length CHECK (length(phone) <= 20),
  ADD CONSTRAINT company_name_length CHECK (length(company_name) <= 200),
  ADD CONSTRAINT display_name_length CHECK (length(display_name) <= 100),
  ADD CONSTRAINT bio_length CHECK (length(bio) <= 500),
  ADD CONSTRAINT main_problems_length CHECK (length(main_problems) <= 2000),
  ADD CONSTRAINT main_desires_length CHECK (length(main_desires) <= 2000),
  ADD CONSTRAINT valid_role_type CHECK (role_type IS NULL OR role_type IN ('owner', 'employee')),
  ADD CONSTRAINT valid_network_type CHECK (network_type IS NULL OR network_type IN ('radio', 'fiber', 'both'));

-- 2. Add DELETE policy for GDPR compliance
CREATE POLICY "Users can delete own profile"
  ON public.profiles FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- 3. Update handle_new_user trigger to extract qualification data from metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (
    user_id,
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
$$;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
