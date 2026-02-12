

# Pagina de Diagnostico ISP (`/diagnostico`)

## Resumo
Criar uma pagina publica dedicada ao formulario de diagnostico do ISP, acessivel em `/diagnostico`. O formulario coleta informacoes estrategicas do provedor e envia os dados para processamento.

## Estrutura da Pagina

A pagina tera o mesmo estilo visual da landing page (dark, com logo Meteora, animacoes framer-motion) e contera:

1. **Header simples** - Logo + botao voltar para home
2. **Titulo e contexto** - Explicacao breve do diagnostico
3. **Formulario multi-step** (3 etapas):
   - **Etapa 1 - Dados Pessoais**: Nome, Email, Telefone (com validacao internacional), Pais (LATAM)
   - **Etapa 2 - Dados do ISP**: Nome da empresa, Cargo (dono/funcionario), Numero de clientes, Tipo de rede (fibra/radio/hibrido), Ticket medio / preco do plano mais barato
   - **Etapa 3 - Situacao Atual**: Principais problemas atuais (textarea), Nivel de conhecimento tecnico do gestor (select), Objetivos principais (textarea)
4. **Tela de sucesso** - Confirmacao com mensagem de proximo contato

## Detalhes Tecnicos

### Arquivos a criar:
- `src/pages/Diagnostico.tsx` - Pagina com formulario multi-step

### Arquivos a modificar:
- `src/App.tsx` - Adicionar rota publica `/diagnostico`
- `src/lib/i18n.ts` - Adicionar traducoes PT/ES/EN para todos os campos do formulario

### Banco de dados:
- Criar tabela `diagnostics` para armazenar as respostas com campos: id, name, email, phone, country, company_name, role_type, client_count, network_type, cheapest_plan, main_problems, tech_knowledge, main_goals, created_at
- RLS: permitir INSERT para anon (formulario publico), SELECT apenas para admins

### Edge Function (opcional):
- Reaproveitar o padrao do `notify-new-registration` para notificar via webhook quando um diagnostico e preenchido

### Padroes reutilizados:
- Mesmo estilo de formulario multi-step do `Login.tsx` (steps com barra de progresso)
- Mesma lista `LATAM_COUNTRIES` do Login
- Validacao de telefone identica ao Login
- Animacoes `fadeUp` do framer-motion
- Componentes UI existentes (Input, Button, Textarea)
- Sistema i18n com 3 idiomas

