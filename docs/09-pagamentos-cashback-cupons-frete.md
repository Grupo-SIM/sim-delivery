# 09 — Pagamentos, Cashback, Cupons e Frete

Regras financeiras aplicadas no checkout e no pedido.

## Formas de pagamento

- Configuradas **por unidade** (ver [04](04-unidades.md)).
- Exemplos: Pix, cartão (crédito/débito), dinheiro (na entrega), cashback.
- Exibidas no checkout #2 (ver [08](08-app-cliente.md)).
- Roadmap: pagamento online integrado (Pix/Mercado Pago/Cielo) — ver [12](12-referencias-e-benchmark.md).
- Pagamento com cartão sempre identifica explicitamente o **CPF do titular**; ele não substitui o
  CPF cadastral do cliente quando o cartão pertence a terceiro.
- Salvar cartão é opt-in. O sistema guarda somente token, metadados de exibição e CPF do titular;
  nunca armazena PAN ou CVC. Cliente pode listar e excluir os próprios cartões no perfil.
- Erros de tokenização e cobrança mostram a mensagem segura fornecida pelo provedor quando
  disponível, mantendo código de erro estável como fallback.

## Cashback

- **Acúmulo**: percentual sobre o valor do pedido. Default vem da **unidade**, com
  **override por produto** (ver [05](05-cardapio.md)).
- **Resgate**: saldo do cliente abatido no total de um pedido futuro.
- Registrado num **ledger** (CashbackLedger) por cliente: entradas (acúmulo) e saídas
  (resgate), com referência ao pedido.
- Saldo do cliente = Σ(acúmulos) − Σ(resgates).

Regras objetivas:
- Cashback só acumula em pedido **concluído** (entregue/retirado) — ponto em aberto se
  acumula ao pagar ou ao concluir.
- Resgate não pode exceder o saldo nem o total do pedido.
- Cancelamento estorna/reverte o movimento de cashback correspondente.

## Cupons

- Desconto aplicável no checkout (0..1 por pedido).
- Atributos: código, **tipo** (percentual ou valor fixo), valor, **validade** (janela),
  **escopo** (empresa/unidade/categoria/produto), limite de uso (total e por cliente),
  pedido mínimo.
- Aplicação: `attendant` pode aplicar; `owner`/`manager` gerenciam (ver [03](03-papeis-e-permissoes.md)).

Regras objetivas:
- Cupom **expirado**, sem usos restantes ou fora de escopo é **rejeitado** no fechamento.
- Desconto não torna o total negativo.

## Frete

- Configuração de frete **por unidade**. Estratégias possíveis:
  - **Fixo** (taxa única).
  - **Por zona/bairro** (tabela).
  - **Por distância/raio** (coordenadas da unidade × endereço do cliente).
  - **Grátis** acima de um valor mínimo (regra comportamental promocional).
- **Simulação de frete** no carrinho antes do checkout (ver [08](08-app-cliente.md)).
- Retirada no balcão = frete zero.

## Cálculo do total (regra objetiva)

```
total = Σ(itens) + frete − desconto(cupom) − cashback_resgatado
```

Onde `total ≥ 0`. O `cashback_acumulado` é calculado à parte e creditado conforme a
política (não abate o total do pedido atual, salvo resgate explícito).

## Pontos em aberto

- Momento do acúmulo de cashback (ao pagar vs ao concluir).
- Provedor de pagamento online e conciliação.
- Frete por zona vs distância vs integração externa (roteirização — [11](11-entregas-motoboy.md)).
- Empilhamento cupom + cashback (permitido juntos? limites?).
