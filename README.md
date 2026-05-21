# Meteora Academy Hub

Portal de membros da Meteora Academy — plataforma de cursos, comunidade e conteúdo exclusivo para alunos.

## Funcionalidades

- **Minha Biblioteca** — catálogo de cursos e produtos com filtros por categoria e tipo
- **Player de vídeo** — suporte a YouTube, Vimeo, Adilo, Panda Video, Google Drive e arquivos nativos (mp4, webm, etc.)
- **Progresso de aulas** — rastreamento de lições concluídas por aluno
- **Comunidade** — fórum de discussão por curso
- **Live Meetings** — agenda de encontros ao vivo
- **Diagnósticos** — formulários e resultados de diagnóstico personalizados
- **Painel Admin** — gestão de usuários, cursos, produtos, pacotes, banners, comentários, links e API
- **Multiidioma** — interface em Português, Inglês e Espanhol
- **Autenticação** — login por e-mail/senha e magic link via Supabase Auth

## Stack

- [React 18](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vitejs.dev/) — build e dev server
- [React Router v6](https://reactrouter.com/) — roteamento client-side
- [Tailwind CSS](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/) — estilização e componentes
- [Supabase](https://supabase.com/) — banco de dados (PostgreSQL), autenticação, storage e Edge Functions
- [React Query](https://tanstack.com/query) — cache e sincronização de dados do servidor
- [Framer Motion](https://www.framer.com/motion/) — animações

## Instalação e uso local

Requisito: [Node.js](https://nodejs.org/) 18+ e npm.

```sh
# 1. Clone o repositório
git clone <YOUR_GIT_URL>

# 2. Entre no diretório
cd meteora-academy-hub

# 3. Instale as dependências
npm install

# 4. Configure as variáveis de ambiente
cp .env.example .env
# Preencha VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY

# 5. Inicie o servidor de desenvolvimento
npm run dev
```

## Scripts disponíveis

| Comando | Descrição |
|---|---|
| `npm run dev` | Inicia o servidor de desenvolvimento |
| `npm run build` | Gera o build de produção em `dist/` |
| `npm run preview` | Serve o build de produção localmente |

## Estrutura principal

```
src/
├── components/       # Componentes reutilizáveis (Layout, Sidebar, VideoPlayer, etc.)
│   └── admin/        # Componentes exclusivos do painel admin
├── contexts/         # Context API (idioma)
├── hooks/            # Hooks personalizados (auth, dados, tradução)
├── pages/            # Páginas da aplicação (roteadas pelo React Router)
├── integrations/     # Cliente e tipos do Supabase
└── lib/              # Utilitários e internacionalização
```
