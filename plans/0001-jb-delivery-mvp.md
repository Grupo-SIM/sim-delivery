# Plano — Implementação do JB Delivery (passos atômicos apresentáveis)

## Contexto

Regras de negócio documentadas em `docs/` (índice + 12 domínios). Implementar o **MVP**
sobre o template (bun+turbo: backend Elysia+TypeBox+Prisma+Better Auth+Permix; frontend
Vite+TanStack Router+Tauri Android/iOS + SDK Kubb). O template tem vestígios de um projeto
de apostas a remover. Escopo MVP inclui fidelidade por pontos, estoque, agendamento,
avaliações, tracking de marketing, e **pagamento via plataforma própria** (só tela com
**iframe** + rota **webhook**; sem gateway externo).

Refinamento: **passos o menor possível, mas apresentáveis**. Cada passo = **1 commit
atômico** de uma funcionalidade isolada, progredindo em **objetivos pequenos de front
demoável**. Back e front emparelhados quando o front depende do back; cada commit deixa o
repo verde (type-check + build + testes) e mostra algo (UI ou OpenAPI/testes).

## Convenções (codificadas no passo 0.0)

`AGENTS.md` + global `~/.claude/CLAUDE.md`:
- **Commits atômicos**: um commit = uma mudança coerente e completa; não misturar
  funcionalidades/refactors/formatação; árvore verde por commit.
- **Planos versionados** em `plans/` (top-level commitado), enumerados `NNNN-slug.md`;
  ler ao iniciar/continuar, **atualizar a cada passo concluído** e commitar junto.

## Padrões a reutilizar (não reinventar)

- **Módulo backend**: `modules/<x>/{dtos,useCases,infra/elysia,permissions,guards,errors}`
  (espelhar `modules/example`). DTO = TypeBox (spread `.properties`, `typeof X.static`).
  Controller Elysia com `response:` (não `result:`). UseCase = classe `execute(dto)`.
- **Auth/RBAC**: Better Auth + `AuthGuard`/`CompanyScopeGuard` +
  `createPermissions(role, level)` em `shared/permissions` (matriz docs/03).
- **Transações**: `UnitOfWork` (`shared/repositories`) p/ mutações multi-agregado.
- **Prisma**: schema em `packages/sql/src/models/*.prisma`; migração nova por mudança
  (aplicada pelo usuário — sem DB local; ver "Migrações").
- **SDK**: backend `bun run export` → `frontend` kubb generate. Nunca editar `generated/`.
- **Frontend**: rotas TanStack (folder/index, `<Outlet/>`); stores Zustand; UI em
  `components/ui` (`CustomSelect`, `NumericInput`, `TextField`, `DataTable`, `Modal`,
  `showAlert/showConfirm`); `useDebouncedInput`; i18n sincronizado em todos os locales.

## Receita por passo

Prisma (se houver) → módulo backend (DTO→UseCase→Controller `response:`→Permix→guard→
registrar em `server.ts`) → `export` + kubb generate → front (rota/componentes/hooks SDK/
i18n) → testes 100% do código novo → `check-types` + `build` verdes → **1 commit local**
(autor Claude, Conventional Commits, escopo `backend`/`frontend`/`sql`).

## Migrações

Sem Postgres nem `.env` nesta máquina → `prisma generate` roda (gera tipos), mas **aplicar
migração** fica com o usuário (`bun run migrate:dev` com DB de pé). Cada passo com mudança
de schema entrega o `.prisma` + client regenerado; o SQL de migração é criado quando houver
DB. Não editar migração já aplicada (regra global).

---

## Épicos → passos atômicos

Legenda: ✅ feito · `[MVP+]` promovido ao MVP · "demo:" = o que fica visível.

### É0 — Kernel & tenancy (fundação)
- **0.0** ✅ Convenções em `AGENTS.md` + global; criar `plans/`, mover plano p/
  `plans/0001-jb-delivery-mvp.md`. demo: convenções + plano commitados.
- **0.1** ✅ Limpeza apostas (front): `stores/auth.ts` roles delivery, `auth-client` fields,
  `super-admin-guard`, remover `OddsButton`/KYC. demo: app builda com roles novos.
- **0.2** ✅ Tenancy (sql): `Company` + `User.role/level/companyId` + regen. demo: tipos.
- **0.3** ✅ Permix kernel (back): `shared/permissions` + testes. demo: matriz testada.
- **0.4** ✅ `CompanyScopeGuard` + Better Auth `additionalFields`. demo: sessão traz scope.

