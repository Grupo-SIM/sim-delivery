# Impressão de recibo térmico do pedido

## Objetivo

Gerar PDF real de recibo térmico de 80 mm e solicitar impressão na página atual sem alterar o pedido.

## Progresso

- [x] Implementar endpoint e contrato `GET /orders/:orderId/receipt`, autorização e testes de backend.
- [x] Exportar OpenAPI, regenerar SDK e implementar gerador PDF, botão e traduções no frontend.
- [x] Documentar regras de negócio e criar commits atômicos.
- [x] Validar testes, PDF, renderização e fluxo de impressão no Chrome.

## Requisitos

- Permissão `orders.print` para superAdmin, owner, manager, attendant e kitchen; courier e customer sem acesso.
- Respeitar empresa e unidades atribuídas à cozinha. Fora do escopo retorna `ORDER_NOT_FOUND`.
- Resposta inclui número, data, unidade, cliente, telefone, entrega, endereço, itens, opções, observações, pagamento, valores e responsável pelo preparo.
- PDF monocromático vetorial: 80 mm, margem interna 4 mm e altura calculada pelo conteúdo.
- Botão disponível em todos os status autorizados; impressão nunca altera status.
- PDF carregado em frame temporário na página atual e enviado ao diálogo de impressão sem abrir nova aba.
- PDF solicita escala real e seleção de bandeja pelo tamanho da página; navegador e driver mantêm controle sobre impressora, papel e modo monocromático.
- Sem migração, logo ou imagens.

## Validação

- Backend: resposta completa, retirada sem endereço, tenant incorreto, cozinha fora da unidade e matriz de permissões.
- Frontend: assinatura `%PDF`, largura 80 mm, altura variável e textos longos sem corte; endereço opcional, PIX/cartão, observações, opções, descontos e pedido longo.
- Inspecionar PDF com `pdfinfo` e renderização para imagem.
- Smoke test no Chrome para aba do PDF e fallback.
- Aceitação física na Elgin i9 permanece manual: bobina 80 mm, escala 100%, sem margens extras e sem cortes.

## Limites técnicos

- Aplicação não seleciona impressora nem controla opções protegidas do navegador, incluindo a seleção de preto e branco.
- Usuário escolhe a Elgin; driver deve usar bobina de 80 mm.
- Preferências do PDF são dicas; navegador ou driver pode ignorar escala e escolha de bandeja pelo tamanho.

## Resultado da validação

- Backend: build passou; suite acionada pelo hook passou com 380 testes. Casos novos de
  recibo e matriz de permissões somam 15 testes direcionados aprovados.
- Frontend: build passou sem alertas de rota. Os 4 testes do recibo passaram e cobrem PDF
  real, 80 mm, altura variável, entrega/retirada, endereço/pagamento opcionais, PIX/cartão,
  opções, observações, descontos e conteúdo longo.
- Suite frontend conjunta: 150 testes passaram. Dois testes preexistentes sofreram colisão
  de mocks entre arquivos (`tanstack.test.ts` e `CartSuggestions.test.ts`); ambos passaram
  quando executados isoladamente.
- Inspeção PDF: uma página de 80 × 861 mm, assinatura `%PDF`, `OpenAction` de impressão,
  texto final extraído 40 vezes e renderização de 454 × 4882 px sem conteúdo cortado.
- Smoke Chrome local anterior: botão `Imprimir` visível e endpoint consultado. Fluxo agora usa
  frame temporário e mantém a página de pedidos aberta; requer nova aceitação manual no navegador.
- Aceitação física na Elgin i9 requer operador e impressora locais: usar bobina de 80 mm,
  escala 100% e nenhuma margem adicional do driver.
