# Taxa de entrega por raio de distância

## Status: concluído

Todas as 10 seções do plano foram implementadas e commitadas:
- `ecfcd68` schema (DeliveryZone + deliveryFeeFallbackEnabled)
- `38c741c` backend (Brasil API V2, lat/lng, CRUD de zonas, SimulateFreight)
- `ab012f0` frontend (admin de zonas/fallback, captura de lat/lng, uso do
  frete simulado no checkout)

Backend `bun test` (156 pass) e `check-types`, frontend `check-types`,
`build` e `bun test` (9 pass) todos verdes no momento do commit.

## Contexto

Hoje `Unit.deliveryFee` é um valor fixo por unidade. `docs/09` já lista "por
distância/raio" como estratégia de frete em aberto. O schema já tem
`latitude`/`longitude` em `Unit` e `Address` (não populados hoje), e o endpoint
`SimulateFreight` existe mas não é chamado pelo frontend nem calcula nada — só
devolve o `deliveryFee` fixo.

O CEP hoje é resolvido via ViaCEP (`LookupCep.ts`), que não retorna coordenadas.
Vamos trocar para a **Brasil API CEP V2**
(`https://brasilapi.com.br/api/cep/v2/{cep}`), que retorna
`location.coordinates.{longitude,latitude}`, e usar essas coordenadas para
calcular a distância (haversine, linha reta) entre a unidade e o cliente na
hora de simular o frete. Cada unidade poderá cadastrar faixas "até X km → R$
Y, Z min–Z min":

- Decisões já validadas com o usuário:
  - Faixas são só "até X km" (raio máximo), ordenadas crescente — sem
    min/max explícito.
  - Se a distância exceder todas as faixas (ou a unidade não tiver
    faixas/coordenadas), cai no `deliveryFee` fixo da unidade como
    **fallback**, habilitado por padrão, mas com um toggle na unidade
    (`deliveryFeeFallbackEnabled`) para desabilitar — nesse caso, fora de
    área é bloqueado (erro).

## Plano

### 1. Schema (`packages/sql/src/models`)

- `unit.prisma`: adicionar `deliveryFeeFallbackEnabled Boolean @default(true)`
  e relação `deliveryZones DeliveryZone[]`.
- Novo arquivo `delivery-zone.prisma`:
  ```prisma
  /// A distance-based delivery fee band for a unit. Zones are ordered ascending
  /// by radiusKm; the first zone whose radius covers the customer's distance wins.
  model DeliveryZone {
      id            String   @id @default(cuid())
      unitId        String
      radiusKm      Float
      fee           Int
      etaMinMinutes Int?
      etaMaxMinutes Int?
      createdAt     DateTime @default(now())
      updatedAt     DateTime @updatedAt

      unit Unit @relation(fields: [unitId], references: [id], onDelete: Cascade)

      @@unique([unitId, radiusKm])
      @@index([unitId])
      @@map("delivery_zone")
  }
  ```
- Rodar `cd packages/sql && bun run migrate` (gera migration `--create-only`,
  revisar SQL, depois aplicar) e `bun run export` (prisma generate).

### 2. Backend — CEP via Brasil API V2 (`backend/src/modules/cep`)

- `LookupCep.ts`: trocar endpoint para
  `https://brasilapi.com.br/api/cep/v2/${cep}`. Formato de resposta:
  ```json
  { "cep", "state", "city", "neighborhood", "street", "service",
    "location": { "type", "coordinates": { "longitude", "latitude" } } }
  ```
  - 404 (CEP não encontrado) → `CepErrors.CEP_NOT_FOUND` (checar `response.ok`
    em vez do padrão `{erro:true}` do ViaCEP).
  - `location.coordinates` pode vir ausente para CEPs sem geolocalização —
    tratar como `null`.
- `CepReturn` DTO: adicionar `latitude: t.Nullable(t.Number())`,
  `longitude: t.Nullable(t.Number())`.
