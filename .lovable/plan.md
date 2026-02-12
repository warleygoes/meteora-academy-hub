

# Ajustes no Painel de Usuarios Aprovados

## 1. Botao "Redefinir Senha" na lista de aprovados

Adicionar um botao de redefinir senha na coluna de acoes da tabela de usuarios aprovados. Como a redefinicao de senha de outro usuario requer privilegios administrativos, sera necessario criar uma edge function que usa a service role key para enviar o email de reset.

**Edge function `reset-user-password`**:
- Recebe o `email` do usuario
- Valida que quem chama e admin (verificando o token JWT)
- Usa `supabase.auth.admin.generateLink({ type: 'recovery', email })` ou `supabase.auth.resetPasswordForEmail(email)` com a service role key
- Retorna sucesso/erro

**No frontend (AdminUsers.tsx)**:
- Adicionar icone `KeyRound` do lucide-react
- Novo botao na coluna de acoes dos aprovados que chama a edge function
- Toast de confirmacao/erro

## 2. Corrigir coluna "Planos Ativos"

A coluna "Planos Ativos" atualmente mostra o `cheapest_plan_usd` (preco do plano mais barato), que nao e o dado correto. O que se precisa e a quantidade numerica de planos ativos que o usuario possui.

**Novas tabelas no banco de dados**:

- **`plans`**: id, name, description, price, currency, active, created_at
  - Representa os planos comerciais (conjuntos de cursos com preco)
  - RLS: admins podem CRUD, usuarios autenticados podem SELECT

- **`user_plans`**: id, user_id, plan_id, status (active/cancelled/expired), starts_at, expires_at, created_at
  - Vincula usuarios a planos adquiridos
  - RLS: admins podem CRUD, usuarios podem ver os proprios

**No frontend**:
- Na tabela de aprovados, fazer uma query em `user_plans` contando planos com `status = 'active'` para cada usuario
- Exibir o numero (ex: "2" ou "0") em vez do preco

## 3. Habilitar gestao de admin funcional

O sistema de admin management ja existe parcialmente (dialog com addAdmin/removeAdmin). Ajustes necessarios:

- **Busca por email** em vez de display_name na funcao `addAdmin` (mais confiavel)
- **Adicionar botao "Tornar Admin"** diretamente na lista de usuarios aprovados (icone Shield)
- **Indicador visual** de quem ja e admin na lista (badge "Admin")
- Buscar roles junto com os perfis aprovados para saber quem ja e admin

## Arquivos a modificar

- `src/components/admin/AdminUsers.tsx` - Botao reset senha, corrigir active plans, botao tornar admin
- `src/lib/i18n.ts` - Traducoes para novos labels

## Arquivos a criar

- `supabase/functions/reset-user-password/index.ts` - Edge function para reset de senha
- Migration SQL para tabelas `plans` e `user_plans`

## Fluxo do Reset de Senha

1. Admin clica no botao "Redefinir Senha" na linha do usuario
2. Confirmacao via dialog/confirm
3. Chama edge function `reset-user-password` com o email do usuario
4. Edge function envia email de recuperacao ao usuario
5. Toast de sucesso informando que o email foi enviado

