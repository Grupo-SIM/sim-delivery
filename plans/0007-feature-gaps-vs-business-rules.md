# Plan 0007 — Lacunas de features vs regras de negócio

## Objective

Fechar as lacunas entre as regras de negócio documentadas em `docs/` e o que o backend
e o frontend implementam hoje. Foco em casos de uso **MVP** ausentes ou parciais; itens
de roadmap ficam listados mas fora do escopo de entrega. Cada lacuna abaixo foi conferida
contra o código atual (caminhos citados são a evidência do estado real).

## Context and Existing Work

- Regras: `docs/01`…`docs/11` + `docs/business-rules.md`. Papéis em `docs/03`; unidades
  `docs/04`; cardápio `docs/05`; pedidos `docs/06`; clientes `docs/07`; app cliente
  `docs/08`; pagamentos/cashback/cupons/frete `docs/09`; painel do dono `docs/10`;
  entregas/motoboy `docs/11`.
- Backend: módulos em `backend/src/modules/*` com casos de uso em `*/useCases/`. Fluxo de
  API: controller/DTO → `cd backend && bun run export` → `cd frontend && bun run generate`.
- Frontend: rotas file-based em `frontend/src/routes`; painel sob `admin/`, app cliente
  sob `_storefront/`, motoboy em `courier/`.
- Já implementado e fora de escopo deste plano (confirmado): redenção de cashback/loyalty
  no pedido (`backend/src/modules/orders/useCases/CreateOrder.ts:188-198`), notificação
  de status por WhatsApp (`backend/src/modules/orders/useCases/UpdateOrderStatus.ts:67-68`),
  reflexo de `Delivery`→`Order` (`backend/src/modules/deliveries/useCases/UpdateDeliveryStatus.ts:50-53`),
  fluxo do motoboy com aceitar/rota/Maps (`frontend/src/routes/courier/components/DeliveryCard.tsx:20-95`),
  frete por raio/zonas (`backend/src/modules/units/useCases/SimulateFreight.ts`,
  `SetDeliveryZones.ts`), customizações de produto e exclusão por unidade (plano 0006).

## Product and Architecture Decisions

- Só entram no escopo de entrega as lacunas marcadas **MVP**. Roadmap é registrado para
  rastreabilidade, não implementado aqui.
- Toda entidade permanece escopada por `companyId`; nenhuma query nova pode cruzar tenant
  (exceto `superAdmin`). Ações escopadas por unidade recebem `unitId` no `check` de permissão.
- Novos endpoints seguem backend → `bun run export` → `bun run generate`; nunca editar
  `frontend/src/lib/api/generated/`.
- Enums (status, papel) são contratos traduzíveis no frontend; nunca renderizar valor cru.
- Migrações/seeds criados e versionados localmente; nunca executar contra DB externo.

## Implementation Plan

### Gap 1 — Cupons: administração (CRUD) — **MVP** ✅ Concluído

- **Regra:** `docs/09` e `docs/10` preveem `coupons: { create, apply }`; o dono cria/gerencia
  cupons no painel.
- **Hoje existe:** apenas validação — `backend/src/modules/coupons/useCases/ValidateCoupon.ts`
  e rota `POST /validate` em `backend/src/modules/coupons/infra/elysia/CouponsController.ts:15`.
  Modelo em `packages/sql/src/models/coupon.prisma`. Não há rota de painel nem item na
  `AdminSidebar`.
- **Falta:** `CreateCoupon`, `ListCoupons`, `UpdateCoupon`, `DeleteCoupon` (backend, escopo
  `companyId`, guard `coupons:create`); controller com CRUD; regenerar SDK; página
  `frontend/src/routes/admin/coupons/index.tsx` (tabela + form de criação: código, tipo de
  desconto, valor, validade, limites); item no `AdminSidebar`.
- **Entregue:** CRUD protegido pelos guards `coupons:{read,create,update,delete}`, isolado por
  `companyId`, DTOs TypeBox, OpenAPI/SDK regenerados, testes de escopo, página `/admin/coupons`
  com criação, edição e exclusão confirmada, navegação e traduções.

### Gap 2 — Clientes: listagem e histórico no painel — **MVP**

- **Regra:** `docs/07` e `docs/10` — o dono lista clientes e vê histórico de pedidos.
- **Hoje existe:** controller do cliente expõe só `GET`/`POST` para self-service
  (`GetMyCustomer`, `UpsertCustomer`) em
  `backend/src/modules/customers/infra/elysia/CustomersController.ts:19,27`. Não há
  `ListCustomers`/`GetCustomer` admin nem rota `admin/customers`.
- **Falta:** `ListCustomers` (paginado/buscável, escopo `companyId`) e detalhe com histórico
  reaproveitando `ListOrders`; controller admin; SDK; página
  `frontend/src/routes/admin/customers/index.tsx` (tabela) + detalhe; item no `AdminSidebar`.

