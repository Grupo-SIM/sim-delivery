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

### É4 — Cardápio ✅
- **4.1** ✅ Category CRUD (`Category` model company-scoped + ordenável; `/categories` CRUD
  guard `menu`; página `/admin/categories`). demo: gestão categorias.
- **4.2** ✅ Tag CRUD (`Tag` model company-scoped, nome+cor hex; `/tags` CRUD guard `menu`;
  página `/admin/tags` com swatch+hex). demo: gestão tags.
- **4.3** ✅ Product CRUD (`Product` model company-scoped, título/img/desc/preço em centavos/
  cashback override; `/products` CRUD guard `menu`; página `/admin/products`). demo: gestão produtos.
- **4.4** ✅ `UnitProduct` (model `@@unique([unitId,productId])`, override preço/cashback/
  categoria + disponibilidade/estoque por unidade; `/units/:unitId/products` CRUD guard `menu`;
  página `/admin/units/$unitId/products` + botão "Menu" na tabela de unidades). demo: associar produto a unidade.
- **4.5** ✅ Front cliente: **tela de cardápio** (endpoint público `GET /public/units/:unitId/menu`
  agrupa por categoria ordenada + solto por último, resolve preço/cashback por unidade; tela
  `/store/$unitId` com busca debounced, chips de navegação rápida por categoria, cards
  imagem/nome/desc/preço/cashback). demo: navegar cardápio. (add-to-cart fica em 4.7)
- **4.6** ✅ Front cliente: carrossel de destaques (itens com cashback = ofertas) + sumário
  lateral desktop (categorias + contagem, jump-to) + troca de unidade inline (CustomSelect →
  navega p/ `/store/$unitId`). demo: cardápio completo. **"Peça novamente" adiado** — precisa de
  histórico de pedidos (É6+); reintroduzir quando houver `Order`.
- **4.7** ✅ Front cliente: **carrinho local** (store Zustand persistido `cart`: itens, qtd,
  observação, editar/excluir; 1 unidade por vez, troca reinicia). Botão "Adicionar" nos cards,
  barra fixa inferior com contagem/total, modal com linhas (stepper qtd, nota debounced, remover,
  limpar). Front-only. demo: carrinho. (era 6.1; checkout fica em É6)
- **4.8** ✅ Front cliente: **sugestões de produtos no carrinho** (itens do cardápio ainda não
  no carrinho, ofertas de cashback primeiro; strip com botão adicionar no modal do carrinho).
  Front-only. demo: sugestões. (era 6.4)

### É5 — Clientes & checkout #1
- **5.1** ✅ `Customer`+`Address` (models company-scoped; Customer 1:1 com User Better Auth,
  cpf/phone; Address com campos deduzidos por CEP + `number` "S/N"). Proxy CEP público
  `GET /cep/:cep` (ViaCEP, normaliza logradouro/bairro/cidade/uf). Front: rota
  `/store/$unitId/checkout` com `AddressForm` (CEP mascarado autofill on-complete), botão
  "Checkout" no carrinho navega p/ lá. demo: autofill de CEP. (identificação/conta em 5.2/5.3;
  submit hoje só `showAlert` placeholder)
- **5.2** ✅ Passwordless (solicitar código + verificar). Better Auth plugins `phoneNumber`
  (SMS, `signUpOnVerification` com email/nome temporários) + `magicLink` (email, link aponta
  pro front `/identify/magic-link` em vez do redirect padrão do backend, assim funciona no
  app Tauri). Provider de envio de SMS abstrato (`shared/infra/phoneOtp`, driver por env
  `PHONE_OTP_DRIVER`: `console` dev / `twilio` via fetch direto sem SDK) + canal WhatsApp
  já modelado porém **desabilitado** (`DisabledWhatsAppOtpProvider` sempre lança). Front:
  `IdentifyForm` na tela de checkout com abas SMS/Email/WhatsApp (WhatsApp desabilitada);
  `CheckoutPage` alterna entre `IdentifyForm` e `AddressForm` conforme
  `useAuthStore().isAuthenticated` (sincronizado globalmente por `useSyncSession`). demo:
  login sem senha por SMS ou magic link.
- **5.3** ✅ Cadastro (cria conta+endereço, loga). demo: **checkout #1** completo.

### É6 — Pedido
- **6.1** ✅ `Order`+`OrderItem` create (totais) via UoW. Front: enviar pedido. demo: cria pedido. (era 6.2)
- **6.2** Agendamento (`scheduledFor`) `[MVP+]`. demo: agendar. (era 6.3)

### É7 — Cupom / cashback / frete / pontos
- **7.1** ✅ Frete por unidade + simulação (`POST /freight/simulate`). Front: simulação no carrinho.
- **7.2** ✅ `Coupon` validar/aplicar. Front: input cupom. demo: desconto.
- **7.3** ✅ `CashbackLedger` (acúmulo/resgate). Front: exibir/resgatar. demo: cashback.
- **7.4** ✅ `LoyaltyPoints` `[MVP+]`. Front: exibir/resgatar. demo: pontos.

### É8 — Pagamento (plataforma própria) + webhook
- **8.1** ✅ Criar intenção de pagamento (url/token). Front: **checkout #2** com **iframe**. demo: tela pagamento.
- **8.2** ✅ `POST /payments/webhook` (confirma pedido, credita cashback/pontos). Front: **tela
  de obrigado** + aviso WhatsApp. demo: pós-pagamento.

