# 10 — Painel do Dono

O que o **dono** (e os papéis `manager`/`attendant`/`kitchen`) precisa para operar a empresa. Vai além do
esboço original — **deduzido** do escopo de televenda/delivery e do benchmark
(ver [12](12-referencias-e-benchmark.md)). Acesso conforme [03](03-papeis-e-permissoes.md).

## Módulos do painel (MVP)

### Dashboard / relatórios
- Faturamento por período (dia/semana/mês), por unidade.
- Nº de pedidos, ticket médio, taxa de conversão do carrinho.
- **Produtos mais vendidos** / mais populares.
- Cashback emitido e resgatado; uso de cupons.
- Cancelamentos operacionais consideram somente pedidos com pagamento confirmado.
- Pedidos cancelados sem pagamento confirmado aparecem separadamente como abandono no pagamento,
  com quantidade, valor não convertido e ticket médio não convertido.
- Filtros por unidade e período.

### Gestão de pedidos
- Listagem com filtragem compreensiva + mudança de status (ver [06](06-pedidos.md)).
- Visões por papel (cozinha/atendente/gestão).

### Gestão de cardápio
- CRUD de produtos, categorias e tags; associação a unidades; override de cashback e
  preço por unidade (ver [05](05-cardapio.md)).

### Gestão de unidades
- CRUD de unidades: horários, taxas, formas de entrega/pagamento, aberto/fechado
  (ver [04](04-unidades.md)).

### Gestão de clientes
- Listagem com filtros + histórico e métricas (ver [07](07-clientes.md)).

### Gestão de staff
- Convidar/remover usuários, definir **papel e nível** (`manager`/`attendant`/`kitchen`),
  opcional escopo por unidade (ver [03](03-papeis-e-permissoes.md)).

### Gestão de motoboys / entregas
- Cadastrar motoboys, atribuir pedidos, acompanhar entregas (ver [11](11-entregas-motoboy.md)).

### Cupons e promoções
- CRUD de cupons; configurar tags/promoções e carrossel do cardápio
  (ver [09](09-pagamentos-cashback-cupons-frete.md), [05](05-cardapio.md)).

### Branding / footer (runtime)
- Editar **footer por loja**: formas de pagamento, redes sociais, atendimento,
  localização, horário. Aplicado sem rebuild (ver [02](02-whitelabel-e-builds.md)).
- Configurar os banners ordenados da página inicial e de cada unidade.
- Cores essenciais/ícone/splash são build-time (variante); ajustes finos de marca
  editáveis em runtime — divisão em [02](02-whitelabel-e-builds.md).

### Notificações
- Configurar mensagens de status por WhatsApp, com texto multiline, prévia e anexos
  de imagem/PDF (ver [06](06-pedidos.md)).

## Roadmap (do benchmark — não MVP)

Ver [12-referencias-e-benchmark.md](12-referencias-e-benchmark.md) para a lista completa.
Destaques: PDV/controle de caixa, controle de estoque, controle de fiado, emissor de NF,
impressão automática multi-impressora, **KDS** (painel de cozinha), gestão de
mesas/comandas, agendamento de pedidos, programa de fidelidade por pontos, avaliações,
chatbot/disparador/automações de WhatsApp, recuperação de carrinho, roteirização e
rastreio ao vivo do entregador, integrações (iFood, Meta/Google Ads, Pixel/GA/GTM).

## Pontos em aberto

- Granularidade de relatórios (exportação, comparativos, metas).
- Painel do `superAdmin` (gestão de empresas/variantes/planos) — dimensionar à parte.
- Quais módulos roadmap entram na v2 e ordem de prioridade.