### É1 — Empresas (superAdmin) ✅
- **1.1** ✅ Back: `companies` criar+listar (superAdmin). demo: OpenAPI + testes.
- **1.2** ✅ Front: painel superAdmin — lista empresas. demo: tela lista.
- **1.3** ✅ Front: criar empresa (form). demo: cria e aparece na lista.
- **1.4** ✅ Back+front: editar + vincular `variantKey` (edição inline). demo: edição.
  (arquivar adiado — precisa de `archivedAt` no schema; passo futuro pequeno.)

### É2 — Staff & RBAC ✅
- **2.1** ✅ Login staff real (Better Auth) + `GET /me` (scope). Front: tela `/login` +
  `useSyncSession` substitui mock. demo: login real com role.
- **2.2** ✅ Listar equipe (`GET /staff`) + página `/admin/staff`. demo: tabela staff.
- **2.3** ✅ Convidar funcionário (`POST /staff`, Better Auth signUp). demo: cria funcionário.
- **2.4** ✅ Alterar nível (`PATCH`) + remover (`DELETE`). demo: gestão completa.

### É3 — Unidades ✅
- **3.1** ✅ Unit CRUD (nome/telefone/endereço + escalares fee/cashback/deliveryMethods/
  isOpenManual no schema). `/units` CRUD + página `/admin/units` (criar/listar/excluir).
- **3.2** ✅ Horários semanais (`UnitHours` geral): model + `GET`/`PUT /units/:unitId/hours`
  (upsert por dia) + editor modal por unidade. demo: editar horários. (override por dia
  específico — feriados — adiado p/ passo seguinte pequeno.)
- **3.3** ✅ Formas de entrega + taxa + cashback % (UI de edição via `UnitConfigEditor` modal;
  campos já no schema, salva por `PATCH /units/:unitId`). demo: config.
- **3.4** ✅ Aberto/fechado: `isUnitOpen` (override manual `isOpenManual` prevalece, senão
  horário do dia) computa `isOpenNow` no `GET /units`; front mostra badge + seletor
  auto/aberto/fechado no config. demo: badge status.
- **3.5** ✅ Front cliente: **tela inicial escolher unidade**. Endpoint público `GET /public/units`
  (sem auth) resolve a empresa pela `variantKey` chumbada no build (`VITE_VARIANT_KEY`); rotas
  `/store` (lista) e `/store/$unitId` (unidade escolhida = param de rota, troca por rota).
  Formalização da variant/tema fica p/ É13.

### É4 — Cardápio
- **4.1** ✅ Category CRUD (`Category` model company-scoped + ordenável; `/categories` CRUD
  guard `menu`; página `/admin/categories`). demo: gestão categorias.
- **4.2** ✅ Tag CRUD (`Tag` model company-scoped, nome+cor hex; `/tags` CRUD guard `menu`;
  página `/admin/tags` com swatch+hex). demo: gestão tags.
- **4.3** ✅ Product CRUD (`Product` model company-scoped, título/img/desc/preço em centavos/
  cashback override; `/products` CRUD guard `menu`; página `/admin/products`). demo: gestão produtos.
- **4.4** `UnitProduct` (associação por categoria; preço/disponibilidade/estoque `[MVP+]`
  por unidade). demo: associar produto a unidade.
- **4.5** Front cliente: **tela de cardápio** (lista por unidade, busca, card, botões
  rápidos). demo: navegar cardápio.
- **4.6** Front cliente: carrossel promo + destaques/"peça novamente" + sumário lateral +
  troca de unidade. demo: cardápio completo.

### É5 — Clientes & checkout #1
- **5.1** `Customer`+`Address`; proxy CEP (`GET /cep/:cep`). demo: autofill de CEP.
- **5.2** Passwordless (solicitar código + verificar). Front: tela identificação. demo: login sem senha.
- **5.3** Cadastro (cria conta+endereço, loga). demo: **checkout #1** completo.

### É6 — Carrinho & Pedido
- **6.1** Front: carrinho local (itens, qtd, observação, editar/excluir) — store. demo: carrinho.
- **6.2** `Order`+`OrderItem` create (totais) via UoW. Front: enviar pedido. demo: cria pedido.
- **6.3** Agendamento (`scheduledFor`) `[MVP+]`. demo: agendar.
- **6.4** Front: sugestões de produtos no carrinho. demo: sugestões.

### É7 — Cupom / cashback / frete / pontos
- **7.1** Frete por unidade + simulação (`POST /freight/simulate`). Front: simulação no carrinho.
- **7.2** `Coupon` validar/aplicar. Front: input cupom. demo: desconto.
- **7.3** `CashbackLedger` (acúmulo/resgate). Front: exibir/resgatar. demo: cashback.
- **7.4** `LoyaltyPoints` `[MVP+]`. Front: exibir/resgatar. demo: pontos.

