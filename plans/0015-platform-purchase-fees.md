# Taxas de plataforma sobre compras

## Objetivo

Adicionar taxas globais, geridas por super admins, herdadas por todas as empresas com sobrescrita empresarial de valor/ativação, cálculo extra-preço e snapshot histórico no pedido.

## Progresso

- [x] Modelar taxas, sobrescritas, snapshots e migração.
- [x] Implementar cálculo compartilhado, cotação e criação de pedido.
- [x] Criar API administrativa exclusiva de super admin.
- [~] Expor taxas efetivas no cardápio e regenerar contratos.
- [ ] Aplicar preços e detalhamento no storefront e checkout.
- [ ] Integrar taxas a pedidos, recibos e relatórios.
- [ ] Criar painel `/admin/platform/fees` e sobrescritas por empresa.
- [ ] Atualizar traduções e regras de negócio.
- [ ] Cobrir cálculos, autorização, snapshots e apresentação com testes.
- [ ] Regenerar artefatos e validar pacotes afetados.
- [ ] Concluir revisão e commits atômicos.

## Decisões

- Escopos `product` e `order`; taxa de produto atinge todos os produtos.
- Tipos `fixed` em centavos e `percentage` em basis points.
- Modos de produto `product_explicit`, `embedded` e `checkout_only`; pedido aceita somente `checkout_only`.
- Taxas acumulam sem incidência entre si e não são reduzidas por cupom, cashback ou fidelidade.
- Sobrescrita empresarial altera somente valor e ativação; ausência de sobrescrita herda configuração global.
- Pedidos preservam snapshots mesmo após edição ou soft delete da taxa-base.
- Bloco de taxas no recibo é singleton opcional e omite taxas embutidas.
