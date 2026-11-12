# 05 — Cardápio

O cardápio é o catálogo de produtos da empresa, exibido por unidade. Gestão restrita a
`owner`/`manager`.

## Produtos

Cada produto tem:
- **Título**, **imagem**, **descrição**.
- **Preço** (base; **opcional**, default 0 — pode variar por unidade via associação). Quando 0,
  o preço do produto é composto pelo valor das opções obrigatórias.
- **Cashback**: usa o default da unidade, com **override por produto**.
- **Tags** (0..N) — selos universais (ver abaixo).
- **Indicador de promoção** (derivado de tag/preço promocional).
- **Popularidade** — métrica de quão vendido é (alimenta "mais populares"/destaques).

Adicionais/opcionais podem alterar preço e consumo de insumos. Produtos podem possuir ficha
técnica global; o custo e a disponibilidade são calculados com o estoque da unidade.

## Categorias

- Agrupam produtos (ex.: "Pão de queijo", "Promoções", "Bebidas").
- Um produto pode estar em várias categorias ou ser **avulso** (sem categoria — lista comum).
- Categorias e tags são conceitos do catálogo da empresa e ficam associadas ao produto por padrão.
- Cada unidade pode herdar essas associações ou sobrescrever categorias e tags para seu cardápio, inclusive com conjunto vazio.
- Ordenáveis; usadas no **sumário lateral** do cardápio (ver [08](08-app-cliente.md)).

## Tags / promoções (universais)

- Selo com **nome e cor arbitrários** definidos pela empresa.
- Tipos de referência: `preço` (promocional), `cashback` (destaque de cashback),
  `novidade`, etc. — mas o conjunto é **livre** (nome+cor).
- Aplicáveis a produtos; exibidas como badge no card do produto.

## Descontos (reais e falsos)

- Gerenciados em `/admin/discounts` por `owner`/`manager`. Filtros por **produto**, **categoria** e **etiqueta**
  são inclusivos (união): recebe desconto o produto que estiver na lista de produtos **ou** em uma das
  categorias **ou** tiver uma das etiquetas (categorias/etiquetas efetivas da unidade); os três vazios = todos
  os produtos. **Unidades** é filtro restritivo: o desconto só vale nas unidades marcadas (vazio = todas).
- Valor percentual (1–99%) ou fixo em centavos; período opcional (`startsAt`/`endsAt`) e ativo/inativo.
- **Real**: reduz o preço cobrado. Aplica-se ao preço-base efetivo (preço da unidade ou promocional); opções
  nunca são descontadas. Entre vários reais, vence o de maior economia (sem acúmulo). O backend recalcula o
  preço no pedido com a mesma regra do cardápio (`discounts/pricing.ts`).
- **Falso**: o cliente paga o preço normal; o cardápio exibe um preço "de" riscado maior (`preço / (1 − %)`
  ou `preço + valor fixo`). Só vale quando nenhum desconto real se aplica ao item.
- O cardápio público expõe o resultado em `priceCents` (cobrado) e `regularPriceCents` (riscado).

## Associação produto ↔ unidade (regra objetiva)

- A associação produto ↔ unidade controla presença no cardápio. Categorias e tags são herdadas do produto, salvo sobrescrita explícita daquela unidade.
- Um produto pode ser associado a **múltiplas unidades**, uma vez em cada unidade, com
  configurações distintas por associação.
- Por associação (unidade), pode variar: **preço**, **disponibilidade**, cashback.
- Um produto só aparece no cardápio de uma unidade se estiver associado a ela.

## Destaques e "peça novamente"

- **Categoria de destaques (invisível)**: composta por (a) itens configurados manualmente
  pelo dono + (b) "**peça novamente**" derivado do histórico do usuário logado.
- Não aparece como categoria normal no sumário; é uma faixa no topo do cardápio.

## Regras comportamentais

- Ordenar produtos/destaques por popularidade quando não houver ordem manual.
- "Peça novamente" só aparece para cliente logado com histórico.
- Sugestões no carrinho derivam do cardápio (ver [08](08-app-cliente.md)) — forma de
  configurar é ponto em aberto.
- Disponibilidade efetiva exige disponibilidade manual e insumos suficientes para a receita-base.
- Opções sem insumos suficientes são ocultadas. Sem combinação válida em grupo obrigatório, o
  produto fica indisponível.
- Produto sem ficha técnica continua vendável; pode usar o estoque legado de produto acabado.

## Estoque e fichas técnicas

- Insumos pertencem à empresa e têm saldos, reservas e custo médio por unidade.
- Unidades base aceitas: unidade, grama e mililitro.
- Ficha técnica do produto é global; opções aplicam deltas de consumo. Adicionais exclusivos de
  uma unidade possuem deltas locais.
- Pedido reserva insumos na criação e consome ao entrar em preparo. Cancelamento anterior ao
  preparo libera a reserva; cancelamento posterior não recompõe estoque automaticamente.
- Entradas recalculam custo médio ponderado. Correções definem o saldo total atual (não somam nem subtraem); correções e saídas mantêm histórico imutável.

## Pontos em aberto

- Como configurar **sugestões de produtos** no carrinho (manual por produto, por
  categoria, ou automático por co-ocorrência).
- Conversões de embalagem, fornecedores, lotes, validade e transferências entre unidades.
