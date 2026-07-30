# Plan 0010 — Relatório financeiro e escopo de unidades para managers

## Progresso
- [ ] Modelo de dados: confirmação de pagamento e associação staff-unidade.
- [ ] Escopo de unidades para managers nos módulos operacionais.
- [ ] API, cálculos e exportação financeira.
- [ ] Tela `/admin/finance`, navegação e SDK.
- [ ] Testes, validação e commit.

## Decisões
- `/admin/` continua dashboard de negócio; `/admin/reports` será removida e substituída por `/admin/finance`.
- O XLSX exportado pelas duas telas contém abas de negócio atuais e a nova aba Financeiro.
- Competência financeira: `Payment.confirmedAt`, depois evento de conclusão, depois `Order.updatedAt`.
- Owner acessa todas unidades. Manager sem associação acessa toda empresa; manager associado fica restrito às unidades atribuídas.
