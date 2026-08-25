# 08 — App do Cliente

Fluxos de tela do app do consumidor final (Tauri Android/iOS). Sem landing page: abre
direto na escolha de unidade.

## 1. Tela de escolher unidade

- **Tela inicial**, sem landing page.
- Lista as unidades da empresa (da variante) com disponibilidade (aberto/fechado — ver
  [04](04-unidades.md)).
- Pode exibir banners configuráveis da empresa em carrossel acima da seleção de unidades.
- Selecionar unidade leva ao cardápio dela.

## 2. Tela de cardápio

- **Barra de pesquisa**.
- **Carrossel de banners da unidade** no topo e **carrossel de promoções** junto ao cardápio.
- **Categoria de destaques (invisível)**: "peça novamente" (por usuário) + destaques
  configurados (ver [05](05-cardapio.md)).
- **Card de produto**: título, imagem, descrição, indicador de promoção e **botões
  rápidos** (quantidade, preço total, adicionar ao carrinho).
- **Troca de unidade** (revalida carrinho — preço/disponibilidade por unidade).
- **Sumário rápido lateral** de categorias (navegação).

## 3. Tela de carrinho

- Lista de itens: nome, **valor unitário**, **quantidade editável**, valor total, campo
  de **observação** e botões editar/excluir item.
- **Sugestões de produtos**: até 6 produtos da unidade que ainda não estejam no carrinho;
  produtos com cashback aparecem primeiro e os demais preservam a ordem do cardápio.
- Ao adicionar uma sugestão com customizações obrigatórias ou opcionais, abrir o mesmo modal de
  produto usado no cardápio. Somente produto sem opções pode ser adicionado diretamente.
- **Simulação de frete** (ver [09](09-pagamentos-cashback-cupons-frete.md)).
- **Cupom de desconto** (quando houver).
- Botão **concluir pedido** → checkout #1.

## 4. Checkout #1 — Identificação

- **Email e celular** para **login sem senha** (passwordless).
- Se **não houver conta**, exibe formulário: nome completo, CPF e **cadastro de endereço**:
  - CEP, Logradouro, Nº (com opção **S/N**), Complemento (opcional), Bairro, Ponto de
    referência (opcional).
  - Campos deduzidos automaticamente do CEP (API de CEP), exceto o número.
- Regra objetiva: preencher o formulário **salva tudo no banco, cria a conta e loga** o
  cliente naquele dispositivo. Ver [07](07-clientes.md).
- Após preenchido → checkout #2.

## 5. Checkout #2 — Pagamento

- **Listagem dos itens** do pedido + **frete** + **cupom** (total final).
- **Formas de pagamento** (da unidade) e **cashback** (acúmulo previsto e resgate — ver
  [09](09-pagamentos-cashback-cupons-frete.md)).
- Após pago: **tela de obrigado** com informações do pedido, informando que o
  acompanhamento será por **WhatsApp** (ver [06](06-pedidos.md)).

## Regras comportamentais

- Ao trocar de unidade, revalidar itens do carrinho (preço/disponibilidade).
- Persistir carrinho por dispositivo/sessão.
- "Peça novamente" e destaques dependem de cliente logado com histórico.

## Pontos em aberto

- Mecanismo do passwordless (código por email/SMS/WhatsApp vs magic link).
- Pagamento in-app (online) vs na entrega vs ambos.
- Acompanhamento do pedido dentro do app (status ao vivo) além do WhatsApp.
