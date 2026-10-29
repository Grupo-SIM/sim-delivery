# 0019 — Rastreamento Meta Pixel + API de Conversões (CAPI)

Fonte: "Estação 237 Delivery | Especificação Técnica de Rastreamento Meta Pixel + CAPI" v1.0 (29/10/2026).
Pixel/dataset: `2988561144814612`. Site: `https://delivery.estacao237ac.com`.

## Regra inegociável

Pix pago confirmado no backend = **um** `Purchase` lógico (valor pago, timestamp da aprovação, `event_id` persistente). Pix pendente/falho/expirado/cancelado, tela de sucesso e repetição técnica **não** geram Purchase.

## Estado atual (código)

- `frontend/src/hooks/use-tracking.ts` injeta Pixel (`fbq('init')` + `PageView`), GA4, GTM a partir de `branding.metaPixelId` (`Company.metaPixelId`, `GetBranding`/`UpdateBranding`). Só PageView; nenhum outro evento.
- Pagamento: `ApplySimpayPaymentStatus` → `ConfirmPayment` (webhook canônico Simpay `canonical-webhooks.ts` + `ReconcilePendingPayments`). `ConfirmPayment` só transiciona `pending → confirmed` uma vez — ponto único para gancho do Purchase.
- Pixel hoje é por empresa (multi-tenant). Spec trata um único pixel; manter por empresa e adicionar token CAPI por empresa.

## Decisões

1. **Decidido:** token CAPI por empresa (`Company.metaCapiToken`, secreto, nunca no `GetBranding`).
2. **Decidido:** `value` do Purchase = total pago pelo cliente (`order.total`).
3. **Decidido:** Purchase só via CAPI (sem `fbq('track','Purchase')` no navegador).

4. **Decidido:** adicionar banner de cookies e política de privacidade (hoje não existem; sem rotas, sem i18n, sem consentimento). Ver Etapa 0.
5. **Decidido:** cartão aprovado também emite Purchase, pelo mesmo gancho `ConfirmPayment`. Distinção por `payment_method` (`pix` | `card`): Meta aceita parâmetros customizados em `custom_data` (evento tem metadados), então vai `custom_data.payment_method` na CAPI e coluna `paymentMethod` em `MarketingEvent`. `AddPaymentInfo` dispara no submit do `CardPaymentForm`; no Pix não.
6. **Decidido:** cliente que recusa cookies de marketing ⇒ **nenhum** Purchase enviado (nem anônimo). Conciliação com banco continua possível pelos pedidos pagos (T14 considera `marketingConsent=false` como "não enviado por consentimento").
7. **Pendente (jurídico):** revisar a minuta `docs/legal/politica-de-privacidade.md`, preencher campos `[...]` por loja e confirmar bases legais/retenção. Não bloqueia código.

## Mapa do frontend (levantado)

| Evento | Onde disparar | Observação |
|---|---|---|
| PageView | `use-tracking.ts` (carga) + listener do router em `routes/__root.tsx` | `useTracking` roda no root; já injeta o `fbq('track','PageView')` no load. Falta PageView em navegação SPA. |
| ViewContent | `routes/_storefront/$unitId/components/ProductDetailsModal/index.tsx` (abertura do modal de produto) | Modal é URL-backed; disparar na abertura (efeito com id do produto), não ao editar item do carrinho (`editingItem`). |
| AddToCart | `stores/cart.ts` `addItem` (centralizado) | Chamado por `ProductDetailsModal` (linha ~189) e `CartSuggestions.addDirectly`. Disparar dentro do `addItem` cobre os dois e evita duplicata. `replaceItem` (edição) **não** dispara. Mudança de quantidade (`setQuantity`) não dispara. |
| InitiateCheckout | `routes/_storefront/$unitId/checkout/index.tsx` | Disparar uma vez na entrada com carrinho não vazio (ref/`sessionStorage` por `checkoutIdempotencyKey`); `step` muda identify→review→payment sem re-disparo. |
| AddPaymentInfo | `checkout/components/PaymentStep` | Pix: não (gerado automático). Cartão: só no submit do `CardPaymentForm` (decisão 5). |
| CompleteRegistration | `routes/_storefront/identify` (+ `magic-link`) e `IdentifyForm` do checkout | Só quando conta/customer é criado pela 1ª vez (resposta indica novo usuário), não a cada login. A confirmar: backend precisa informar "recém-criado". |
| Search | `StoreToolbar.tsx` (`useDebouncedInput`, prop `onSearchChange`) | Já debounced; disparar quando termo estável ≥ 2 chars, no máx. 1×/termo. |
| Contact | `UnitContactLinks.tsx` (link `wa.me/...`) | Disparar no `onClick` do link de WhatsApp; telefone/Instagram/X não. |
| Purchase | **só backend (CAPI)** | `thank-you`/`orders/$orderId` e `PixPanel` **não** disparam nada. |

