-- Backfill para vincular diagnosticos antigos aos usuarios pelo email.
-- Rode primeiro os SELECTs de preview. Se o resultado fizer sentido, rode o UPDATE.

-- 1) Preview: diagnosticos sem user_id que possuem um profile com o mesmo email.
select
  d.id as diagnostic_id,
  d.email as diagnostic_email,
  p.user_id,
  p.email as profile_email,
  d.created_at
from public.diagnostics d
join public.profiles p
  on lower(trim(p.email)) = lower(trim(d.email))
where d.user_id is null
order by d.created_at desc;

-- 2) Preview: emails duplicados em profiles. Se retornar linhas, revise antes de atualizar.
select
  lower(trim(email)) as email,
  count(*) as total_profiles,
  array_agg(user_id order by created_at desc) as user_ids
from public.profiles
where email is not null and trim(email) <> ''
group by lower(trim(email))
having count(*) > 1
order by total_profiles desc, email;

-- 3) Update: preenche diagnostics.user_id usando profiles.email.
-- Mantem diagnosticos ja vinculados intactos e ignora emails duplicados em profiles.
with unique_profiles as (
  select
    lower(trim(email)) as normalized_email,
    (array_agg(user_id))[1] as user_id
  from public.profiles
  where email is not null and trim(email) <> ''
  group by lower(trim(email))
  having count(*) = 1
)
update public.diagnostics d
set user_id = up.user_id
from unique_profiles up
where d.user_id is null
  and d.email is not null
  and lower(trim(d.email)) = up.normalized_email;

-- 3.1) Preview: diagnosticos que continuam sem vinculo por email duplicado em profiles.
select
  d.id as diagnostic_id,
  d.email as diagnostic_email,
  count(p.user_id) as matching_profiles
from public.diagnostics d
join public.profiles p
  on lower(trim(p.email)) = lower(trim(d.email))
where d.user_id is null
group by d.id, d.email
having count(p.user_id) > 1
order by matching_profiles desc, d.email;

-- 4) Conferencia depois do update.
select
  count(*) filter (where user_id is not null) as diagnostics_vinculados,
  count(*) filter (where user_id is null) as diagnostics_sem_vinculo,
  count(*) as total_diagnostics
from public.diagnostics;

-- Observacao:
-- Este script cria o vinculo diagnostico -> usuario. Ele nao recria linhas em
-- public.diagnostic_answers quando o diagnostico antigo nunca salvou respostas atomicas.
-- Nesses casos, a aplicacao passa a exibir os campos legados disponiveis no proprio diagnostico.