- Atualizar `LookupCep.test.ts` para o novo shape de resposta (mock
  `fetch`), cobrindo: sucesso com coordenadas, sucesso sem `location`, 404,
  CEP inválido, falha de rede.

### 3. Backend — capturar lat/lng nos endereços existentes

- `AddressInput` (`backend/src/modules/customers/dtos/CustomerInput.ts`):
  adicionar `latitude`/`longitude` opcionais nullable.
- `UpsertCustomer.mapAddress`: persistir `latitude`/`longitude`.
- `UnitInput.ts` (`fields`): adicionar `latitude`/`longitude` opcionais
  nullable e `deliveryFeeFallbackEnabled` opcional boolean.

### 4. Backend — CRUD de faixas (`backend/src/modules/units`)

- Novo DTO `DeliveryZoneInput.ts`: `CreateDeliveryZoneBody` (`radiusKm:
  number > 0`, `fee: int >= 0`, `etaMinMinutes?`, `etaMaxMinutes?`),
  `UpdateDeliveryZoneBody` (mesmos campos, todos opcionais), e
  `DeliveryZoneReturn.ts`.
- Novos use cases, seguindo o padrão de `UpdateUnit.ts` (recebe
  `companyId` do escopo, valida a unidade pertence à empresa antes de
  mexer na zona):
  - `ListDeliveryZones.ts` — lista ordenada por `radiusKm` asc.
  - `CreateDeliveryZone.ts`
  - `UpdateDeliveryZone.ts`
  - `DeleteDeliveryZone.ts`
- Rotas em `UnitsController.ts` (autenticado, mesmo padrão de
  `scope.companyId`):
  - `GET /units/:unitId/delivery-zones`
  - `POST /units/:unitId/delivery-zones`
  - `PATCH /units/:unitId/delivery-zones/:zoneId`
  - `DELETE /units/:unitId/delivery-zones/:zoneId`

### 5. Backend — `SimulateFreight` com distância real

- `FreightSimulateBody`: adicionar `latitude: t.Number()`,
  `longitude: t.Number()` (coordenadas do cliente, computadas no frontend
  a partir do CEP).
- `FreightSimulateReturn`: adicionar `etaMinMinutes?: t.Integer()`,
  `etaMaxMinutes?: t.Integer()`, `distanceKm?: t.Number()`.
- Novo helper `backend/src/shared/utils/geo.ts` com `haversineKm(a, b)`
  (não existe utilitário de distância no repo hoje).
- Reescrever `SimulateFreight.ts`:
  1. Buscar unit com `latitude`, `longitude`, `deliveryFee`,
     `deliveryFeeFallbackEnabled`, `deliveryZones` (ordenadas por
     `radiusKm` asc).
  2. Se a unit não tiver coordenadas cadastradas → tratar como "sem zona
     correspondente" (pula pro fallback/erro do passo 4).
  3. Calcular `distanceKm = haversineKm(unit, cliente)`.
  4. Primeira zona com `radiusKm >= distanceKm` → retorna
     `{ deliveryFee: zone.fee, etaMinMinutes, etaMaxMinutes, distanceKm }`.
  5. Nenhuma zona cobre (ou não há zonas, ou não há coordenadas): se
     `deliveryFeeFallbackEnabled` → `{ deliveryFee: unit.deliveryFee,
     distanceKm }` (sem eta); senão → `DomainError(UnitErrors
     .OUT_OF_DELIVERY_RANGE)`.
- `UnitErrors`: adicionar `OUT_OF_DELIVERY_RANGE` (status 422/BAD_REQUEST).
- Atualizar `freight.test.ts` cobrindo: sem zonas (fallback fixo), dentro
  de zona, fora de todas as zonas com fallback ligado, fora de todas as
  zonas com fallback desligado (erro), unit sem coordenadas.

### 6. Regenerar SDK do frontend

