# 05 — Cardápio

O cardápio é o catálogo de produtos da empresa, exibido por unidade. Gestão restrita a
`owner`/`manager`.

## Produtos

Cada produto tem:
- **Título**, **imagem**, **descrição**.
- **Preço** (base; pode variar por unidade via associação).
- **Cashback**: usa o default da unidade, com **override por produto**.
- **Tags** (0..N) — selos universais (ver abaixo).
- **Indicador de promoção** (derivado de tag/preço promocional).
- **Popularidade** — métrica de quão vendido é (alimenta "mais populares"/destaques).

Roadmap: adicionais/opcionais (grupos de complementos), variações (tamanho), estoque.

## Categorias

- Agrupam produtos (ex.: "Pão de queijo", "Promoções", "Bebidas").
- Um produto pode estar em uma categoria ou ser **avulso** (sem categoria — lista comum).
- Ordenáveis; usadas no **sumário lateral** do cardápio (ver [08](08-app-cliente.md)).

## Tags / promoções (universais)

- Selo com **nome e cor arbitrários** definidos pela empresa.
- Tipos de referência: `preço` (promocional), `cashback` (destaque de cashback),
  `novidade`, etc. — mas o conjunto é **livre** (nome+cor).
- Aplicáveis a produtos; exibidas como badge no card do produto.

## Associação produto ↔ unidade (regra objetiva)

- A associação é feita **por categoria** (ou pela ausência dela). Ex.: "lista de produtos
  comum", categoria "Pão de queijo", categoria "Promoções".
- Um produto/categoria pode ser associado a **múltiplas unidades**, possivelmente **várias
  vezes** com configurações distintas.
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

## Pontos em aberto

- Como configurar **sugestões de produtos** no carrinho (manual por produto, por
  categoria, ou automático por co-ocorrência).
- Complementos/variações e estoque (roadmap).
- Preço promocional: campo próprio vs derivado de cupom/tag.
