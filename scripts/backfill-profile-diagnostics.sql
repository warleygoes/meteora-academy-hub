-- Backfill para criar diagnosticos a partir de respostas antigas salvas em profiles.
-- Use este script quando o usuario tem main_problems/main_desires no cadastro,
-- mas nao existe uma linha correspondente em public.diagnostics.

-- 1) Preview: profiles com dados de diagnostico legado e sem diagnostic vinculado.
select
  p.user_id,
  p.email,
  p.display_name,
  p.company_name,
  p.main_problems,
  p.main_desires,
  p.created_at
from public.profiles p
where (
    nullif(trim(coalesce(p.main_problems, '')), '') is not null
    or nullif(trim(coalesce(p.main_desires, '')), '') is not null
  )
  and not exists (
    select 1
    from public.diagnostics d
    where d.user_id = p.user_id
       or (
         d.email is not null
         and p.email is not null
         and lower(trim(d.email)) = lower(trim(p.email))
       )
  )
order by p.created_at desc;

-- 2) Insert: cria um diagnostic legado para cada profile encontrado no preview.
insert into public.diagnostics (
  user_id,
  name,
  email,
  phone,
  country,
  company_name,
  role_type,
  client_count,
  network_type,
  cheapest_plan,
  main_problems,
  main_goals,
  status,
  scores,
  results,
  created_at
)
select
  p.user_id,
  coalesce(nullif(trim(p.display_name), ''), p.email, 'Usuario') as name,
  p.email,
  p.phone,
  p.country,
  p.company_name,
  p.role_type,
  p.client_count,
  p.network_type,
  p.cheapest_plan_usd,
  p.main_problems,
  p.main_desires,
  'completed',
  '{}'::jsonb,
  jsonb_build_object('source', 'legacy_profile_backfill'),
  coalesce(p.created_at, now())
from public.profiles p
where p.email is not null
  and (
    nullif(trim(coalesce(p.main_problems, '')), '') is not null
    or nullif(trim(coalesce(p.main_desires, '')), '') is not null
  )
  and not exists (
    select 1
    from public.diagnostics d
    where d.user_id = p.user_id
       or (
         d.email is not null
         and lower(trim(d.email)) = lower(trim(p.email))
       )
  );

-- 3) Conferencia.
select
  count(*) filter (where results->>'source' = 'legacy_profile_backfill') as diagnostics_criados_do_profile,
  count(*) as total_diagnostics
from public.diagnostics;

-- Observacao:
-- Este script cria o registro em diagnostics para que a modal exiba "Diagnostico - 1 vinculado".
-- Ele nao cria diagnostic_answers porque esses usuarios antigos nao possuem respostas atomicas
-- por pergunta. A aplicacao exibe main_problems/main_goals dentro do acordeon legado.
