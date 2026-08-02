-- Database RPC function for admins to reset any user's password directly in auth.users
CREATE OR REPLACE FUNCTION public.admin_reset_user_password(target_email text, new_password text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'auth', 'extensions'
AS $$
DECLARE
  v_caller_id uuid;
  v_is_admin boolean;
  v_user_id uuid;
BEGIN
  -- Verify caller is authenticated
  v_caller_id := auth.uid();
  IF v_caller_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Não autorizado: faça login como administrador');
  END IF;

  -- Check if caller has admin role
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = v_caller_id AND role = 'admin'
  ) INTO v_is_admin;

  IF NOT v_is_admin THEN
    RETURN jsonb_build_object('success', false, 'error', 'Permissão negada: apenas administradores');
  END IF;

  -- Search for user in auth.users by email
  SELECT id INTO v_user_id FROM auth.users WHERE LOWER(email) = LOWER(TRIM(target_email));

  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'USER_NOT_FOUND_IN_AUTH');
  END IF;

  -- Update encrypted_password in auth.users using bcrypt (extensions.crypt)
  UPDATE auth.users
  SET encrypted_password = extensions.crypt(new_password, extensions.gen_salt('bf')),
      updated_at = now(),
      email_confirmed_at = COALESCE(email_confirmed_at, now())
  WHERE id = v_user_id;

  RETURN jsonb_build_object('success', true, 'user_id', v_user_id);
END;
$$;

-- Grant execution permission to authenticated users (function checks admin role internally)
GRANT EXECUTE ON FUNCTION public.admin_reset_user_password(text, text) TO authenticated;
