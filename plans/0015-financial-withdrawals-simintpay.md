# Plan 0015 — Saques empresariais integrados à SIM INT PAY

## Progresso

- [x] API genérica, carteiras empresariais e saques na SIM INT PAY (`simintpay-back` `0853277`).
- [x] Modelo, permissões e API financeira no Sim Delivery.
- [~] OpenAPI, SDK e dashboard financeira.
- [ ] Reconciliação histórica, testes e validação.

## Decisões

- Carteira, saldo, taxa e status são autoritativos na SIM INT PAY e isolados por `integrationKey + companyId`.
- CNPJ, chave Pix padrão e mínimo opcional pertencem à empresa no Sim Delivery.
- `superAdmin`, `owner` e `manager` consultam e solicitam saques; somente `superAdmin` configura CNPJ e mínimo.
- `PENDING` e `APPROVED` contam como processamento; `COMPLETED` e `REJECTED` são terminais.
- Valores cruzam APIs como centavos inteiros; callbacks e solicitações são idempotentes.
- Pagamentos históricos confirmados serão retroatribuídos por `simpayPaymentId`; execução remota fica para operação autorizada.

## Próximo passo

Finalizar dashboard financeira e configuração empresarial.
