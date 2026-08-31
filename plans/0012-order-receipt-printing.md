# Impressão de recibo térmico do pedido

## Objetivo

Gerar PDF real de recibo térmico de 80 mm, abrir o visualizador do navegador e solicitar impressão sem alterar o pedido.

## Progresso

- [x] Implementar endpoint e contrato `GET /orders/:orderId/receipt`, autorização e testes de backend.
- [ ] Exportar OpenAPI, regenerar SDK e implementar gerador PDF, botão e traduções no frontend.
- [ ] Documentar regras de negócio e criar commits atômicos.
- [ ] Validar testes, PDF, renderização e fluxo de impressão no Chrome.

## Requisitos

- Permissão `orders.print` para superAdmin, owner, manager, attendant e kitchen; courier e customer sem acesso.
- Respeitar empresa e unidades atribuídas à cozinha. Fora do escopo retorna `ORDER_NOT_FOUND`.
- Resposta inclui número, data, unidade, cliente, telefone, entrega, endereço, itens, opções, observações, pagamento, valores e responsável pelo preparo.
- PDF monocromático vetorial: 80 mm, margem interna 4 mm e altura calculada pelo conteúdo.
- Botão disponível em todos os status autorizados; impressão nunca altera status.
- Aba vazia aberta no clique antes da busca. PDF usa `autoPrint()` e Blob URL. Falha fecha aba e alerta; popup bloqueado mostra instrução.
- Chrome mantém PDF aberto como fallback quando autoimpressão não dispara.
- Sem migração, logo ou imagens.

## Validação

- Backend: resposta completa, retirada sem endereço, tenant incorreto, cozinha fora da unidade e matriz de permissões.
- Frontend: assinatura `%PDF`, largura 80 mm, altura variável e textos longos sem corte; endereço opcional, PIX/cartão, observações, opções, descontos e pedido longo.
- Inspecionar PDF com `pdfinfo` e renderização para imagem.
- Smoke test no Chrome para aba do PDF e fallback.
- Aceitação física na Elgin i9 permanece manual: bobina 80 mm, escala 100%, sem margens extras e sem cortes.

## Limites técnicos

- Aplicação não seleciona impressora nem controla opções protegidas do Chrome.
- Usuário escolhe a Elgin; driver deve usar bobina de 80 mm.
- `jsPDF.autoPrint()` apenas solicita o diálogo em visualizadores compatíveis.
