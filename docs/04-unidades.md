# 04 — Unidades

Uma **unidade** é uma loja física de uma empresa. Uma empresa tem 1..N unidades. Gestão
restrita a `owner`/`manager` (ver [03-papeis-e-permissoes.md](03-papeis-e-permissoes.md)).

## Dados da unidade

- **Nome** (ex.: "JB Centro").
- **Telefone** / WhatsApp de atendimento.
- **WhatsApp transacional**: sessão WAHA própria, conectada por QR Code no painel. O número
  público de atendimento pode ser configurado separadamente; sem valor explícito, usa o
  número identificado na sessão conectada.
- **Localização**: endereço completo + coordenadas (para frete/mapa).
- **Horário de funcionamento**:
  - **Geral** (padrão semanal).
  - **Por dia específico** (override por data — feriados, eventos).
- **Formas de entrega**: entrega (delivery), retirada no balcão, encomenda (roadmap: mesa/QR).
- **Taxa de entrega**: fixa, por bairro/zona ou por distância (ver [09](09-pagamentos-cashback-cupons-frete.md)).
- **Cashback**: percentual padrão da unidade (produto pode sobrepor — ver [05](05-cardapio.md)).
- **Aberto/Fechado**:
  - **Automático** por horário (calcula de acordo com o funcionamento).
  - **Manual** (override: fechar mesmo dentro do horário, ou abrir excepcionalmente).
- **Formas de pagamento** aceitas (por unidade — ver [09](09-pagamentos-cashback-cupons-frete.md)).
- **Banners do cardápio**: até 10 imagens ordenadas, exibidas em carrossel na página da unidade.

## Regras objetivas

- Unidade **fechada** (manual ou por horário) **não aceita novos pedidos**; o app a exibe
  como indisponível.
- Override manual **prevalece** sobre o cálculo automático de aberto/fechado.
- Uma unidade pertence a exatamente uma empresa (`companyId`); nunca compartilhada.
- Cada unidade possui no máximo uma sessão WAHA transacional. Owner, manager atribuído à
  unidade e superAdmin podem conectá-la ou desconectá-la.
- Taxa de entrega e cashback da unidade são o **default**; produto pode sobrepor cashback.

## Regras comportamentais

- Fora do horário, o app pode permitir **agendamento** (roadmap) em vez de bloquear.
- Ao trocar de unidade no app, revalidar disponibilidade dos itens do carrinho (preço e
  estoque podem diferir por unidade — ver [08](08-app-cliente.md)).

## Associação de cardápio

Produtos são associados a unidades por **categoria** (ou avulsos). Isso permite que
unidades diferentes ofereçam subconjuntos do catálogo com preço próprio. Detalhes em
[05-cardapio.md](05-cardapio.md).

## Footer / branding da unidade

Cada unidade/loja tem um **footer personalizado**: formas de pagamento, redes sociais,
atendimento, localização e horário. Editável no painel do dono, aplicado em runtime (sem
rebuild). Ver [10-painel-do-dono.md](10-painel-do-dono.md).

## Pontos em aberto

- Taxa por zona/bairro vs por distância (raio) vs integração externa de frete.
- Se horário por dia específico suporta múltiplas faixas (ex.: almoço e jantar).
- Estoque por unidade (roadmap — ver [12](12-referencias-e-benchmark.md)).
