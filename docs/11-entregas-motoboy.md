# 11 — Entregas / Motoboy

Sistema **básico** para o motoboy (`courier`) executar as entregas. Escopo enxuto no MVP;
rastreio ao vivo e roteirização são roadmap.

## Papel e acesso

- Role `courier` (ver [03](03-papeis-e-permissoes.md)). Vê **apenas** entregas atribuídas
  a ele, dentro da empresa.
- Autenticação: ponto em aberto (mesmo Better Auth do staff vs fluxo próprio — ver [01](01-visao-geral-e-dominio.md)).

## Entidade Delivery

Vincula um pedido a um motoboy + status de entrega:
- `orderId`, `courierId`, `unitId`.
- Status: `atribuida → aceita → a_caminho → entregue` (ou `recusada`/`falhou`).
- Timestamps por transição (atribuída/aceita/saída/entrega).

Regra objetiva: a mudança de `Delivery` para `a_caminho`/`entregue` **reflete no status
do pedido** (`saiu_para_entrega`/`entregue` — ver [06](06-pedidos.md)).

## Fluxo do motoboy (MVP)

1. **Login**.
2. **Lista de pedidos atribuídos** (fila), com unidade de origem.
3. **Aceitar** a entrega (ou recusar).
4. Ver **dados do cliente e endereço** + observações + valor a receber (se pagamento na
   entrega).
5. **Link de rota** (abre mapa externo — Google Maps/Waze) para navegar.
6. **Atualizar status**: saiu para entrega → entregue (com confirmação).
7. **Histórico** de entregas concluídas.

## Atribuição

- **Manual e opcional** (MVP): `owner`/`manager`/`attendant` pode atribuir o pedido a um motoboy no painel
  (ver [10](10-painel-do-dono.md)); pedido pode sair para entrega sem atribuição.
- **Automática** (roadmap): por disponibilidade/proximidade.

## Regras comportamentais

- Notificar cliente por WhatsApp ao passar para "saiu para entrega" e "entregue"
  (ver [06](06-pedidos.md)).
- Motoboy indisponível/offline não recebe novas atribuições (roadmap: status de
  disponibilidade).

## Roadmap

- **Rastreio ao vivo** (localização do motoboy visível ao cliente/painel).
- **Roteirização** / otimização de rota multi-pedido.
- Status de disponibilidade e capacidade do motoboy.
- Comprovante de entrega (foto/assinatura).

## Pontos em aberto

- Atribuição manual vs automática (política).
- Rastreio ao vivo (fonte de localização, privacidade, custo).
- Auth do motoboy (staff vs app separado).
- Acerto/repasse financeiro ao motoboy (fora do MVP?).