### Gap 3 — Gestão de motoboys (couriers) no painel — **MVP**

- **Regra:** `docs/11` + `docs/03` — `courier` é vinculado à empresa/unidade e recebe
  atribuições; `docs/10` cita gestão de staff. Atribuição depende de existir courier.
- **Hoje existe:** atribuição consome lista via `useGetStaff`/`useGetDeliveries`
  (`frontend/src/routes/admin/orders/components/AssignCourierModal.tsx:9-12`) e
  `AssignDelivery` recebe `courierId` pronto (`backend/src/modules/deliveries/useCases/AssignDelivery.ts:10`).
  `InviteStaff` não trata o papel `courier` como fluxo dedicado.
- **Falta:** confirmar/definir criação de courier (via staff com role `courier` ou módulo
  próprio), `ListCouriers` para popular a atribuição de forma explícita, e superfície de
  gestão no painel (lista de motoboys + vínculo a unidades). Decidir autenticação do courier
  (ponto em aberto em `docs/11`) antes de expandir.

### Gap 4 — Notificações de status configuráveis por WhatsApp — **MVP (parcial)**

- **Regra:** `docs/10` › Notificações e `docs/06` — mensagens de status por WhatsApp
  configuráveis pelo dono.
- **Hoje existe:** envio automático fixo em
  `backend/src/modules/orders/useCases/UpdateOrderStatus.ts:67-68` via `whatsApp.sendOrderStatus`.
  Não há edição das mensagens/gatilhos pelo painel.
- **Falta:** persistência de templates por empresa/unidade + tela de configuração; usar os
  templates no envio. (Se decidido roadmap, rebaixar e remover do escopo.)

### Gap 5 — Footer/branding runtime por loja — **verificar / MVP**

- **Regra:** `docs/10` › Branding/footer — editar por loja formas de pagamento, redes
  sociais, atendimento, localização, horário, sem rebuild.
- **Hoje existe:** `admin/branding` cobre tema (`frontend/src/routes/admin/branding/index.tsx`,
  `GetBranding`/`UpdateBranding`). Conferir se footer runtime (redes/atendimento/localização)
  está no schema de branding e no editor.
- **Falta (se ausente):** campos de footer no DTO de branding + seção no editor. Confirmar
  antes de implementar para não duplicar o que já existe.

### Roadmap (registrado, fora de escopo)

- Rastreio ao vivo do motoboy, roteirização, status de disponibilidade/capacidade,
  comprovante de entrega (`docs/11` › Roadmap).
- Atribuição automática de entrega por proximidade/disponibilidade (`docs/11`).
- Painel do `superAdmin` para empresas/variantes/planos (`docs/10` › Pontos em aberto).
- Exportação/comparativos/metas em relatórios (`docs/10`).
- Itens de benchmark em `docs/12` (PDV, estoque, fiado, NF, KDS dedicado, mesas/comandas,
  agendamento, fidelidade por pontos avançada, automações WhatsApp, recuperação de carrinho,
  integrações iFood/Ads/Pixel).

## Verification Criteria

- Cada gap MVP entregue: use case backend com teste, endpoint exportado, SDK regenerado,
  página/nav no painel quando aplicável, i18n dos enums/labels sincronizado e alfabetizado.
- `cd backend && bun run test:unit` e `cd frontend && bun run test:unit` passam.
- Nenhuma query nova sem filtro por `companyId`; guards de permissão aplicados.
- `frontend/src/lib/api/generated/` alterado apenas por `bun run generate`.

## Potential Risks and Mitigations

- **Escopo de tenant vazando** ao listar clientes/cupons — mitigar com filtro `companyId`
  obrigatório e teste que prova isolamento entre empresas.
- **Autenticação do courier em aberto** (`docs/11`) — resolver a decisão antes do Gap 3;
  registrar em `docs` se mudar de premissa.
- **Duplicar footer/notificações já existentes** — confirmar estado atual (Gaps 4-5) antes
  de codificar.

## Alternative Approaches

- Gap 3 courier como submódulo de `staff` (role `courier`) vs módulo `couriers` próprio —
  decidir conforme como a atribuição precisa consultá-los.
- Gap 4 templates: tabela dedicada vs campos JSON em `Company`/`Unit` — escolher pela
  granularidade exigida (por unidade?).

## Execution Protocol

- Entregar um gap por vez, começando por Gap 1 (Cupons) e Gap 2 (Clientes), que são CRUD
  fechados e de baixo risco.
- Para cada um: backend + teste → `bun run export` → `bun run generate` → frontend + i18n
  → rodar `test:unit` de ambos os lados.
- Gaps 4-5 exigem confirmação do estado atual antes de abrir código.
