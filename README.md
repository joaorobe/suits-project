# Suits

Sistema web para gerenciamento de aluguel de trajes, inventário, pagamentos, devoluções e pedidos de ajuste/costura.

O projeto foi desenvolvido com Next.js, React, Tailwind CSS e PostgreSQL. Também possui configuração PWA para uso em celular.

## Funcionalidades

- Login com perfis de administrador e costureira.
- Dashboard com métricas e atividades recentes.
- Controle de inventário de trajes.
- Registro de reservas e pagamentos.
- Gestão de devoluções e lavanderia.
- Envio de trajes para ajuste/costura.
- Painel da costureira com status dos pedidos.
- Configurações com alternância entre tema claro e escuro.
- Suporte PWA para instalação no celular.

## Tecnologias

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS
- PostgreSQL
- `pg`
- `qrcode`
- `react-icons`

## Requisitos

- Node.js instalado
- npm instalado
- Banco PostgreSQL disponível

## Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto com:

```env
DATABASE_URL=postgres://usuario:senha@host:porta/banco
```

O projeto cria e atualiza automaticamente as tabelas principais ao iniciar, usando a conexão definida em `DATABASE_URL`.

## Instalação

```bash
npm install
```

## Rodando em Desenvolvimento

```bash
npm run dev
```

Depois acesse:

```txt
http://localhost:3000
```

## Scripts

```bash
npm run dev
```

Inicia o servidor de desenvolvimento.

```bash
npm run build
```

Gera a versão de produção.

```bash
npm run start
```

Executa a aplicação em modo produção após o build.

```bash
npm run lint
```

Executa a verificação de lint.

## Principais Rotas

- `/login` - autenticação.
- `/dashboard` - visão geral administrativa.
- `/inventory` - inventário de trajes.
- `/costureira-admin` - administração dos pedidos de costura.
- `/costureira` - painel da costureira.
- `/devolucao` - controle de devoluções.
- `/pagamentos` - pagamentos e QR Code.
- `/settings` - configurações do sistema.
- `/offline` - tela de fallback do PWA.

## PWA

O projeto inclui:

- `public/manifest.webmanifest`
- `public/sw.js`
- ícones em PNG para instalação
- registro do service worker em `app/pwa-register.tsx`


## Estrutura Básica

```txt
app/
  api/              Rotas da API
  components/       Componentes compartilhados
  dashboard/        Dashboard administrativo
  inventory/        Inventário
  pagamentos/       Pagamentos
  devolucao/        Devoluções
  costureira/       Painel da costureira
  settings/         Configurações
lib/
  db.ts             Conexão e inicialização do banco
  data.ts           Funções de acesso aos dados
  types.ts          Tipos TypeScript
public/
  manifest.webmanifest
  sw.js
```

## Observações

- A autenticação atual usa dados salvos em cookie/localStorage no cliente.
- O banco é inicializado automaticamente em `lib/db.ts`.
