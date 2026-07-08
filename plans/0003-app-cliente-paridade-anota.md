# Plan 0003 — App Cliente: Paridade de Fluxo/UX vs Anota.ai

> Continua a numeração de épicos do 0002 (que vai até É21). Mesmas convenções:
> um commit por passo, Conventional Commits, cada passo compila + passa testes,
> sem ações remotas sem instrução explícita.

## Contexto

A empresa (Sorveteria Zero Grau — Manoel Julião / "da6") opera hoje no **Anota.ai**
(múltiplas lojas/unidades da mesma marca). Objetivo: o app cliente deste projeto alcançar
e superar o fluxo/usabilidade dessa referência antes da migração. A análise abaixo está
fundamentada em **capturas reais** da interface Anota.ai fornecidas pelo dono e na auditoria
do app cliente atual do repo.

### O que a referência (Anota.ai) faz — verbatim das telas

- **Home da loja**: header com logo + nome + busca + compartilhar; sub-linha
  "**Aberto até 23h · Pedido mín. R$ 3,00**" e link "**Perfil da loja**". Faixa
  "**Os mais pedidos**" (carrossel horizontal) e depois **categorias em grid** (Açaí,
  Sorvetes, …). Cards com imagem, nome, descrição, preço; produtos com variação mostram
  "**A partir de R$ X**". **Tab bar inferior**: Início · Pedidos · Promos · Carrinho.
- **Página de categoria** dedicada (ex.: "Pizzas") com back + busca e grid de produtos.
  Para pizza, **cada tamanho é um produto**: "Pizza Pequena — 1 sabor e 4 fatias — a partir
  de R$ 48", "Média — até 2 sabores e 6 fatias", "Grande — até 3 sabores", "Família — até 4".
  → o **nº de sabores permitido (meio-a-meio) é atributo do tamanho**.
- **Página de produto** (rota própria, não modal), "Detalhes do produto": imagem + nome +
  preço + descrição; **busca dentro das opções** ("Pesquise pelo nome"); carrossel
  "**Sabores/itens mais pedidos**"; e **grupos de opção colapsáveis** empilhados. Cada grupo:
  título ("Sabor Pizza Pequena"), subtítulo ("Escolha 1 sabor" / "Escolha até 100 itens"),
  badge "**Obrigatório**" quando aplicável e **contador min/max "0 / 1"**. Cada opção tem
  **imagem + descrição + preço**; seleção é **radio** (single, "Máx 1", ex.: Sabor, Borda)
  ou **stepper "+"** com quantidade por opção (multi, ex.: Adicionais). Botão de rodapé
  muda conforme validação ("Escolha sabor" → "Avançar").
- **Preço**: para pizza, o **preço do produto = preço do sabor escolhido** (por isso
  "a partir de"); meio-a-meio soma/usa o maior entre sabores. Adicionais/borda somam deltas.
- **Confirmação pós-opções**: modal "**X adicionado ao carrinho!**" com **Quantidade**
  (stepper) e **Observações** (textarea "Ex.: Tirar cebola, ovo…"), botões "Continuar
  comprando" e "Avançar para o carrinho". → quantidade e observação vêm **depois** das opções.
- **Carrinho**: cada linha mostra "1x Pizza Pequena — R$ 72,00" com as **opções escolhidas
  listadas abaixo** ("Sabor: 1/1 Cupim", "Borda: 1x Cheddar"), **lápis para editar**, trash,
  stepper. Faixa "**Peça também**" (sugestões) + "Adicionar mais produtos" + "Limpar".

### Estado atual do app cliente (auditoria do repo)

Fluxo em `frontend/src/routes/$unitId/…`:
- Unidade (`routes/index.tsx`) → cardápio (`$unitId/index.tsx`).
- `components/MenuBrowser.tsx`: busca com debounce, `PromoCarousel`, `CategorySummary` +
  `CategoryNav`, `MenuSectionBlock` (âncora de scroll — **sem rota por categoria**).
- **`PromoCarousel.tsx`**: faixa de destaque derivada de **cashback** (não popularidade/
  featured) — diverge de "Os mais pedidos".
- **`MenuItemCard.tsx`**: adiciona produto **plano num clique** — **sem página de produto,
  sem opções, sem observação no add**.
- Carrinho (`CartModal`/`CartBar`/`CartItemRow`, store `stores/cart.ts`): nota + quantidade
  por item, `CartSuggestions`. `CartItem` = id, note, quantity, priceCents, productId, title,
  imageUrl — **sem opções**.
- Checkout (`$unitId/checkout/index.tsx`): identify (passwordless) → profile → address →
  review (toggle delivery/pickup **aqui**, cupom, cashback) → payment (iframe) → thank-you.

Schema (`packages/sql/src/models/`): `Product` é **flat** (`title, imageUrl, description,
basePriceCents, cashbackPercentOverride`); `OrderItem` tem `note` mas **sem snapshot de
opções**. `Unit.deliveryMethods` e `Order.deliveryMethod` (delivery|pickup) já existem.
`Unit` **não tem** `minOrder`/ETA. Docs `05-cardapio.md` marcam "adicionais/opcionais,
variações (tamanho)" e destaques manuais como pendências.

