# 02 — Whitelabel e Builds

Como um único código-fonte gera **N apps personalizados**, um por empresa. Este é o
núcleo do requisito de CI/CD: uma **lista de variantes** definida em variáveis, que a
pipeline percorre para produzir builds com nome, ícone, tema e assets próprios.

## Conceito de variante (regra objetiva)

- Uma **variante** = 1 configuração whitelabel = 1 empresa (`companyId`).
- A pipeline de build **itera sobre a lista de variantes** (matrix) e produz, por
  variante, os artefatos Android (APK/AAB) e iOS (IPA), além do build web se aplicável.
- Uma variante **não** altera lógica de negócio — só identidade visual e endpoints.

## Fonte da lista de variantes

Definir as variantes em uma **variável de repositório** (GitHub Actions `vars`) ou num
arquivo versionado `variants.json` na raiz do frontend, lido pela matrix. Recomendado:
`variants.json` versionado (revisável em PR) + segredos por variante em `secrets`.

Campos por variante:

| Campo | Exemplo | Uso |
|---|---|---|
| `key` | `bliss-cookie` | Identificador da variante (slug). |
| `companyId` | `cmp_abc123` | Tenant que a variante serve. |
| `appName` | `Bliss Cookie` | Nome exibido do app / label da store. |
| `bundleId` | `br.com.bliss.cookie` | `ANDROID_PACKAGE_NAME` + iOS bundle id. |
| `apiUrl` | `https://api.jbdelivery.com` | `VITE_API_URL` (backend compartilhado). |
| `appUrl` | `https://bliss.jbdelivery.com` | `VITE_APP_URL`. |
| `theme` | `{ primary, secondary, ... }` | Tokens de cor/tipografia (ver Tema). |
| `assets` | `icon`, `splash`, `logo`, `notification` | Caminhos/refs dos assets da marca. |
| `stores` | play/appstore creds refs | Segredos de publicação (por variante). |

Exemplo de `variants.json`:

```jsonc
[
  {
    "key": "bliss-cookie",
    "companyId": "cmp_abc123",
    "appName": "Bliss Cookie",
    "bundleId": "br.com.bliss.cookie",
    "apiUrl": "https://api.jbdelivery.com",
    "appUrl": "https://bliss.jbdelivery.com",
    "theme": { "primary": "#7A4B2A", "secondary": "#F2D9C2", "accent": "#E4572E" },
    "assets": { "dir": "variants/bliss-cookie" }
  }
]
```

## Origem dos assets

Cada variante tem um diretório de assets (ex.: `frontend/variants/<key>/` com
`icon.png`, `splash.png`, `logo.svg`, cores). O build **copia/injeta** esses assets
antes de `tauri build`. Alternativa (roadmap): baixar de um bucket por `key` para não
inchar o repositório — **ponto em aberto** (ver abaixo).

Favicon/ícone de app (build-time, `scripts/inject-variant.ts`):
- `favicon.svg` / `apple-touch-icon.png`: copiados para `frontend/public/` — usados
  pelo `index.html` como favicon padrão da web (fallback antes do branding runtime
  carregar, e único favicon possível em builds sem JS/branding dinâmico).
- `icon.png`: fonte para `bunx @tauri-apps/cli icon`, que regenera
  `src-tauri/icons/` (ícones Android/iOS/desktop) — obrigatório para builds de loja de
  app, já que o ícone da loja é um asset estático da build, não pode vir de runtime.

## Tema

- Tokens de cor/tipografia da variante alimentam o tema do frontend (CSS vars /
  `globals.css`) em build time (via env/JSON injetado) **ou** runtime (o app pede o
  branding ao backend pelo `companyId`).
- Recomendado: **cores essenciais em build time** (splash/ícone precisam ser estáticos)
  + **branding editável do footer/loja em runtime** (o dono muda sem rebuild — ver
  [10-painel-do-dono.md](10-painel-do-dono.md)).
- Favicon segue a mesma regra dupla: `useBrandingFavicon` (frontend/src/hooks/use-branding-favicon.ts)
  troca o `<link rel="icon">` para `branding.logoUrl` assim que o branding carrega em
  runtime (dono muda sem rebuild, só afeta a aba do navegador); o `favicon.svg`/
  `apple-touch-icon.png` da variante (ver acima) é o valor estático usado antes disso
  carregar e nas builds de app/loja, onde não há como trocar o ícone em runtime.

## Injeção no build (fluxo)

Por variante, antes de compilar:
1. Copiar assets da variante para os caminhos que o Tauri espera (ícones, splash).
2. Gerar/patch do `src-tauri/tauri.conf.json`: `productName`, `identifier` (`bundleId`),
   ícones, versão.
3. Exportar envs do frontend: `VITE_API_URL`, `VITE_APP_URL`, tokens de tema.
4. `bun tauri android build` (APK/AAB) e, quando habilitado, `bun tauri ios build` (IPA).
5. Publicar artefatos por variante (release + upload para Play/App Store).

## Integração com o CI/CD atual

Base já existente em [.github/workflows/cd.yml](../.github/workflows/cd.yml):
- Job `android` usa `hyoretsu/gh-actions/tauri-android-build` e publica no Play quando
  `vars.ANDROID_PACKAGE_NAME` existe. Job `ios` é **stub** (falta runner macOS + certs).
- **Generalizar de 1 app → N variantes**: transformar os jobs `desktop`/`android`/`ios`
  em **matrix sobre a lista de variantes** (`strategy.matrix.variant: fromJSON(variants)`),
  passando `bundleId`/assets/tema por item da matrix em vez de um único `vars.*`.
- `release-name`/`productName` passam a vir de `matrix.variant.appName`.
- Segredos de assinatura (`ANDROID_KEYSTORE_*`, Apple) podem ser **por variante** (sufixo
  no nome do secret) ou um keystore compartilhado — ponto em aberto.

Regra objetiva: **adicionar uma empresa = adicionar uma entrada na lista de variantes +
segredos de store**, sem tocar em código de domínio.

## Versionamento

- Uma versão do app vale para todas as variantes (mesma base de código). O número de
  versão vem do `package.json`/tag; o nome da release inclui a variante.

## Pontos em aberto

- Assets: commitados no repo (`frontend/variants/<key>/`) **vs** bucket externo por `key`.
- Assinatura: keystore/certs compartilhados **vs** por variante.
- Tema: quanto é build-time (estático) vs runtime (editável pelo dono).
- iOS: habilitar build real (runner macOS, conta Apple Developer, provisioning) — hoje stub.
- Store listing (descrição, screenshots) por variante: manual vs automatizado.
