# Taxas de plataforma sobre compras

## Objetivo

Adicionar taxas globais, geridas por super admins, herdadas por todas as empresas com sobrescrita empresarial de valor/ativação, cálculo extra-preço e snapshot histórico no pedido.

## Progresso

- [x] Modelar taxas, sobrescritas, snapshots e migração.
- [x] Implementar cálculo compartilhado, cotação e criação de pedido.
- [x] Criar API administrativa exclusiva de super admin.
- [x] Expor taxas efetivas no cardápio e regenerar contratos.
- [x] Aplicar preços e detalhamento no storefront e checkout.
- [x] Integrar taxas a pedidos, recibos e relatórios.
- [x] Criar painel `/admin/platform/fees` e sobrescritas por empresa.
- [x] Atualizar traduções e regras de negócio.
- [x] Cobrir cálculos, autorização, snapshots e apresentação com testes.
- [x] Regenerar artefatos e validar pacotes afetados.
- [x] Concluir revisão e commits atômicos.

## Decisões

- Escopos `product` e `order`; taxa de produto atinge todos os produtos.
- Tipos `fixed` em centavos e `percentage` em basis points.
- Modos de produto `product_explicit`, `embedded` e `checkout_only`; pedido aceita somente `checkout_only`.
- Taxas acumulam sem incidência entre si e não são reduzidas por cupom, cashback ou fidelidade.
- Sobrescrita empresarial altera somente valor e ativação; ausência de sobrescrita herda configuração global.
- Pedidos preservam snapshots mesmo após edição ou soft delete da taxa-base.
- Bloco de taxas no recibo é singleton opcional e omite taxas embutidas.