Dados disponíveis para `contents`: `CartItem` tem `id` (unitProduct id), `productId`, `priceCents`, `quantity`, `options`. **Escolha de `content_ids`: usar `productId`** (estável entre unidades) em todos os eventos e na CAPI; `value` = Σ `priceCents × quantity` em BRL (converter centavos → reais).

## Etapa 0 — Consentimento e privacidade (pré-requisito)

- **Política de privacidade**: minuta pronta em `docs/legal/politica-de-privacidade.md` (pendente revisão jurídica). Nova rota pública `routes/_storefront/privacidade/index.tsx` (ou por empresa, se cada loja precisar de controlador próprio — confirmar: o controlador dos dados é a empresa lojista; a plataforma é operadora). Conteúdo: dados coletados (nome, CPF, telefone, e-mail, endereço, pedidos), finalidades, uso de Meta Pixel/CAPI/GA4/GTM, compartilhamento com Meta (dados com hash), cookies, direitos do titular (art. 18 LGPD), contato do encarregado, retenção. Texto final precisa de revisão jurídica; publicar na rota a partir da minuta (i18n pt-BR/en-US).
- **Base legal**: dados do pedido/entrega/pagamento → execução de contrato (art. 7º, V). Pixel no navegador e envio de dados pessoais (e-mail, telefone) à Meta com fins de publicidade → **consentimento** (art. 7º, I) é o caminho mais seguro, em vez de legítimo interesse. Logo: o banner controla Pixel e o envio de PII à CAPI.
- **Banner de cookies**: componente `components/consent/CookieBanner` (+ `useConsent`, store zustand persistido `stores/consent.ts`), categorias: necessários (sempre), analytics (GA4/GTM), marketing (Meta Pixel). Botões "Aceitar todos", "Recusar", "Personalizar" (mesmo peso visual, sem dark pattern); link para a política; reabrir preferências via rodapé. Modal de preferências usa `Modal` com `urlKey`/`urlState` (regra do projeto). i18n em todos os locales (`pt-BR`, `en-US`); `Checkbox` custom; sem `<select>` nativo.
- **Integração**: `useTracking` só injeta Pixel/GA4/GTM após consentimento da categoria correspondente; helper `trackPixel` vira no-op sem consentimento de marketing. Consentimento revogado ⇒ parar de enviar (recarregar para limpar).
- **Consentimento no backend**: enviar `marketingConsent: boolean` junto com `attribution` no `CreateOrder`; persistir no pedido. A CAPI só envia `em`/`ph`/`external_id`/`fbp`/`fbc`/IP/UA quando `marketingConsent=true`; sem consentimento, **não** enviar Purchase (decisão 6); `MarketingEvent` fica `status=skipped_no_consent`.
- Admin: indicar na tela de empresa que o Pixel só dispara com consentimento.

## Etapa 1 — Frontend: eventos do Pixel

Arquivos: `use-tracking.ts` + novo `frontend/src/lib/meta-pixel.ts` (helper `trackPixel(event, params, eventID?)`, no-op sem `fbq` ou sem consentimento de marketing). Pontos de disparo: ver "Mapa do frontend".

1. Validar PageView sem carga duplicada do script (guard `id` já existe; checar StrictMode/troca de `metaPixelId` ao vivo via `use-live-branding.ts`). Disparar PageView em navegação SPA real (listener do router TanStack), sem duplicar o do load inicial.
2. `ViewContent`: abertura do `ProductDetailsModal`. Params: `content_ids`, `content_type='product'`, `contents`, `value`, `currency='BRL'`. Guard por produto aberto (ref/efeito por id), não por render.
3. `AddToCart`: dentro de `addItem` em `stores/cart.ts` (cobre modal e `CartSuggestions`); `contents[{id,quantity}]`, `value`, `BRL`. `replaceItem`/`setQuantity` não disparam.
4. `InitiateCheckout`: ao entrar efetivamente no checkout (`checkout/index.tsx`), uma vez por entrada; valor atual do carrinho + itens. Sem re-disparo em mudança de campo.
5. Condicionais conforme UI: `Search` (busca do cardápio, debounced, `search_string`), `CompleteRegistration` (conta criada com sucesso), `Contact` (clique WhatsApp). `AddPaymentInfo` só se houver ação real de escolha de pagamento.
6. IDs: `content_ids` = ID estável do produto (id do produto no banco; mesma escolha em todos os eventos e na CAPI). `value` coerente com `contents`.
7. Captura de atribuição (alimenta Etapa 2): util `frontend/src/lib/attribution.ts` (só grava após consentimento de marketing) — ler cookies `_fbp`, `_fbc`; se ausente `_fbc` e URL tem `fbclid`, montar `fb.1.<ts>.<fbclid>`; guardar UTMs + `fbclid` + `landing url` em `localStorage` (first-touch preservado, TTL ~90 dias). Nunca inventar `_fbp`/`_fbc`.
8. Evidências: Gerenciador de Eventos > Eventos de teste (prints sem dados pessoais). Testes T01–T03.

