-- =============================================================================
-- SCRIPT DE IMPORTAÇÃO COMPLETA DE USUÁRIOS - Supabase Self-Hosted
-- =============================================================================
-- Este script importa auth.users (com senhas), public.profiles e public.user_roles
-- 
-- INSTRUÇÕES:
-- 1. Exporte os usuários via painel Admin > Exportar Usuários (JSON)
-- 2. Exporte profiles e user_roles via Admin > Banco de Dados > Somente Dados
-- 3. Substitua os placeholders abaixo pelos dados reais
-- 4. Execute este script no banco do Supabase self-hosted como superuser
-- =============================================================================

-- Desabilitar triggers temporariamente para evitar conflitos
-- (ex: trigger handle_new_user que cria profiles automaticamente)
SET session_replication_role = 'replica';

-- =============================================================================
-- PARTE 1: IMPORTAR auth.users (com senhas bcrypt)
-- =============================================================================
-- IMPORTANTE: Execute como superuser (postgres) no banco de destino
-- O campo encrypted_password contém o hash bcrypt exportado

-- Exemplo de INSERT para auth.users:
-- Substitua pelos dados reais do export JSON

/*
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  invited_at,
  confirmation_token,
  confirmation_sent_at,
  recovery_token,
  recovery_sent_at,
  email_change_token_new,
  email_change,
  email_change_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  created_at,
  updated_at,
  phone,
  phone_confirmed_at,
  phone_change,
  phone_change_token,
  phone_change_sent_at,
  email_change_token_current,
  email_change_confirm_status,
  banned_until,
  reauthentication_token,
  reauthentication_sent_at,
  is_sso_user,
  deleted_at
) VALUES
-- ======= COLE AQUI OS DADOS DOS USUÁRIOS =======
-- Formato por usuário:
(
  '00000000-0000-0000-0000-000000000000',  -- instance_id (use este valor padrão)
  'USER_UUID_AQUI',                         -- id (uuid do usuário)
  'authenticated',                          -- aud
  'authenticated',                          -- role
  'email@exemplo.com',                      -- email
  '$2a$10$HASH_BCRYPT_AQUI',               -- encrypted_password (hash bcrypt do export)
  NOW(),                                    -- email_confirmed_at (confirmar email)
  NULL,                                     -- invited_at
  '',                                       -- confirmation_token
  NULL,                                     -- confirmation_sent_at
  '',                                       -- recovery_token
  NULL,                                     -- recovery_sent_at
  '',                                       -- email_change_token_new
  '',                                       -- email_change
  NULL,                                     -- email_change_sent_at
  NULL,                                     -- last_sign_in_at
  '{"provider": "email", "providers": ["email"]}',  -- raw_app_meta_data
  '{"display_name": "Nome do Usuário"}',    -- raw_user_meta_data
  FALSE,                                    -- is_super_admin
  '2025-01-01T00:00:00Z',                  -- created_at (data original)
  '2025-01-01T00:00:00Z',                  -- updated_at
  NULL,                                     -- phone
  NULL,                                     -- phone_confirmed_at
  '',                                       -- phone_change
  '',                                       -- phone_change_token
  NULL,                                     -- phone_change_sent_at
  '',                                       -- email_change_token_current
  0,                                        -- email_change_confirm_status
  NULL,                                     -- banned_until
  '',                                       -- reauthentication_token
  NULL,                                     -- reauthentication_sent_at
  FALSE,                                    -- is_sso_user
  NULL                                      -- deleted_at
)
-- , (próximo usuário...)
ON CONFLICT (id) DO NOTHING;
*/

-- =============================================================================
-- PARTE 2: CRIAR IDENTITIES (obrigatório para login funcionar)
-- =============================================================================
-- Cada usuário precisa de um registro em auth.identities para conseguir logar

/*
INSERT INTO auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  provider_id,
  last_sign_in_at,
  created_at,
  updated_at
) VALUES
(
  gen_random_uuid(),
  'USER_UUID_AQUI',                         -- mesmo id do auth.users
  jsonb_build_object(
    'sub', 'USER_UUID_AQUI',
    'email', 'email@exemplo.com',
    'email_verified', true
  ),
  'email',
  'USER_UUID_AQUI',                         -- provider_id = user_id para email
  NOW(),
  '2025-01-01T00:00:00Z',
  '2025-01-01T00:00:00Z'
)
-- , (próximo usuário...)
ON CONFLICT (provider, provider_id) DO NOTHING;
*/

-- =============================================================================
-- PARTE 3: IMPORTAR public.profiles
-- =============================================================================
-- Cole aqui os INSERTs exportados da tabela profiles
-- Exemplo:

/*
INSERT INTO public.profiles (
  id, user_id, email, display_name, role_type, company_name, country,
  phone, client_count, network_type, cheapest_plan_usd, main_problems,
  main_desires, bio, avatar_url, cpf, gender, birth_date, observations,
  approved, status, created_at, updated_at
) VALUES
(
  'PROFILE_UUID',
  'USER_UUID_AQUI',
  'email@exemplo.com',
  'Nome do Usuário',
  'isp_owner',
  'Empresa LTDA',
  'BR',
  '+5511999999999',
  '100-500',
  'fiber',
  49.90,
  'Problemas descritos',
  'Desejos descritos',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  true,
  'active',
  '2025-01-01T00:00:00Z',
  '2025-01-01T00:00:00Z'
)
-- , (próximo profile...)
ON CONFLICT (user_id) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  company_name = EXCLUDED.company_name,
  country = EXCLUDED.country,
  phone = EXCLUDED.phone,
  role_type = EXCLUDED.role_type,
  updated_at = NOW();
*/

-- =============================================================================
-- PARTE 4: IMPORTAR public.user_roles
-- =============================================================================
-- Cole aqui os INSERTs exportados da tabela user_roles

/*
INSERT INTO public.user_roles (id, user_id, role) VALUES
('ROLE_UUID', 'USER_UUID_AQUI', 'admin')
-- , (próximo role...)
ON CONFLICT (user_id, role) DO NOTHING;
*/

-- =============================================================================
-- PARTE 5: REATIVAR TRIGGERS
-- =============================================================================
SET session_replication_role = 'origin';

-- =============================================================================
-- VERIFICAÇÃO PÓS-IMPORTAÇÃO
-- =============================================================================
-- Execute estas queries para validar:

-- Contar usuários importados
SELECT 'auth.users' AS tabela, COUNT(*) AS total FROM auth.users
UNION ALL
SELECT 'profiles', COUNT(*) FROM public.profiles
UNION ALL
SELECT 'user_roles', COUNT(*) FROM public.user_roles
UNION ALL
SELECT 'identities', COUNT(*) FROM auth.identities;

-- Verificar usuários sem identity (não vão conseguir logar!)
SELECT u.id, u.email
FROM auth.users u
LEFT JOIN auth.identities i ON i.user_id = u.id
WHERE i.id IS NULL;

-- Verificar usuários sem profile
SELECT u.id, u.email
FROM auth.users u
LEFT JOIN public.profiles p ON p.user_id = u.id
WHERE p.id IS NULL;
