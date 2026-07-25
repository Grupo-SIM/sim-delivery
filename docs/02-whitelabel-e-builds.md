# 02 — Whitelabel e builds

Cada build atende uma empresa. A seleção vem de `VITE_COMPANY_SLUG` no frontend e
`COMPANY_SLUG` no backend; não há `variants.json`, diretórios de assets por variante,
nem consulta ao backend na primeira renderização.

## Configure a empresa antes de compilar

A tabela `company` é a fonte de verdade. Preencha estes campos para a empresa selecionada:

| Campo | Uso no build |
|---|---|
| `slug` | Seleciona a empresa por `VITE_COMPANY_SLUG` (frontend) e `COMPANY_SLUG` (backend). |
| `name` | Nome exibido e nome do app Tauri. |
| `packageName` | Identificador Android/iOS/desktop. Substitui `bundleIdentifier`. |
| `siteUrl` | URL pública da loja. |
| `apiUrl` | URL do backend usada pelo cliente e Better Auth. |
| `logoUrl` | Logo baixado e usado no app, favicon e ícones nativos. |
| `themeColors` | Paleta CSS aplicada antes da primeira pintura. |
| `footerText`, `ga4Id`, `gtmId`, `metaPixelId` | Conteúdo e tracking incluídos no bundle. |

## Build e desenvolvimento usam o mesmo fluxo

Defina o slug no ambiente do processo ou em `frontend/.env` / `frontend/.env.local`:

```sh
VITE_COMPANY_SLUG=acai-top
COMPANY_SLUG=acai-top
```

Depois execute normalmente:

```sh
cd frontend
bun run dev
bun run build
```

Os dois comandos executam `scripts/inject.ts` antes do Vite. O script consulta o Prisma
diretamente, baixa a logo, gera `branding.css`, atualiza o módulo estático de branding e
regenera favicon, Apple touch icon e ícones Tauri.

O Turborepo também executa `backend/scripts/inject.ts` antes de `dev` e `build`. Ele
gera o branding estático dos e-mails (nome, logo e cores primárias), sem consultar o
banco em runtime.

Em Docker, passe `DATABASE_URL`, `VITE_COMPANY_SLUG` e `COMPANY_SLUG` como argumentos de
build. As imagens finais continuam estáticas; elas não precisam de acesso ao banco para
carregar ou enviar a marca configurada.

## Mudanças de marca exigem nova build

Como cores, logo, URLs e tracking são congelados no bundle, salvar branding no painel não
altera uma build já publicada. Gere uma nova build para propagar a mudança.