## Etapa 2 — Backend: vincular origem, pedido e pagamento

Arquivos: `packages/sql/models` (+ migration), `backend/src/modules/orders` (`CreateOrder`, DTO), novo módulo `backend/src/modules/tracking`.

1. Schema: em `Order` (ou tabela `OrderAttribution` 1:1): `fbp`, `fbc`, `fbclid`, `utm*` (source/medium/campaign/term/content), `clientIp`, `clientUserAgent`, `eventSourceUrl`. IP/UA capturados no `CreateOrder` a partir da requisição (headers `x-forwarded-for`/`user-agent` — validar proxy confiável), não do servidor depois.
2. DTO `CreateOrder` (TypeBox, sem `t.Intersect`): campos opcionais `attribution` (`fbp`, `fbc`, `fbclid`, `utm*`, `sourceUrl`) e `marketingConsent` (boolean). `placeOrder` em `checkout/index.tsx` envia ambos. Frontend envia no submit do checkout. Regenerar SDK (`bun run export` no backend → `bun run generate` no frontend; skill `backend-endpoint-sdk`).
3. Confirmação autenticada de Pix pago: já existe via webhook Simpay canônico + `ReconcilePendingPayments`. Auditar: assinatura/validação do webhook, confere valor e status final, status desconhecido/pendente nunca confirma. Cobre T10 (cliente fechou o navegador).
4. Tabela `MarketingEvent` (outbox): `id`, `orderId`, `companyId`, `eventName` (`Purchase`), `eventId` (`purchase_<uuid>`, gerado na criação do registro), `eventTime` (timestamp real da confirmação, em segundos), `value`, `currency`, `payload` (json), `paymentMethod` (`pix|card`), `status` (`pending|sent|failed|skipped_no_consent`), `attempts`, `nextAttemptAt`, `lastError`, `metaResponse`, `sentAt`. **Unique `(orderId, eventName)`** (idempotência camada B).
5. Gancho atômico: dentro da mesma transação que marca `payment.status = confirmed` em `ConfirmPayment` (só quando `count > 0`, ou seja, na transição real), inserir `MarketingEvent` com `createMany skipDuplicates` / catch de unique. Transação garante pedido pago ⇒ evento gravado; webhook repetido/paralelo ⇒ no-op.
6. Fila/outbox: worker (padrão dos jobs existentes, ex. `CancelExpiredUnpaidOrders`/`ReconcilePendingPayments`) pega `pending` com `nextAttemptAt <= now` usando lock (`FOR UPDATE SKIP LOCKED` ou update condicional), envia, grava resposta; backoff exponencial; reenvia **mesmo** `event_id` e `event_time`. Limite de prazo da CAPI (7 dias de `event_time`) → marcar `failed` terminal com log.
7. Logs de sucesso/falha/tentativas/resposta da Meta (colunas acima + log estruturado). Cancelamento/reembolso posterior: só registrar internamente (campo/ evento interno), sem tentar "desfazer" na Meta.

## Etapa 3 — CAPI: envio de Purchase

Arquivos: `backend/src/shared/infra/meta-capi.ts` (cliente, estilo de `simpay.ts`), `backend/src/env.ts`.

1. `POST https://graph.facebook.com/<versão>/<pixelId>/events?access_token=...` (versão como constante configurável). Token em env/segredo ou coluna criptografada; nunca em `GetBranding`/frontend/repo.
2. Payload: `event_name='Purchase'`, `event_id`, `event_time`, `action_source='website'`, `event_source_url`, `user_data`, `custom_data` (`value`, `currency='BRL'`, `payment_method`, `content_ids`, `contents`, `content_type='product'`, `order_id` interno em custom_data opcional).
3. `user_data`: `fbp`, `fbc`, `client_ip_address`, `client_user_agent` **sem hash**; `em`, `ph`, `fn`/`ln`, `external_id` com SHA-256 após normalização (lowercase/trim e-mail; telefone só dígitos com DDI `55`). Enviar só o que existe **e** só se `marketingConsent=true` no pedido (Etapa 0).
4. Envio só da fila (nunca inline no webhook, para não atrasar a resposta ao gateway). Suporte a `test_event_code` via env para homologação.
5. Env novas (`backend/src/env.ts`): `META_CAPI_API_VERSION`, `META_CAPI_TEST_EVENT_CODE` (opc.), token (conforme decisão 1). Sem token ⇒ evento fica `pending`/`skipped` com aviso, não quebra pagamento.
6. UI admin (`routes/admin/company`): campo do token CAPI (write-only, mascarado) + indicador de status; i18n em **todos** os locales; placeholders/máscaras conforme CLAUDE.md. `UpdateBranding` não devolve o token.

