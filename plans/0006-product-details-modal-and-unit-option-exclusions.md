# Plan 0006 — Modal de detalhes e customizações por unidade

## Objective

Consolidar seleção, customização e inclusão de qualquer produto em um único modal aberto pelo
card inteiro, removendo adição rápida. Completar administração das customizações globais,
permitir que cada unidade exclua opções específicas e tornar backend do pedido fonte de
verdade para validação, preço e snapshot das escolhas.

## Context and Existing Work

- `plans/0003-app-cliente-paridade-anota.md:78-124` já planejou É22. Schema, catálogo público,
  store do carrinho, página de produto, confirmação pós-opções e i18n foram marcados como
  entregues; validação no pedido, edição no carrinho/review e administração continuam pendentes.
- Pedido atual substitui decisão de rota própria de `plans/0003-app-cliente-paridade-anota.md:108-118`:
  card sempre abre modal completo; não haverá adição rápida nem segundo modal de confirmação.
- `frontend/src/routes/_storefront/$unitId/components/MenuItemCard.tsx:15-119` ainda mantém botão,
  stepper e dois fluxos conforme existência de grupos.
- `frontend/src/routes/_storefront/$unitId/product/$productId/index.tsx:17-257` contém seleção,
  cálculo e validação client-side reaproveitáveis, mas hoje em página; quantidade/observação
  ficam num segundo modal em `components/AddToCartModal.tsx:8-100`.
- Observação por item já existe ponta a ponta: `CartItem.note` em
  `frontend/src/stores/cart.ts:14-30`, payload em
  `frontend/src/routes/_storefront/$unitId/checkout/index.tsx:140-157`, DTO em
  `backend/src/modules/orders/dtos/OrderInput.ts:33-49` e persistência em
  `backend/src/modules/orders/useCases/CreateOrder.ts:45-56`. Não criar comentário geral do
  pedido para este fluxo.
- Customizações globais já possuem `OptionGroup`, `Option` e `OrderItemOption` em
  `packages/sql/src/models/product-option.prisma:3-72`. Hoje não existe exclusão por unidade em
  `packages/sql/src/models/unit-product.prisma:4-34`.
- Catálogo público hoje inclui toda opção global disponível em
  `backend/src/modules/units/useCases/ListPublicMenu.ts:27-49` e calcula "a partir de" em
  `backend/src/modules/units/useCases/ListPublicMenu.ts:76-112`.
- Pedido ignora opções enviadas pelo cliente e cobra somente preço-base em
  `backend/src/modules/orders/useCases/CreateOrder.ts:39-59`; snapshot ainda não é gravado.

## Product and Architecture Decisions

- Modal único inclui imagem, título, descrição completa, grupos/opções, observação, quantidade
  e CTA com total da linha. Mesmo produto sem opções usa modal; nunca adiciona direto pelo card.
- Card usa semântica de botão, foco visível, Enter/Espaço, `cursor-pointer` e hover no card
  inteiro. Nenhum controle interativo aninhado permanece nele.
- Grupos e opções pertencem globalmente ao produto. Unidade só mantém lista de opções excluídas;
  não duplica grupo/opção, nome, imagem ou preço.
- Persistência por unidade usa relação explícita entre `UnitProduct` e `Option`, com chave composta
  e cascade apropriado. Use-case confirma que opção pertence ao mesmo produto da associação.
- Cliente envia somente IDs e quantidades selecionadas. Backend nunca confia em nomes, preços,
  grupos ou total do carrinho; resolve catálogo efetivo da unidade, valida e recalcula.
- `priceRule` mantém semântica atual: `sum`, `highest` e `average`. Limites usam soma das
  quantidades selecionadas; IDs duplicados e quantidades não positivas são inválidos.
- Rota de produto existente deixa de ser fluxo primário. Removê-la se nenhuma entrada externa
  precisar de deep link; caso contrário, mantê-la como invólucro que abre o mesmo componente,
  sem duplicar estado ou markup.
- Toda alteração de endpoint segue backend → `bun run export` no backend → `bun run generate`
  no frontend. Nunca editar `frontend/src/lib/api/generated/` manualmente.
- Migração criada e versionada localmente; não executar migração, seed ou schema push contra DB
  externa/compartilhada.

## Implementation Plan

