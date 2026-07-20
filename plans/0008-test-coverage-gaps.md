# Plan 0008 — Lacunas de cobertura de testes

## Objective

Elevar a cobertura de testes para casos de uso de backend e páginas/componentes de frontend
hoje sem teste, priorizando lógica de negócio (validação, cálculo, transições de estado)
sobre marcação. Rodar com `bun test` (`test:unit` em cada app).

## Context and Existing Work

- Já coberto (não mexer, apenas referência):
  - **Backend:** módulos com `*.test.ts` cobrindo seus use cases — cashback, categories,
    cep, companies, coupons (validate), customers, deliveries, loyalty, orders, products +
    ProductOptions, promotionalImages, staff, tags, unitProducts, units (units/freight/
    publicMenu/publicUnits/unitHours/isUnitOpen); shared — phoneOtp, resolveSiteSessionOverride,
    SeedAdmin, whatsapp, createPermissions, slug.
  - **Frontend:** `hooks/use-branding-favicon`, `hooks/use-tracking`, `lib/tanstack`,
    `lib/theme-colors`, `stores/cart`.
- Convenção: use cases de um módulo costumam ser cobertos por um único `<modulo>.test.ts`
  no diretório `useCases/`. Novos testes seguem esse padrão salvo quando o arquivo fica
  grande demais.

## Product and Architecture Decisions

- Priorizar por risco: pagamentos e relatórios (dinheiro/somatórios) primeiro; depois
  reviews/branding; no frontend, cart/checkout, formulários com validação, e guards.
- Testes de use case exercem regras de domínio com repositórios/mocks in-memory, sem tocar
  DB externo (mesma abordagem dos testes existentes).
- Componentes de frontend: testar lógica (validação de form, cálculo de total, montagem de
  payload, transições), não pixel/estilo.
- Não introduzir novos frameworks; usar `bun test` já configurado.

## Implementation Plan

### A. Backend — use cases/módulos sem teste

Módulos **inteiramente sem teste** (maior prioridade):

- **payments** (`backend/src/modules/payments/useCases/`) — `CreatePixPayment.ts`,
  `CreateCardPayment.ts`, `ConfirmPayment.ts`, `GetPaymentStatus.ts`, `ListSavedCards.ts`,
  `resolvePayingCustomer.ts`. **Prioridade alta** (fluxo de dinheiro; resolução de cliente
  pagante e confirmação são caminhos críticos). Mockar provedor de pagamento.
- **reports** (`backend/src/modules/reports/useCases/`) — `GetRevenueSummary.ts`,
  `GetBestSellers.ts`. **Prioridade alta** (somatórios/receita; janelas de período
  today/week/month). Cobrir agregação e escopo por `companyId`.
- **reviews** (`backend/src/modules/reviews/useCases/`) — `CreateReview.ts`,
  `ListReviews.ts`. **Prioridade média** (regras de quem pode avaliar, 1 review por pedido).
- **branding** (`backend/src/modules/branding/useCases/`) — `GetBranding.ts`,
  `UpdateBranding.ts`. **Prioridade média** (validação de campos de tema/footer, escopo).

Criar `payments.test.ts`, `reports.test.ts`, `reviews.test.ts`, `branding.test.ts` nos
respectivos `useCases/`, no padrão dos módulos já testados.

### B. Frontend — páginas/componentes/utilitários sem teste

Ordenar por complexidade de lógica:

**Prioridade alta (lógica de negócio):**
- `frontend/src/stores/auth.ts`, `stores/delivery-method.ts`, `stores/selected-unit.ts`,
  `stores/dialog.ts` — estado com regras; `cart` já tem teste como referência de padrão.
- `frontend/src/routes/_storefront/$unitId/checkout/index.tsx` e componentes do checkout
  (`components/AddressForm.tsx`, `IdentifyForm.tsx`, `ProfileForm.tsx`, `OrderReview.tsx`,
  `PaymentStep/CardPaymentForm.tsx`, `PaymentStep/PixPanel.tsx`) — validação de form,
  montagem de payload, seleção de pagamento. Testar a lógica pura (extraindo helpers se
  necessário).
- `frontend/src/routes/_storefront/$unitId/components/ProductDetailsModal.tsx` e
  `MenuItemCard.tsx` — seleção de opções, cálculo de total da linha, validação de limites
  (min/max) — regras do plano 0006.
- `frontend/src/lib/formatMoney.ts`, `lib/requestLocation.ts`, `lib/variant.ts`,
  `lib/staff-guard.ts`, `lib/super-admin-guard.ts` — utilitários puros/guards, alto ROI.

**Prioridade média:**
- Hooks: `hooks/use-countdown.ts`, `hooks/use-debounced-input.ts`,
  `hooks/use-live-branding.ts`, `hooks/use-branding-theme.ts`, `hooks/useSyncSession.ts`.
