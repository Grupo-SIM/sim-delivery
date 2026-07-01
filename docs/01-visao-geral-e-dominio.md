# 01 — Visão Geral e Domínio

## Produto

JB Delivery entrega, para cada empresa de televenda, um app de **cardápio online** (o
cliente monta o pedido e paga) e um **sistema básico de entrega** para o motoboy
acompanhar/atualizar entregas. A gestão (unidades, cardápio, pedidos, clientes, staff,
branding) acontece em um **painel do dono**. Ver [08-app-cliente.md](08-app-cliente.md),
[10-painel-do-dono.md](10-painel-do-dono.md) e [11-entregas-motoboy.md](11-entregas-motoboy.md).

## Multi-tenancy (regra objetiva)

- **Tenant = empresa**, identificado por `companyId`. Um único backend/DB servem todas.
- **Toda entidade de negócio carrega `companyId`** e toda query é filtrada por ele. Nenhum
  dado cruza tenants, exceto para `superAdmin` (ver [03-papeis-e-permissoes.md](03-papeis-e-permissoes.md)).
- Uma **variante** whitelabel do app aponta para exatamente uma empresa (via `VITE_API_URL`
  + config da variante). Ver [02-whitelabel-e-builds.md](02-whitelabel-e-builds.md).
- Uma empresa tem **1..N unidades**. Preços, horários, taxas e formas de pagamento podem
  variar por unidade.

## Entidades principais

| Entidade | Descrição | Escopo |
|---|---|---|
| **Company** (Empresa) | Tenant. Raiz de tudo. Dados de marca, plano, config global. | — |
| **Unit** (Unidade) | Loja física: endereço, horário, taxas, formas de entrega/pagamento. | `companyId` |
| **User** (Staff) | Usuário do painel: `owner` ou `employee` (com nível). | `companyId` |
| **Courier** (Motoboy) | Entregador vinculado à empresa/unidade. | `companyId` |
| **Customer** (Cliente) | Consumidor final. Login passwordless. | `companyId` |
| **Address** (Endereço) | Endereço de um cliente (deduzido por CEP). | `customerId` |
| **Category** (Categoria) | Agrupa produtos no cardápio (ex.: "Pão de queijo", "Promoções"). | `companyId` |
| **Product** (Produto) | Item vendável: título, imagem, descrição, preço, cashback. | `companyId` |
| **Tag** | Selo universal (nome + cor arbitrários): promoção, novidade, cashback, etc. | `companyId` |
| **UnitProduct** | Associação produto↔unidade (preço/disponibilidade por unidade). | `unitId` |
| **Order** (Pedido) | Compra de um cliente em uma unidade. Tem itens, status, entrega. | `companyId` |
| **OrderItem** | Item do pedido: produto, quantidade, observação, valor. | `orderId` |
| **Coupon** (Cupom) | Desconto aplicável no checkout. | `companyId` |
| **CashbackLedger** | Movimentos de cashback do cliente (acúmulo/resgate). | `customerId` |
| **Delivery** (Entrega) | Vínculo pedido↔motoboy + status de entrega. | `orderId` |

## Relacionamentos (diagrama textual)

```
Company (tenant)
├── Variant (whitelabel build) ── 1:1 ──> Company
├── User (owner | employee[nível])
├── Courier
├── Customer
│   ├── Address (N)
│   ├── CashbackLedger (N)
│   └── Order (N)
├── Category (N)
│   └── Product (N)  ── Tag (N:N)
├── Unit (N)
│   ├── horário / taxas / formas de pagamento e entrega
│   └── UnitProduct (N)  ── liga Product por categoria (ou avulso)
└── Order (N)
    ├── OrderItem (N) ── Product
    ├── Coupon (0..1)
    └── Delivery (0..1) ── Courier
```

## Convenções de domínio

- **Regra objetiva** (bloqueia): validações duras — ex.: pedido sem itens não é criado;
  unidade fechada não aceita pedido; cupom expirado é rejeitado.
- **Regra comportamental** (notifica/sugere): ex.: sugerir produtos no carrinho; enviar
  atualização de status por WhatsApp; destacar "peça novamente".
- Valores monetários em centavos (inteiro) no backend; formatação `R$` no frontend
  (`NumericFormat`).
- Enums de status são **contratos traduzíveis no frontend** — nunca renderizar valor cru
  (ver `AGENTS.md` › i18n).

## Stack de implementação (referência)

- Backend: Elysia + DTOs TypeBox + Prisma (`packages/sql`) + Better Auth + Permix.
  Padrão de módulo: `modules/<x>/{useCases,dtos,guards,permissions,infra}`.
- Frontend: Vite + TanStack Router + Tauri (Android/iOS/desktop) + i18n + SDK Kubb.

## Pontos em aberto

- Modelo de plano/cobrança da empresa (assinatura, limites por plano).
- Se `Courier` é um subtipo de `User` ou entidade separada com auth própria.
- Estratégia de `Address` reutilizável entre pedidos vs snapshot no pedido.