- [x] 1. Atualizar este plano e `plans/0003-app-cliente-paridade-anota.md` para registrar que
  Plan 0006 substitui UX de 22.5/22.6 e assume pendências 22.3/22.7/22.8, evitando duas fontes
  concorrentes. Commit documental isolado mantém histórico rastreável. **Concluído:** Plan 0006
  é fonte de verdade para UX de modal e pendências de backend/admin/carrinho de É22.
- [x] 2. Adicionar schema de exclusão de opção por associação unidade-produto, relações Prisma e
  migração SQL local em `packages/sql/src/models/`; regenerar Prisma/TypeBox. Cobrir unicidade,
  cascades e índices para leitura do menu. Commit deve conter somente schema, migração e artefatos
  gerados necessários. **Concluído:** relação explícita com chave composta, cascades, índice por
  opção, migração local e clientes Prisma/TypeBox regenerados; `bun run check-types` em `sql`
  passou.
- [ ] 3. Criar DTOs TypeBox e endpoints/use-cases administrativos de grupos e opções globais no
  módulo de produtos: listar árvore, criar/editar/excluir/reordenar grupos e opções, validar
  `minSelect`, `maxSelect`, `selectionType`, `priceRule`, `maxPerItem`, preço e pertencimento à
  empresa. Usar `.properties` para composição e `response:` nos controllers. Testar autorização,
  tenant, invariantes e cascades.
- [x] 4. Estender DTO, retorno e update de `UnitProduct` para receber IDs de opções excluídas.
  Validar associação, produto e pertencimento de cada opção; substituir conjunto de exclusões em
  transação. Testar herança vazia, exclusão regional, ID alheio e opção de outro produto.
  **Concluído:** contrato aceita e retorna exclusões, valida vínculo produto/tenant e substitui
  conjunto salvo; `check-types` e teste de use-case passaram.
- [x] 5. Fazer `ListPublicMenu` carregar exclusões e produzir catálogo efetivo, omitindo opções
  globais indisponíveis ou excluídas pela unidade. Recalcular `fromPriceCents` com opções efetivas
  e não expor produto cuja configuração obrigatória ficou impossível. Ampliar testes do menu com
  duas unidades que compartilham produto, mas veem sabores diferentes. **Concluído:** catálogo
  filtra exclusões, recalcula preço mínimo e omite grupos obrigatórios inviáveis; testes passaram.
- [x] 6. Completar contrato do pedido: adicionar seleções por item ao DTO, validar no
  `CreateOrder` grupos obrigatórios/opcionais, min/max, tipo, `maxPerItem`, disponibilidade global,
  exclusão da unidade e IDs duplicados; recalcular preço efetivo com `priceRule`. Criar itens e
  `OrderItemOption` em transação preservando nomes/preços como snapshot; retornar opções nos DTOs
  de pedido. Adicionar erro `INVALID_OPTIONS` 422 e testes de sum/highest/average, manipulação de
  preço, exclusão regional e rollback. **Concluído:** pedido recebe IDs/quantidades, recalcula
  preço, valida catálogo efetivo e snapshots e retorna opções; testes alvo e check-types passaram.
- [ ] 7. Exportar OpenAPI e regenerar SDK frontend após endpoints e contratos estabilizarem.
  Confirmar que respostas deixam de gerar `any`, que arquivos gerados são somente produto do
  gerador e que checkout envia `optionId`/`quantity` de cada seleção.
- [ ] 8. Criar editor global componentizado ao lado de `admin/products`, acessível por ação com
  ícone em `ProductRow`: árvore de grupos, formulários separados para grupo/opção, ordenação,
  disponibilidade, imagens, limites e regra de preço. Usar `CustomSelect`, inputs mascarados,
  placeholders, `useDebouncedInput`, `RequiredMark`, `ConfirmActionButton` e toasts conforme
  convenções. Adicionar traduções em todos locales existentes, mantendo ordem.
- [ ] 9. Estender modal de edição de produto da unidade para listar opções globais agrupadas e
  marcar quais ficam indisponíveis naquela unidade. Mostrar estado herdado claramente, impedir
  configuração obrigatória impossível e salvar junto da associação. Reutilizar componentes de
  seleção; não copiar markup do editor global.