- Formulários do painel: `admin/products/components/CreateProductForm.tsx`,
  `OptionEditor.tsx`, `OptionGroupEditor.tsx`, `ProductEditModal.tsx`;
  `admin/categories/components/CreateCategoryForm.tsx`;
  `admin/companies/components/CreateCompanyForm.tsx`;
  `admin/units/components/UnitDeliveryZonesEditor.tsx`.
- Fluxos de operação: `admin/orders/components/UpdateStatusModal.tsx`,
  `AssignCourierModal.tsx`, `OrdersKanban.tsx`; `courier/components/DeliveryCard.tsx`
  (montagem de URL de mapa, transições de status).

**Prioridade baixa:**
- Componentes de UI puros em `frontend/src/components/ui/*` (apresentação), tabelas de
  listagem sem lógica de cálculo, `design-kit`.

### C. Sequência

1. Backend: `payments` → `reports` → `reviews` → `branding`.
2. Frontend alto ROI: stores restantes + `lib` utilitários/guards.
3. Frontend lógica de domínio: opções de produto (0006) + checkout.
4. Média prioridade conforme capacidade.

## Progress

- [x] **Bloco 1 — backend.** `payments.test.ts` (50 testes: resolvePayingCustomer, PIX, cartão,
  ConfirmPayment, GetPaymentStatus, ListSavedCards), `reports.test.ts` (17), `reviews.test.ts`
  (17), `GetBranding.test.ts` + casos de escopo em `UpdateBranding.test.ts` (11). Backend:
  272 testes passando, `check-types` limpo. Branding seguiu o padrão por arquivo já existente
  no módulo, em vez de um `branding.test.ts` único.
- [x] **Bloco 2 — frontend alto ROI.** `stores/auth`, `stores/dialog`, `stores/selected-unit`,
  `stores/delivery-method`, `lib/formatMoney`, `lib/staff-guard`, `lib/super-admin-guard`
  (incluindo o caso 429 ≠ não autenticado). Helper `stores/tests/local-storage-stub.ts` para
  stores persistidos; `cart.test.ts` passou a usá-lo. `lib/variant.ts` não testado (apenas
  lê `import.meta.env`); `lib/requestLocation.ts` ainda pendente.
- [x] **Bloco 3 (parcial) — opções de produto.** Lógica pura extraída de
  `ProductDetailsModal.tsx` para `components/product-options.ts` e coberta por 37 testes
  (regras `sum`/`highest`/`average`, min/max por grupo, `maxPerItem`). **A extração corrigiu
  um bug**: a checagem de limite em grupos multi-escolha somava a quantidade escolhida em
  *outros* grupos, permitindo estourar o máximo do próprio grupo e bloqueando escolhas
  válidas quando outro grupo estava cheio.
- [ ] **Bloco 3 (restante) — checkout.** `checkout/index.tsx` e componentes
  (`AddressForm`, `IdentifyForm`, `ProfileForm`, `OrderReview`, `PaymentStep/*`).
- [ ] **Bloco 4 — média prioridade.** Hooks, formulários do painel, fluxos de operação.

Frontend: 121 testes passando, `check-types` e `build` limpos.

## Verification Criteria

- Cada novo teste roda em `bun test` e passa: `cd backend && bun run test:unit`,
  `cd frontend && bun run test:unit`.
- Módulos backend antes sem teste (payments/reports/reviews/branding) passam a ter arquivo
  de teste cobrindo os caminhos principais e ao menos um caso de escopo por `companyId`.
- Lógica de opções de produto e cálculo de total de checkout têm asserções sobre valores.

## Potential Risks and Mitigations

- **Lógica acoplada à UI** (checkout/opções) dificulta teste — mitigar extraindo helpers
  puros (cálculo/validação) e testando-os; manter mudança de refactor mínima e coberta.
- **Mocks de provedor de pagamento** divergindo do real — testar contrato/entrada-saída,
  não o provedor.
- **Falsos positivos por escopo de tenant** — incluir sempre um caso cross-company que deve
  falhar/retornar vazio.

## Alternative Approaches

- Um `<modulo>.test.ts` por módulo (padrão atual) vs teste por arquivo — seguir o padrão do
  módulo; dividir só se o arquivo crescer demais.
- Testar componentes via render (Testing Library) vs extrair e testar helpers puros —
  preferir helpers puros para lógica; render só quando o comportamento é intrínseco à UI.

## Execution Protocol

- Entregar por bloco da seção C, rodando `test:unit` do app afetado a cada bloco.
- Não alterar código de produção além de extrações de helper estritamente necessárias para
  testabilidade, mantidas pequenas e cobertas.