### É9 — Pedidos: ciclo / listagem / WhatsApp ✅
- **9.1** ✅ Transições de status. Front: painel de pedidos (mudar status). demo: gestão pedidos.
- **9.2** ✅ Listagem com filtros compreensivos. Front: filtros. demo: busca/filtro.
- **9.3** ✅ Notificação WhatsApp por mudança de status (config provider). demo: mensagem.
- **9.4** ✅ Front: visão de cozinha (`kitchen`). demo: fila cozinha.

### É10 — Motoboy & entregas ✅
- **10.1** ✅ `Courier` CRUD + `Delivery` + atribuir. Front: atribuição no painel. demo: atribuir.
- **10.2** ✅ Transições de entrega (reflete pedido). Front: **app do motoboy** (fila, aceitar,
  status). demo: fluxo motoboy.
- **10.3** ✅ Front: link de rota + histórico. demo: navegação/histórico.

### É11 — Avaliações `[MVP+]` ✅
- **11.1** ✅ `Review` (pedido concluído) create+list. Front: prompt de nota + listagem owner. demo: avaliar.

### É12 — Painel do dono: relatórios / branding / marketing ✅
- **12.1** ✅ Relatórios (faturamento, pedidos, mais vendidos). Front: dashboard. demo: dashboard.
- **12.2** ✅ Branding/footer por unidade (runtime) + render do footer. demo: footer personalizado.
- **12.3** ✅ IDs de tracking `[MVP+]` (Meta/Google/Pixel/GA/GTM) + injeção das tags. demo: tags ativas.

### É13 — Whitelabel builds ✅
- **13.1** ✅ `frontend/variants.json` + script de injeção de assets/tema/`tauri.conf`. demo: 2 variantes locais.
- **13.2** ✅ Generalizar jobs do `cd.yml` p/ matrix sobre variantes. demo: matrix no CI.
- **13.3** ✅ Tema runtime a partir do branding da empresa. demo: cores por empresa.

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
- **É4 concluído**: 4.1 (Category) + 4.2 (Tag) + 4.3 (Product) + 4.4 (UnitProduct) + 4.5 (cardápio cliente) + 4.6 (destaques/sumário/troca unidade) + 4.7 (carrinho local) + 4.8 (sugestões). Cardápio completo: gestão admin + storefront cliente com carrinho.
- **Reordenação (fluxo de dependência + dificuldade)**: carrinho (era 6.1) e sugestões (era 6.4)
  são front-only sem backend → subiram para 4.7/4.8 (fecham browse→carrinho antes de cliente/pedido);
  É6 vira só persistência de pedido (6.1 create, 6.2 agendamento). Demais épicos já seguiam a ordem
  de dependência; mantidos. Trabalho fácil front-first batelado; integrações difíceis (pagamento,
  WhatsApp, motoboy) permanecem depois de suas dependências.
- **É5 em andamento**: 5.1 ✅ (Customer+Address + proxy CEP ViaCEP + AddressForm autofill).
  Decisão CEP: **ViaCEP** (grátis, sem auth). Endpoint público sob tag "Public".
- 5.2 ✅ passwordless: decisão do usuário foi **SMS + magic link (email) + WhatsApp modelado
  porém desabilitado**, com mecanismo de provider (`shared/infra/phoneOtp`, driver por env).
  Sem endpoint próprio — usa plugins nativos do Better Auth (`phoneNumber`, `magicLink`), sem
  DTO/UseCase/controller novo neste passo.
- 5.3 ✅ cadastro: `GET /customers/me?variantKey=` + `POST /customers/me` (módulo `customers`
  com `GetMyCustomer` + `UpsertCustomer`; 6 testes). Front: `ProfileForm` (nome + CPF opcional),
  `CheckoutPage` com 3 passos: identify → profile (se não tem Customer) → address. Submit do
  address chama `POST /customers/me` que cria Customer + Address e atualiza nome na BA. SDK regenerado.
- **É5 concluído.** Checkout #1 completo: identify (SMS/magic link) → profile → address → save.
- **É6 concluído**: 6.1 ✅ Order+OrderItem create via UoW (subtotais, frete, cupom, cashback/loyalty redemption).
  6.2 (agendamento) adiado.
- **É7 concluído**: 7.1 frete/simulação, 7.2 cupom, 7.3 cashback ledger, 7.4 loyalty points ledger.
- **É8 concluído**: 8.1 payment intent + iframe (backend serve página de pagamento em /pay/:token;
  frontend checkout step 5 = iframe + postMessage); 8.2 webhook ConfirmPayment credita cashback+loyalty
  accrual + muda status pedido p/ recebido; tela de obrigado. Decisão de pagamento: plataforma interna
  via token (hosted pay page); webhook por `POST /payments/webhook { token }`.
- **É9 concluído**: 9.1 status transitions (GET/PATCH /orders, 14 tests), 9.2 comprehensive filters (deliveryMethod/hasCoupon/search), 9.3 WhatsApp provider (console/disabled drivers, notifies on status change), 9.4 kitchen view (/admin/kitchen, 30s polling, advance actions).
- **É10 concluído**: 10.1 Delivery model + AssignDelivery + UpdateDeliveryStatus + DeliveriesController + assign button in orders panel (delivery field added to order list return); 10.2 courier role in InviteStaff, ListStaff includes couriers, /courier page with active delivery queue + status actions; 10.3 address in delivery list return, Google Maps link when a_caminho, history section on courier page.
- Próximo: **É11** — reviews (pedido concluído, prompt de nota).
- Nota: migrações não aplicadas (sem DB local); usuário roda `bun run migrate:dev`.
  Novos modelos: LoyaltyLedger, Payment. Campos novos: Unit.loyaltyPointsRate, Order.loyaltyPointsRedeemed,
  Order.status default agora é `awaiting_payment` (antes `recebido`).
  Schema customer + address já entregues em 5.1; migração fica p/ o usuário.
