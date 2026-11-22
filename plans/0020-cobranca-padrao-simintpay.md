# 0020 — Cobrança padrão SimIntPay

Parte B do plano "Modos de taxa unificados". O Delivery deixa de enviar um total
pré-calculado e `allocation`, e deixa de calcular aditivas localmente para cobrar:
a SimIntPay cota (`POST .../payments/quote`) e cobra (`POST .../payments` com
`expectedTotalCents`). ADDITIVE_ONLY: comerciante recebe a base; BOTH: comerciante
também paga adquirente + SimIntPay; SIMINTPAY_ONLY: sem aditivas. Só PIX e cartão 1x.
Sem push nem migração remota.

## Progress
- [x] SQL: `Payment.netAmountCents`/`totalAmountCents`, `PaymentAttempt.baseAmountCents`,
      `Order.additiveFeeRevision`; colunas de alocação viram históricas (migração local).
- [x] Cliente SimIntPay: `quotePayment`, cobrança sem `allocation`, `QUOTE_CHANGED`.
- [x] Pedidos: total e aditivas pela cotação (`CreateOrder`, `POST /orders/fees/quote`).
- [x] Pagamentos: tentativa pela base + total cotado, recotação em `QUOTE_CHANGED`.
- [ ] Relatórios: líquido devolvido pela SimIntPay quando presente.
- [ ] Frontend: total cotado e aviso de preço alterado.
- [ ] Docs e testes.