## Etapa 4 — Deduplicação (duas camadas)

- **A (Pixel × CAPI):** Purchase só via CAPI ⇒ sem duplicata. Se decisão 3 mudar: endpoint de status do pedido (`GetCustomerOrder`/stream de pagamento) devolve `purchaseEventId` **somente** quando pago; frontend dispara `fbq('track','Purchase',{value,currency},{eventID})` uma vez por `eventId` (flag em `sessionStorage`). Mesmo `event_name` + `event_id` nos dois canais.
- **B (idempotência interna):** unique `(orderId, eventName)` + transação do `ConfirmPayment` + update condicional de status do outbox. Recarregar tela de sucesso, webhook repetido, paralelismo e retry nunca criam 2º registro. Duas compras distintas ⇒ `event_id` distintos (uuid por registro).

## Etapa 5 — Testes e homologação

Automatizados (integração, `bun:test`, backend, DB descartável via `scripts/test-runner.ts`; **sem unit/coverage gates novos** — seguir convenção do repo, ver `AGENTS.md`):

| Teste | Cobertura |
|---|---|
| T04/T05 | Pix ou cartão pendente/expirado/cancelado/recusado ⇒ 0 Purchase enviável |
| T06 | Pago (Pix e cartão) ⇒ 1 evento, BRL, valor correto, `payment_method` correto |
| T06b | `marketingConsent=false` ⇒ `skipped_no_consent`, nada enviado |
| T07 | Mesmo webhook 2+× ⇒ 1 registro |
| T08 | Webhooks simultâneos (`Promise.all`) ⇒ 1 registro |
| T09 | Endpoint de status/refresh ⇒ nenhum evento novo |
| T10 | Confirmação sem sessão do cliente ⇒ Purchase via CAPI |
| T11 | CAPI falha ⇒ retry com mesmo `event_id`/`event_time`, 1 registro lógico |
| T13 | 2 pedidos pagos ⇒ 2 eventos, IDs distintos |
| T14 | Script de conciliação: pedidos pagos × `MarketingEvent` enviados (SQL/CLI em `scripts/`) |

Manuais com pixel real/Eventos de teste (evidência com prints, sem PII): T01–T03 (frontend), T06/T10 com Pix real de baixo valor, T12 (dedup se houver Pixel + CAPI). Status/evidência/correção de T01–T14 documentados no fim deste plano.

## Etapa 6 — Docs e entrega

- `docs/business-rules.md`: regra do Purchase, definição de `value`, retenção de dados de atribuição, LGPD.
- Relatório para a gestão de tráfego (Eloi): eventos ativos, origem (Pixel/CAPI), gatilhos, campos, mecanismo de `event_id`, tratamento de webhooks/retries, comprovantes. Eloi fornece token CAPI, verifica domínio, acompanha Diagnóstico/Qualidade de Correspondência.
- Só após homologação campanhas de Vendas otimizam por Purchase. PageView ativo ≠ integração concluída.

## Ordem sugerida de commits (atômicos)

1. `feat(frontend)`: helper Pixel + atribuição + eventos ViewContent/AddToCart/InitiateCheckout (+ condicionais).
2. `feat(backend)`: schema atribuição + `CreateOrder` aceita atribuição (+ SDK regenerado, + frontend envia).
3. `feat(backend)`: `MarketingEvent` outbox + gancho em `ConfirmPayment` (+ testes T04–T09, T13).
4. `feat(backend)`: cliente CAPI + worker + retry (+ testes T10, T11).
5. `feat(frontend)`: campo de token CAPI no admin + i18n.
6. `docs`: regras de negócio, conciliação (T14), relatório.

## Riscos

- Migrations: rodar **só** em DB local descartável; checar host de `DATABASE_URL` (DB "dev" deste projeto é remoto). Nada de push/migrate remoto sem pedido explícito.
- Multi-tenant: token e pixel por empresa; worker deve resolver credenciais por `companyId`.
- Bloqueadores de anúncio derrubam Pixel mas não CAPI — esperado; não exigir paridade com relatório de campanhas.
- IP do cliente atrás de proxy: validar cabeçalho confiável, senão CAPI envia IP do proxy (piora match quality).

## Progresso

- [ ] Revisão jurídica da minuta (decisões 1–6 decididas)
- [ ] Etapa 0 (política de privacidade + banner de cookies + gating)
- [ ] Etapa 1
- [ ] Etapa 2
- [ ] Etapa 3
- [ ] Etapa 4
- [ ] Etapa 5 (T01–T14)
- [ ] Etapa 6
