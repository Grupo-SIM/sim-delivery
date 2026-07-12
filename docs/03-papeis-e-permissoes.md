# 03 — Papéis e Permissões

Controle de acesso via **Permix** (já em `backend/package.json`). Toda permissão é
escopada por `companyId`; permissões operacionais podem ainda ser escopadas por
`unitId`.

## Papéis (roles)

| Role | Quem | Escopo |
|---|---|---|
| `superAdmin` | Operador da plataforma (você). Cria empresas, variantes, planos. | Cross-tenant (todas as empresas). |
| `owner` | Dono da empresa. Acesso total ao próprio tenant. | 1 empresa (todas as unidades). |
| `manager` | Gerente — quase tudo do `owner`, exceto branding/variante, gestão de outros donos e exclusão da empresa. | 1 empresa, opcional 1..N unidades. |
| `attendant` | Atendente/caixa — cria e acompanha pedidos, atende clientes, aplica cupons. Sem acesso a relatórios financeiros nem edição de cardápio. | 1 empresa, opcional 1..N unidades. |
| `kitchen` | Cozinha — vê pedidos em preparo, muda status de produção. Sem finanças nem cadastro. | 1 empresa, opcional 1..N unidades. |
| `courier` | Motoboy. Vê e atualiza suas entregas. | Entregas atribuídas. |
| `customer` | Consumidor final (app). | Próprios pedidos/dados. |

Ponto em aberto: se `manager`/`attendant`/`kitchen` são vinculados a unidades específicas
(permissão por unidade) ou à empresa toda. Ver "Pontos em aberto".

## Matriz de permissões (ação × role)

Legenda: ✅ total · 🟡 limitado/escopado · ⛔ nenhum.

| Ação | superAdmin | owner | manager | attendant | kitchen | courier | customer |
|---|---|---|---|---|---|---|---|
| Criar/editar empresa | ✅ | ⛔ | ⛔ | ⛔ | ⛔ | ⛔ | ⛔ |
| Gerir variantes/branding | ✅ | ✅ | ⛔ | ⛔ | ⛔ | ⛔ | ⛔ |
| Gerir unidades | ✅ | ✅ | ✅ | ⛔ | ⛔ | ⛔ | ⛔ |
| Gerir cardápio (produtos/categorias/tags) | ✅ | ✅ | ✅ | ⛔ | ⛔ | ⛔ | ⛔ |
| Gerir cupons/promoções | ✅ | ✅ | ✅ | 🟡 aplicar | ⛔ | ⛔ | ⛔ |
| Ver/gerir pedidos | ✅ | ✅ | ✅ | ✅ | 🟡 produção | 🟡 entrega | 🟡 próprios |
| Mudar status de pedido | ✅ | ✅ | ✅ | ✅ | 🟡 preparo | 🟡 entrega | ⛔ |
| Ver/gerir clientes | ✅ | ✅ | ✅ | 🟡 leitura | ⛔ | ⛔ | 🟡 próprio |
| Gerir staff (convites/papéis) | ✅ | ✅ | 🟡 abaixo de si | ⛔ | ⛔ | ⛔ | ⛔ |
| Gerir motoboys / atribuir entregas | ✅ | ✅ | ✅ | 🟡 atribuir | ⛔ | ⛔ | ⛔ |
| Ver relatórios/financeiro | ✅ | ✅ | ✅ | ⛔ | ⛔ | ⛔ | ⛔ |
| Config de pagamentos/frete | ✅ | ✅ | ✅ | ⛔ | ⛔ | ⛔ | ⛔ |
| Fazer pedido (app) | ⛔ | ⛔ | ⛔ | ⛔ | ⛔ | ⛔ | ✅ |

Regra objetiva: `superAdmin` é o único role cross-tenant; todos os demais são
estritamente filtrados por `companyId`.

## Implementação (Permix)

Seguir o padrão do módulo example em
[backend/src/modules/example/permissions/example.ts](../backend/src/modules/example/permissions/example.ts):
`createPermix<Def>()` + `setup(...)` por role, exposto por módulo. Cada domínio
(`orders`, `menu`, `units`, `customers`, `staff`, `deliveries`, `reports`, `branding`)
define suas ações no schema Permix e um guard em `modules/<x>/guards` que resolve o role
do usuário autenticado (Better Auth) e o `companyId` do contexto.

Esboço do schema:

```ts
interface PermissionSchema extends PermixDefinition {
  units:      { action: "read" | "create" | "update" | "delete" };
  menu:       { action: "read" | "create" | "update" | "delete" };
  orders:     { action: "read" | "create" | "updateStatus" };
  customers:  { action: "read" | "update" };
  staff:      { action: "read" | "invite" | "setRole" | "remove" };
  deliveries: { action: "read" | "assign" | "updateStatus" };
  coupons:    { action: "read" | "create" | "apply" };
  reports:    { action: "read" };
  branding:   { action: "read" | "update" };
}
```

O `setup` liga cada ação conforme a tabela acima, derivando apenas de `role`. Ações
escopadas por unidade recebem o `unitId` no `check`.

## Autenticação

- Staff/motoboy: Better Auth (email+senha) — ver `backend/src/shared/infra/betterAuth.ts`.
- Cliente: **login passwordless** (email + celular) no checkout — ver
  [08-app-cliente.md](08-app-cliente.md).

## Pontos em aberto

- Permissão de `manager`/`attendant`/`kitchen` por unidade vs por empresa (multi-unidade).
- Se `manager` pode gerir outros `manager` ou só níveis abaixo.
- Papel de "financeiro" dedicado (roadmap, quando entrar módulo financeiro/caixa).
- Como `courier` autentica (mesmo Better Auth ou fluxo próprio) — ver [01](01-visao-geral-e-dominio.md).