- Backend: `bun run export` (regenera `backend/generated/openapi.json`).
- Frontend: regenerar SDK (`generated/`) conforme convenção do projeto —
  **nunca editar `frontend/src/lib/api/generated/` manualmente**.

### 7. Frontend — capturar lat/lng nos formulários de endereço

- `UnitAddressEditor.tsx` (admin) e `AddressForm.tsx` (checkout): estender
  `AddressState`/`AddressValue` com `latitude`/`longitude` (nullable,
  não exibidos como input — só carregados da resposta de `getCepByCep` em
  `lookupCep()` e enviados no payload).
- `checkout/index.tsx` (`handleAddressSubmit`): incluir
  `latitude`/`longitude` no objeto `address` enviado a `saveCustomer`.

### 8. Frontend — admin: gerenciar faixas por unidade

- Nova pasta `frontend/src/routes/admin/units/components/UnitDeliveryZonesEditor/`
  (composição, por causa da tabela editável): `index.tsx` (modal + estado),
  linha editável em arquivo próprio (`UnitDeliveryZoneRow.tsx`), seguindo o
  padrão de tabela editável já usado em `UnitProductsTable.tsx` (preserva
  layout/colunas entre modo leitura e edição). Campos por linha: raio (km,
  `NumericInput`), taxa (`NumericInput` com prefixo "R$ "), ETA min/max
  (minutos). Ações: adicionar linha, remover linha, salvar (usa os novos
  hooks gerados do CRUD).
- Também no editor de unidade: campo/toggle para
  `deliveryFeeFallbackEnabled` (perto do `deliveryFee` fixo em
  `UnitConfigEditor.tsx`, com texto explicando que é o fallback quando o
  endereço está fora de todas as faixas).
- Entrada de acesso ao editor de faixas ao lado dos botões existentes
  (Config/Endereço) em `UnitsTable.tsx`.

### 9. Frontend — usar o frete simulado no checkout

- `OrderReview.tsx` já recebe `unitId`/`slug` (hoje só usados pra cupom).
  Ao montar a etapa de review (endereço já salvo em `address`), chamar
  `usePostPublicFreightSimulate` com `{ slug, unitId, latitude:
  address.latitude, longitude: address.longitude }` quando
  `deliveryMethod === "delivery"` e o endereço tiver coordenadas.
- Estados: loading (mostra "calculando frete…"), erro
  `OUT_OF_DELIVERY_RANGE` (mostra aviso e bloqueia "Finalizar pedido" para
  `delivery`, sugerindo retirada se disponível), sucesso (usa
  `deliveryFee`/`etaMinMinutes`/`etaMaxMinutes` retornados no lugar do
  `unitDeliveryFee` estático atual).
- Exibir a janela de tempo estimado (`etaMinMinutes`–`etaMaxMinutes`)
  junto da taxa de entrega no resumo, quando presente.
- Endereços sem coordenadas (CEP sem `location` na Brasil API, ou
  endereço salvo antes desta feature): seguir usando o fallback
  fixo (mesmo comportamento do backend quando não há coordenadas).

### 10. i18n

- Único locale hoje é `frontend/src/i18n/locales/pt-BR.json` — adicionar
  todas as chaves novas lá (faixas de entrega no admin, toggle de
  fallback, mensagens de "fora da área de entrega", "calculando frete",
  ETA no resumo do pedido), respeitando ordem alfabética dentro de cada
  namespace.

## Verificação

- Backend: `bun test` nos arquivos tocados (`LookupCep.test.ts`,
  `freight.test.ts`, novo teste de CRUD de zonas) + `bun run check-types`
  no backend.
- Frontend: `bun run check-types` + `bun run build` no frontend.
- Fluxo manual: subir o dev server, cadastrar faixas numa unidade no
  admin (com endereço da unidade preenchido via CEP), simular checkout com
  um endereço próximo (deve pegar a faixa certa) e um endereço bem
  distante (deve cair no fallback ou bloquear, conforme o toggle).
