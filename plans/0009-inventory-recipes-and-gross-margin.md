# Plan 0009 — Estoque, fichas técnicas e margem bruta

## Objetivo

Automatizar disponibilidade e custo dos produtos através de estoque de insumos por unidade,
fichas técnicas globais e reservas ligadas ao ciclo do pedido. Expor operação no admin e margem
bruta nos relatórios sem romper o estoque legado de produto acabado.

## Decisões

- Insumos usam unidade base fixa (`unit`, `gram`, `milliliter`) e quantidades decimais.
- Entradas recalculam custo médio ponderado; perdas/saídas preservam o custo médio.
- Produto usa ficha global; opções globais aplicam deltas; adicionais locais têm ficha local.
- Pedido reserva estoque atomicamente. Entrada em `em_preparo` consome. Cancelamento anterior
  libera a reserva; cancelamento posterior exige perda/ajuste manual.
- Ajustes manuais podem negativar saldo; pedidos nunca ampliam déficit.
- Disponibilidade manual e estoque são cumulativos. Produto sem ficha continua vendável e usa
  `UnitProduct.stock` quando configurado.
- Cobertura padrão: alvo de 7 dias, consumo médio de pedidos + perdas nos últimos 30 dias.
- Margem usa receita dos itens após rateio de descontos; frete e itens sem custo ficam separados.

## Etapas

- [x] Especificação aprovada e plano versionado.
- [x] Modelos, migração e tipos gerados.
- [x] Domínio/API de insumos, movimentos, configurações e fichas.
- [x] Reserva/consumo/reversão no ciclo do pedido e disponibilidade do cardápio.
- [x] Margem bruta nos relatórios.
- [x] Admin de estoque, movimentações e fichas; SDK/rotas/i18n.
- [x] Testes e verificações finais.

## Follow-up — plataforma de pagamentos

Quando a integração financeira estiver disponível, importar taxas liquidadas por pedido,
armazenar seus snapshots e evoluir margem bruta para margem de contribuição. Taxas de gateway,
antecipação e chargeback não fazem parte desta entrega.