## Diferenças priorizadas (gap analysis)

| # | Diferença vs Anota.ai | Impacto | Épico |
|---|---|---|---|
| 1 | Sem customização de produto: página, grupos de opção, tamanho, sabores/meio-a-meio, borda, adicionais | **Crítico** — bloqueia sorveteria/pizzaria | É22 |
| 2 | Destaque = cashback (deveria ser **featured manual → depois mais pedidos reais**) | Alto | É23 |
| 3 | Delivery/Retirada só no checkout (Anota.ai: pedido mín./ETA/entrada) | Alto | É24 |
| 4 | Header pobre + sem pedido mínimo (ETA, "aberto até", taxa, perfil da loja) | Alto | É24 |
| 5 | Sem acompanhamento de pedido in-app + tab bar (Pedidos/Promos) | Médio | É25 |
| 6 | Agendamento de pedido (já pendente como É6.2 no 0002) | Médio | (0002 É6.2) |

---

## É22 — Customização de produto (grupos de opções) — **prioridade**

> Maior diferença. Replica a página de produto do Anota.ai: grupos empilhados,
> obrigatório/opcional com min/max, opções com imagem+descrição+preço, radio vs stepper,
> busca interna e carrossel de "mais pedidos" por grupo.

- ✅ **22.1 Schema** (`packages/sql/src/models/product-option.prisma`):
  - `OptionGroup`: id, productId, name, `minSelect` Int, `maxSelect` Int,
    `selectionType` (single|multi), `required` Boolean (derivável de min≥1),
    `priceRule` (sum|highest|average — p/ sabores meio-a-meio), `sortOrder`, `collapsed` Bool.
  - `Option`: id, groupId, name, `description`, `imageUrl?`, `priceDeltaCents` Int,
    `maxPerItem` Int? (qtd máx por opção no multi, ex.: "Máx 1"), `available` Bool, `sortOrder`,
    `popularity` Int (alimenta "mais pedidos" do grupo).
  - Snapshot no pedido: `OrderItemOption` (orderItemId, groupName, optionName, quantity,
    priceDeltaCents) — tabela (não Json) p/ relatório de adicionais mais vendidos.
  - Meio-a-meio de pizza: modelado como grupo `multi` "Sabor" com `maxSelect` = nº de sabores
    do tamanho e `priceRule=highest` (ou average). Migração baseline **local apenas**.
- ✅ **22.2 Backend catálogo**: incluir `optionGroups`/`options` no DTO do menu público e do
  produto; expor preço "**a partir de**" = base + menor combinação obrigatória. DTOs em
  **TypeBox** (`t.Object` + `.properties` spread; nunca `t.Intersect`; `response:` no Elysia).
  `bun run export` (backend) → `bun run generate` (frontend) regenera SDK — **não** editar
  `frontend/src/lib/api/generated/`.
- ⏳ **22.3 Backend pedido**: `CreateOrder` valida seleções (min/max por grupo, `maxPerItem`,
  disponibilidade), recalcula `unitPrice` = base + Σ(deltas·qtd) aplicando `priceRule`, e faz
  **snapshot** em `OrderItemOption`. Rejeita inválido (422 `INVALID_OPTIONS`). Teste
  `CreateOrder.test.ts` (`bun:test`) cobrindo sabor+borda+adicional.
- ✅ **22.4 Cart store** (`stores/cart.ts`): `CartItem` ganha
  `options: {groupId,groupName,optionId,optionName,quantity,priceDeltaCents}[]`. Chave da
  linha = hash(productId+opções) (mesmo produto com opções diferentes = linhas distintas).
  `priceCents` da linha inclui deltas. `addItem`/`CartItemInput` atualizados.
