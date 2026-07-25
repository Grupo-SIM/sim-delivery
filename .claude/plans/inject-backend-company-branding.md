# Injetar marca da empresa no backend

## Objetivo

Eliminar o nome genérico `Template App` de todos os e-mails enviados pelo backend e do resquício `app.name` do frontend. A marca deve ser resolvida da tabela `company` no momento da build, pelo slug da empresa, como já acontece para o bundle frontend.

## Diagnóstico

- O frontend já executa `frontend/scripts/inject.ts` antes de `dev` e `build`. Ele exige `VITE_COMPANY_SLUG`, consulta `company` via Prisma e gera `frontend/src/lib/branding.ts`, CSS, logo e metadados nativos.
- O backend ainda não possui etapa equivalente. Seus sete usos de `Template App` estão em:
  - `backend/src/shared/infra/betterAuth.ts`: nome do remetente de reset de senha e magic link;
  - `backend/src/modules/users/emails/{MagicLinkEmail,ResetPasswordEmail}.tsx`: preview e copyright;
  - `backend/src/modules/users/emails/components/EmailBrandMark.tsx`: monograma e wordmark.
- `Company` já é a fonte de verdade e possui `name`, `logoUrl` e `themeColors`, portanto não será necessária migração de schema.
- O último uso de `app.name` é apenas o `BrandMark` administrativo. Esse valor fixo vive em `frontend/src/i18n/locales/pt-BR.json`, embora o nome já exista em `frontend/src/lib/branding.ts` gerado por empresa.

## Implementação

1. Criar `backend/scripts/inject.ts`, espelhando o carregamento de ambiente e a consulta Prisma do injetor do frontend:
   - carregar `DATABASE_URL` de `packages/sql/.env` quando não estiver presente no processo;
   - exigir `COMPANY_SLUG` como variável explicitamente destinada ao backend (sem expor a convenção `VITE_*` ao servidor);
   - localizar a empresa pelo slug e falhar antes da compilação se ela não existir;
   - selecionar e serializar somente `name`, `logoUrl` e os pares de cores necessários para e-mail (`themeColors.light.primary` e `primaryForeground`, com fallback para o tema de e-mail atual quando ausentes);
   - gerar `backend/src/shared/infra/branding.ts` com um objeto TypeScript estático e tipado. O artefato será o único ponto que os envios do backend leem, de modo que o bundle resultante não depende do banco em runtime.

2. Registrar a injeção no ciclo do backend:
   - adicionar `inject` a `backend/package.json`;
   - fazer `backend#build` e `backend#dev` dependerem de `backend#inject` no `turbo.jsonc`, com `COMPANY_SLUG` e `DATABASE_URL` declarados como entradas de ambiente e o módulo gerado como saída;
   - fazer `backend` `build` executar o injetor antes do `bun build`, preservando também o fluxo para quem executar o pacote isoladamente;
   - documentar em `docs/02-whitelabel-e-builds.md` que cada artefato de backend exige `COMPANY_SLUG` além do `VITE_COMPANY_SLUG` do frontend. O nome poderá ser o mesmo valor de slug, mas ficará explícito que ambos os builds precisam ser configurados.

3. Consumir o branding estático nos e-mails:
   - substituir as duas ocorrências de remetente `"Template App"` em `betterAuth.ts` pelo `companyName` injetado, mantendo a precedência atual de endereço (`MAIL_USER`; a centralização prevista em `.claude/plans/centralize-email-classes.md` continua compatível);
   - fazer os templates `MagicLinkEmail` e `ResetPasswordEmail` receberem/lerem o branding estático para montar preview e copyright com o nome correto;
   - atualizar `EmailBrandMark` para renderizar a logo quando `logoUrl` estiver configurada; caso contrário, renderizar as iniciais derivadas do nome da empresa. Aplicar as cores injetadas quando fornecidas e preservar o tema atual como fallback. Assim nenhum e-mail depende de uma imagem remota para identificar a marca.

4. Remover o resquício da tradução do frontend:
   - alterar `frontend/src/components/ui/BrandMark.tsx` para usar `branding.companyName` gerado e iniciais derivadas dele, em vez de `t("app.name")` e do monograma `ZG` fixo;
   - remover a chave agora órfã `app.name` de `frontend/src/i18n/locales/pt-BR.json`, preservando a ordenação/estrutura do arquivo;
   - não alterar o módulo gerado manualmente: a fonte continuará sendo `frontend/scripts/inject.ts` e a tabela `company`.

## Testes e validação

1. Adicionar testes unitários adjacentes aos componentes de e-mail, renderizando os templates com um módulo de branding de teste para verificar: preview, copyright, wordmark/iniciais, logo opcional e fallback de cor.
2. Adicionar um teste unitário para o formato de branding injetado (extraindo a normalização/serialização pura do script se necessário), cobrindo empresa encontrada, slug ausente/desconhecido e fallback quando `themeColors` ou `logoUrl` são nulos. O teste não fará migração, seed ou acesso a serviços externos.
3. Adicionar um teste para `BrandMark` ou para sua função pura de iniciais/nome, garantindo que o componente não consulte mais `app.name` nem exiba `ZG` fixo.
4. Executar os testes focados novos, `cd backend && bun run check-types`, `cd frontend && bun run check-types` e os testes unitários afetados. Executar uma injeção local com uma empresa existente somente se `DATABASE_URL` local e `COMPANY_SLUG` forem fornecidos; ela sobrescreve artefatos gerados e, portanto, deve ser tratada como etapa explícita de validação, não como pré-requisito dos testes puros.

## Compatibilidade e limites

- Não haverá consulta a `company` em cada e-mail nem alteração de rotas/DTOs/contratos públicos.
- Alterar branding no painel continuará exigindo nova build para backend e frontend, coerente com a política já documentada de identidade estática por empresa.
- Um backend que serve múltiplas empresas com o mesmo artefato não poderá ter remetente/HTML específico por empresa com este desenho; esse é um limite intencional do requisito de build dedicado. Se esse modelo for necessário no futuro, a evolução correta será resolver a empresa por usuário/unidade em runtime, não reutilizar este artefato estático.