### É8 — Pagamento (plataforma própria) + webhook
- **8.1** Criar intenção de pagamento (url/token). Front: **checkout #2** com **iframe**. demo: tela pagamento.
- **8.2** `POST /payments/webhook` (confirma pedido, credita cashback/pontos). Front: **tela
  de obrigado** + aviso WhatsApp. demo: pós-pagamento.

### É9 — Pedidos: ciclo / listagem / WhatsApp
- **9.1** Transições de status. Front: painel de pedidos (mudar status). demo: gestão pedidos.
- **9.2** Listagem com filtros compreensivos. Front: filtros. demo: busca/filtro.
- **9.3** Notificação WhatsApp por mudança de status (config provider). demo: mensagem.
- **9.4** Front: visão de cozinha (`kitchen`). demo: fila cozinha.

### É10 — Motoboy & entregas
- **10.1** `Courier` CRUD + `Delivery` + atribuir. Front: atribuição no painel. demo: atribuir.
- **10.2** Transições de entrega (reflete pedido). Front: **app do motoboy** (fila, aceitar,
  status). demo: fluxo motoboy.
- **10.3** Front: link de rota + histórico. demo: navegação/histórico.

### É11 — Avaliações `[MVP+]`
- **11.1** `Review` (pedido concluído) create+list. Front: prompt de nota + listagem owner. demo: avaliar.

### É12 — Painel do dono: relatórios / branding / marketing
- **12.1** Relatórios (faturamento, pedidos, mais vendidos). Front: dashboard. demo: dashboard.
- **12.2** Branding/footer por unidade (runtime) + render do footer. demo: footer personalizado.
- **12.3** IDs de tracking `[MVP+]` (Meta/Google/Pixel/GA/GTM) + injeção das tags. demo: tags ativas.

### É13 — Whitelabel builds
- **13.1** `frontend/variants.json` + script de injeção de assets/tema/`tauri.conf`. demo: 2 variantes locais.
- **13.2** Generalizar jobs do `cd.yml` p/ matrix sobre variantes. demo: matrix no CI.
- **13.3** Tema runtime a partir do branding da empresa. demo: cores por empresa.

---

## Verificação

- **Por passo**: `bun run check-types` + `bun run build` (afetados) verdes; testes do passo
  passam; cobertura 100% do código novo; 1 commit local.
- **Fluxo e2e** (após É8, com DB de pé): escolher unidade → carrinho → checkout #1 (CEP) →
  checkout #2 (iframe) → simular `POST /payments/webhook` → pedido confirmado + obrigado.
  Após É9/É10: mudar status → notificação; atribuir motoboy → app do motoboy atualiza.
- **RBAC**: rota sem permissão → 403 (guards Permix). **Multi-tenant**: dados nunca cruzam
  empresas (filtro `companyId`); só `superAdmin` cruza.

## Pontos em aberto (decidir no passo)
- 5.1/5.2: provedor CEP (ViaCEP vs Correios); mecanismo passwordless (email/SMS/WhatsApp).
- 8.x: contrato da plataforma de pagamento (payload intenção/webhook, validação da assinatura).
- 9.3: provedor de WhatsApp (API oficial vs gateway).
- 3.3/7.x: frete por zona vs distância; empilhar cupom+cashback+pontos.
- 10.x: auth do motoboy (Better Auth vs próprio); atribuição manual vs automática.

## Progresso
- **É0, É1, É2 concluídos.** Árvore verde: check-types + build (back/front) + testes
  (26 backend). SDK regenerado inclui companies + staff + /me.
- Padrão reforçado: retorno de lista com enum → usar `t.String()` no DTO (Kubb achata
  enum-em-item-de-array). Schema com `t.Union` de literais em resposta: escrever união
  explícita (não `.map`) p/ Elysia inferir.
- **É0, É1, É2, É3 concluídos.** Empresa resolvida por `variantKey` chumbada no build;
  unidade escolhida/trocada por rota (`/store/$unitId`).
- **É4 em andamento**: 4.1 (Category CRUD) + 4.2 (Tag CRUD) + 4.3 (Product CRUD) concluídos.
- Próximo: **4.4** UnitProduct (associação por categoria; preço/disponibilidade/estoque por unidade).
- Nota: migrações não aplicadas (sem DB local); usuário roda `bun run migrate:dev`.