- ✅ **22.5 Página de produto**: rota `$unitId/product/$productId/index.tsx` (convenção
  folder/index). Componentes em `product/components/`: `OptionGroupBlock` (colapsável, título
  + subtítulo "Escolha até N", badge **Obrigatório**, contador **min/max**, `radio` p/ single
  e `+`/`−` stepper p/ multi respeitando `maxPerItem`), `OptionRow` (imagem+descrição+preço),
  `OptionSearch` (busca dentro do produto), `PopularOptionsStrip` ("Sabores/itens mais
  pedidos"), botão sticky que valida obrigatórios e mostra total ao vivo. `MenuItemCard`
  passa a **navegar** para essa página quando o produto tem grupos; add-rápido só p/ produtos
  sem opções.
- ✅ **22.6 Modal de confirmação pós-opções**: ao adicionar, abrir modal (baseui, via `@/stores`
  padrão de dialog) com **Quantidade** + **Observações** (`useDebouncedInput`) e ações
  "Continuar comprando" / "Avançar para o carrinho".
- ⏳ **22.7 Carrinho/review**: `CartItemRow` lista opções sob o item; **lápis** reabre a página
  de produto com seleção pré-carregada (editar). `OrderReview` idem no resumo.
- ⏳ **22.8 Admin**: editor de grupos/opções por produto em `admin/products` (CRUD
  `OptionGroup`/`Option`, ordenar, min/max, `maxPerItem`, delta, `priceRule`, imagem da opção).
- ✅ **22.9 i18n**: chaves novas em **todos** os locales (`pt-BR` + `en-US`) na mesma operação;
  ordem alfabética; registrar namespace se criar.

## É23 — Destaques: featured manual → mais pedidos reais

> Regra do dono (verbatim): "mais pedidos e/ou featured, que, se setados, aparecem **antes**
> dos mais pedidos de verdade".

- ✅ **23.1 Backend popularidade**: `Product.popularity` (contador de vendas) e flag/campo
  `featuredRank Int?` por associação de unidade (`UnitProduct`) para destaque manual. Endpoint
  do menu retorna a faixa de destaques **ordenada**: primeiro os `featuredRank` (asc), depois
  os de maior `popularity` (mais pedidos reais), deduplicando; opcional "peça novamente" do
  histórico do cliente logado no topo (docs 05).
- ✅ **23.2 Frontend**: renomear/substituir `PromoCarousel` (hoje cashback) por
  `TopPicksCarousel` "**Os mais pedidos**" alimentado por 23.1. Manter selo de cashback como
  badge no card, não como critério da faixa.
- ⏳ **23.3 Admin**: no `admin/products` (ou por unidade), marcar/ordenar destaques manuais.

## É24 — Header da loja, pedido mínimo e delivery/retirada na entrada

- ✅ **24.1 Schema `Unit`**: `minOrderCents Int @default(0)`, `prepTimeMinMinutes Int?`,
  `prepTimeMaxMinutes Int?`; expor no DTO público de unidades.
- ✅ **24.2 Header rico** (`$unitId/index.tsx`): sub-linha "**Aberto até HH:MM · Pedido mín.
  R$ X**" (ou "Abre às HH:MM" quando fechado, via `UnitHours`), **ETA** ("30–45 min"),
  **taxa de entrega**, nota média (reviews já existem) e link "**Perfil da loja**" → modal/
  página com endereço, horários completos e formas de pagamento da unidade. Extrair
  primitivos (`InfoPill`, `StoreInfoModal`).
- ✅ **24.3 Pedido mínimo**: `CartBar` mostra progresso ("Faltam R$ X p/ o mínimo") e desabilita
  "concluir" abaixo do mínimo (só `delivery`); `CreateOrder` valida (422 `BELOW_MINIMUM`).
- ✅ **24.4 Delivery/Retirada na entrada**: seletor no header do cardápio (default pela
  `unit.deliveryMethods`; fixa se só um). Persistir por unidade; propagar ao checkout
  (pré-selecionar/ocultar toggle no `OrderReview`, pular endereço se `pickup`); revalidar ao
  trocar de unidade.

> **Descartado (decisão do dono):** rota dedicada por categoria. Mantém-se a navegação atual
> por scroll-anchor (`CategoryNav`/`CategorySummary`) dentro do cardápio.

## É25 — Acompanhamento de pedido in-app + navegação inferior

- **25.1** Página `$unitId/orders/$orderId/index.tsx` com **timeline de status** (recebido →
  em_preparo → pronto → saiu/entregue|retirado), traduzida via `t()`. `thank-you` linka para
  ela além do aviso de WhatsApp. Requer `GET /orders/:id` escopado ao cliente (complementa
  É15.1 do 0002).
- **25.2** (opcional) **Tab bar inferior** no app cliente — Início · Pedidos (histórico
  É15.1) · Promos · Carrinho — para paridade de navegação com o Anota.ai.

---

## Sequência recomendada

1. **É22** (customização) — desbloqueia o negócio; maior esforço; schema (22.1) → backend
   (22.2–22.3) → UI (22.5–22.7) → admin (22.8).
2. **É23** (destaques featured→mais pedidos) e **É24** (header/mínimo/delivery upfront) —
   alto ganho, médio esforço; paralelizáveis com o front de 22.
3. **É25** — polimento.

## Verificação (mesmo gate do 0001/0002)

- Por passo: `bun run check-types` + `bun run build` (afetados) verdes; testes afetados
  passam; 1 commit atômico.
- E2E manual: pizza (tamanho → sabor obrigatório → borda máx 1 → adicional) mostrando total
  ao vivo no botão, no modal de confirmação, no carrinho (com opções listadas + lápis) e no
  `OrderReview`; concluir pedido e conferir snapshot em `OrderItemOption` (consulta local ao
  DB de teste). `CreateOrder` com opções coberto em `bun test`.
- Açaí: grupo multi de adicionais com stepper/qtd; total soma deltas.
- Destaques: com featured setados aparecem antes dos mais pedidos; sem featured, ordena por
  popularidade.
- Delivery vs retirada no header → checkout pula endereço; pedido abaixo do mínimo bloqueia.
- i18n `pt-BR`/`en-US` com o mesmo conjunto de chaves (linter alfabético verde).
- Sem `git push`/migração remota sem pedido explícito.
