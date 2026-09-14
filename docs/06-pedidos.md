# 06 — Pedidos

Um **pedido** (Order) é uma compra de um cliente em uma unidade. Contém itens, status,
pagamento e (quando delivery) uma entrega.

## Ciclo de vida (status)

```
recebido → em_preparo → pronto → saiu_para_entrega → entregue
                                └───────────────────→ (retirada) entregue
qualquer_estado_ativo → cancelado
```

- `recebido` — pedido criado e pago/confirmado; aguardando aceite da loja.
- `em_preparo` — cozinha produzindo (visível ao role `kitchen`).
- `pronto` — pronto para sair/retirar.
- `saiu_para_entrega` — a caminho (delivery); atribuição de motoboy é opcional.
- `entregue` — concluído; em retirada, registra que cliente retirou na unidade.
- `cancelado` — encerrado sem conclusão (com motivo).

Ao iniciar uma fase com duração operacional (`em_preparo` ou `saiu_para_entrega`), a
equipe pode informar uma estimativa em minutos para concluir essa fase. A estimativa é
registrada no pedido como prazo absoluto e substitui, no acompanhamento, a faixa geral
configurada na unidade. Ao mover o pedido para a fase seguinte, o prazo anterior é
removido. Em pedidos de retirada, `pronto` informa ao cliente que ele já pode buscar o
pedido; a conclusão segue diretamente para `entregue` e não inclui tempo de entrega.

Qualquer cargo pode mover manualmente o pedido entre quaisquer etapas operacionais,
inclusive reabrir pedidos concluídos ou cancelados. O status `awaiting_payment` continua
controlado pela confirmação de pagamento. Movimentos para trás não notificam o cliente.
Enum de status é **traduzível no frontend** (nunca renderizar valor cru — ver `AGENTS.md`
› i18n).

## Estrutura

- Itens (**OrderItem**): produto, **quantidade**, **observação** por item, valor unitário
  e total (snapshot do preço no momento do pedido).
- **Unidade** de origem.
- **Cliente** + **endereço** de entrega (snapshot) ou retirada.
- **Frete** (valor calculado) e **cupom** aplicado (0..1).
- **Cashback**: gerado (acúmulo) e/ou resgatado no pedido.
- **Forma de pagamento**.
- **Entrega** (Delivery): motoboy atribuído + status — ver [11](11-entregas-motoboy.md).

## Regras objetivas

- Pedido sem itens não é criado.
- Unidade fechada não aceita pedido (ver [04](04-unidades.md)).
- Cupom inválido/expirado é rejeitado no fechamento (ver [09](09-pagamentos-cashback-cupons-frete.md)).
- Total = Σ(itens) + frete − desconto(cupom) − cashback resgatado.

## Listagem e filtros (painel)

Listagem de pedidos com **filtragem compreensiva**:
- Por status, unidade, período (data/hora), forma de pagamento, forma de entrega,
  motoboy, cliente, valor (ticket), com/sem cupom.
- Busca por id/cliente/telefone.
- Ordenação por data, valor, status.

Visões por role: `kitchen` vê fila de produção; `attendant` vê pedidos ativos;
`owner`/`manager` veem tudo + histórico/relatórios (ver [10](10-painel-do-dono.md)).

## Atualização por WhatsApp (regra comportamental)

Quando o pedido avança no fluxo, o cliente é **notificado por WhatsApp e e-mail**
(recebido, em preparo, pronto, saiu para entrega, entregue). Retornos de etapa não
disparam mensagens. Ao concluir o pedido no app, a tela de obrigado informa que o
acompanhamento será por WhatsApp (ver [08](08-app-cliente.md)).

O canal WhatsApp usa WAHA. Com `WHATSAPP_DRIVER=waha`, mensagens entram em uma outbox
transacional e são reenviadas com backoff até entrega; `console` envia ao log local e
`disabled` ignora o canal. A instância e sessão WAHA são externas ao projeto e configuradas
por `WAHA_BASE_URL`, `WAHA_SESSION` e, quando a instância exige autenticação, `WAHA_API_KEY`.

## Reembolso em cancelamento

Cancelar um pedido com pagamento `confirmed` pode registrar um estorno (`Refund`), opcional
e informado junto com a transição para `cancelado`:

- **Forma**: `gateway` (via Simpay — atualmente indisponível, ver abaixo), `manual` (fora do
  sistema, apenas registrado) ou `cashback` (crédito ao cliente).
- **Valor**: total por padrão; aceita estorno parcial.
- **Fidelidade**: um estorno **total** reverte o cashback/pontos de fidelidade acumulados
  naquele pedido e devolve o cashback/pontos que o cliente havia resgatado na compra.
- O sistema é a fonte de verdade contábil do estorno; a liquidação bancária real ainda pode
  ser manual até a Simpay documentar um endpoint de estorno — nesse caso o registro fica com
  `status: "failed"` sem bloquear o cancelamento do pedido.

## Pontos em aberto

- Aceite manual da loja vs auto-aceite ao pagar.
- Agendamento de pedidos e KDS de cozinha (roadmap — ver [12](12-referencias-e-benchmark.md)).
- Endpoint de estorno da Simpay (hoje sem API documentada).