- [x] 10. Extrair lógica compartilhada de seleção/cálculo/validação da página atual para hook e
  componentes co-localizados, com tipos sem `any`. Criar `ProductDetailsModal` responsivo e
  acessível: skeleton antes de erro/ausência, mídia e descrição completas, opções, textarea
  debounced, stepper de quantidade e CTA "Adicionar ao carrinho · R$ total". Resetar estado ao
  fechar/trocar item e preservar estado ao editar linha existente.
- [x] 11. Simplificar `MenuItemCard` para card inteiro clicável; remover botão Adicionar, stepper e
  mutação direta. Elevar item selecionado/modal ao nível que possui dados do menu para renderizar
  um único modal por browser, evitando um modal por card. Aplicar mesmo comportamento ao carrossel
  de destaques. Garantir foco, teclado, hover e ausência de controles aninhados.
- [ ] 12. Integrar modal ao carrinho: add cria/mescla linha pela combinação produto+opções;
  edição substitui atomicamente linha, inclusive quando nova combinação colide com outra linha.
  Listar opções e observação no `CartItemRow` e `OrderReview`; ação lápis reabre mesmo modal com
  seleção, nota e quantidade. Remover `AddToCartModal` e código de página duplicado quando não
  houver mais referências.
- [ ] 13. Adicionar testes frontend focados no cálculo e store: identidade determinística da
  linha, regras de preço, limites, reset do modal, merge, edição/colisão e exclusões já filtradas.
  Fazer verificação manual responsiva e por teclado dos cards/modal, incluindo produto sem imagem,
  sem opções, descrição longa e muitos grupos.
- [ ] 14. Rodar gates por pacote afetado: export/generate, testes unitários de SQL/backend/frontend,
  `check-types` e builds de backend/frontend. Regerar `routeTree.gen.ts` somente se rota mudar.
  Corrigir falhas antes de cada commit; manter commits atômicos e árvore limpa.

## Verification Criteria

- Card não contém botão Adicionar nem stepper; clique, Enter e Espaço abrem mesmo modal completo.
- Produto com ou sem customização exige confirmação no modal e mostra total vezes quantidade.
- Observação fica na linha correta do carrinho e chega a `OrderItem.note`.
- Duas unidades podem vender mesmo produto com opções efetivas diferentes sem duplicar produto.
- Opção excluída não aparece no menu e pedido forjado com seu ID retorna 422.
- Backend recalcula preço ignorando qualquer preço/nome enviado e persiste snapshots imutáveis.
- Carrinho, review e retorno do pedido exibem escolhas; edição reabre modal preenchido.
- Admin consegue manter árvore global e exclusões locais com feedback, confirmação destrutiva e i18n.
- Type-checks, builds e testes dos pacotes afetados passam; SDK e route tree ficam atualizados.

## Potential Risks and Mitigations

1. **Preço divergente entre UI e backend.** Centralizar algoritmo em casos de teste equivalentes;
   backend permanece autoritativo e erro de catálogo alterado pede revisão da linha.
2. **Grupo obrigatório inviável após exclusões ou edição global.** Validar em writes administrativos,
   filtrar produto inválido do menu e revalidar no pedido.
3. **Carrinho persistido contém IDs antigos.** Versionar/migrar persistência Zustand ou limpar linhas
   incompatíveis; nunca aceitar snapshot local no checkout.
4. **Modal grande em celular.** Conteúdo rolável com header/footer estáveis, foco preso e CTA visível;
   testar listas extensas e teclado virtual.
5. **CRUD amplo gera commit frágil.** Separar schema, backend global, override local, pedido, SDK,
   admin e storefront em commits verdes e reversíveis.

## Alternative Approaches

1. Duplicar opções por unidade: facilita diferenças grandes, mas cria drift e manutenção em massa;
   rejeitado porque requisito define customização global com exclusões locais.
2. Guardar IDs excluídos em JSON/array no `UnitProduct`: reduz tabelas, mas perde integridade,
   cascades e consultas confiáveis; rejeitado em favor de relação explícita.
3. Manter rota própria e modal só para produtos simples: menor alteração, mas conserva fluxos
   inconsistentes e contradiz card sempre clicável abrindo modal; rejeitado.

## Execution Protocol

Plano elaborado com `codex/cx/gpt-5.6-sol-high`. Execução deve ocorrer com
`codex/cx/gpt-5.6-terra-high`, um passo/commit por vez. Após cada passo concluído, marcar checkbox
e atualizar próximos passos neste arquivo no mesmo commit.
