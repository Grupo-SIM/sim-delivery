# 12 — Referências e Benchmark

Plataformas concorrentes usadas para **sondar escopo** (o que um app de televenda/delivery
costuma oferecer). Serve para diferenciar **MVP** (esboço original) de **Roadmap**.

## Referências

- **Prefiro Delivery** — https://serraminas.com.br · https://www.prefirodelivery.com.br/
- **Cardápio Web** — https://app.cardapioweb.com/bliss_cookie · https://cardapioweb.com

## Features observadas (verbatim) e classificação

Legenda: **MVP** = no esboço/escopo confirmado · **Roadmap** = desejável, fora do MVP.

| Feature (concorrentes) | Classe | Doc |
|---|---|---|
| Cardápio digital (delivery/retirada) | **MVP** | [05](05-cardapio.md), [08](08-app-cliente.md) |
| Encomenda / mesa (QR) / balcão | Roadmap | [04](04-unidades.md) |
| Multi-unidade | **MVP** | [04](04-unidades.md) |
| Cupons e descontos | **MVP** | [09](09-pagamentos-cashback-cupons-frete.md) |
| Cashback | **MVP** | [09](09-pagamentos-cashback-cupons-frete.md) |
| Programa de fidelidade por pontos | **MVP** | [10](10-painel-do-dono.md) |
| Gestão de pedidos / dashboard | **MVP** | [06](06-pedidos.md), [10](10-painel-do-dono.md) |
| Filtros avançados de cliente (ticket, frequência, histórico) | **MVP** | [07](07-clientes.md) |
| Relatórios gerenciais / dashboards | **MVP** (básico) | [10](10-painel-do-dono.md) |
| RBAC (controle de acesso por papel) | **MVP** | [03](03-papeis-e-permissoes.md) |
| Gestão de entregadores (atribuição) | **MVP** | [11](11-entregas-motoboy.md) |
| Notificação de status por WhatsApp | **MVP** | [06](06-pedidos.md) |
| Chatbot / disparador / automações WhatsApp | Roadmap | [10](10-painel-do-dono.md) |
| Recuperação de carrinho | Roadmap | [10](10-painel-do-dono.md) |
| PDV / controle de caixa c/ histórico | Roadmap | [10](10-painel-do-dono.md) |
| Controle de estoque | **MVP** | [04](04-unidades.md), [05](05-cardapio.md) |
| Controle de fiado | Roadmap | [10](10-painel-do-dono.md) |
| Emissor de nota fiscal (NF) | Roadmap | [10](10-painel-do-dono.md) |
| Impressão automática multi-impressora | Roadmap | [10](10-painel-do-dono.md) |
| KDS (painel de cozinha) | Roadmap | [06](06-pedidos.md), [10](10-painel-do-dono.md) |
| Gestão de mesas e comandas | Roadmap | [10](10-painel-do-dono.md) |
| Roteirização + rastreio ao vivo do entregador | Roadmap | [11](11-entregas-motoboy.md) |
| Agendamento de pedidos | **MVP** | [04](04-unidades.md), [06](06-pedidos.md) |
| Avaliações / feedback | **MVP** | [10](10-painel-do-dono.md) |
| Pagamento online (Pix, Mercado Pago, Cielo) | **MVP** | [09](09-pagamentos-cashback-cupons-frete.md) |
| Integração iFood | Roadmap | [10](10-painel-do-dono.md) |
| Marketing (Meta/Google Ads, Pixel, GA, GTM) | **MVP** | [10](10-painel-do-dono.md) |

## Como usar este benchmark

- Não inflar o MVP: itens **Roadmap** ficam documentados como evolução, não como
  requisito inicial.
- Ao priorizar v2, começar pelos itens com maior alavancagem em televenda:
  **impressão automática**, **KDS**, **agendamento**, **pagamento online (Pix)**,
  **rastreio ao vivo**.
