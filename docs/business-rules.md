# Regras de Negócio — JB Delivery

Fonte da verdade para regras de produto e domínio do **JB Delivery**. Mantenha aqui o
**o quê** do produto (entidades, comportamentos, casos de borda normativos). Fluxo de
trabalho de agentes, estilo de código e convenções de engenharia ficam em `AGENTS.md`.

## O que é

JB Delivery é um **whitelabel de televenda**: um único app (cardápio online + sistema
básico de entrega para o motoboy) que atende **várias empresas**, cada uma com um build
Android/iOS personalizado (nome, ícone, tema, assets). Há apps para Android e iOS
(Tauri) e um painel de gestão para o dono/funcionários.

## Modelo de tenancy (resumo em 1 parágrafo)

**Multi-tenant compartilhado**: um único backend + um único banco. Cada **empresa** é um
tenant, identificado por `companyId`. Toda entidade de dados é escopada por `companyId`.
Cada **variante** whitelabel do app mapeia para exatamente uma empresa. Uma empresa
possui **N unidades** (lojas físicas). Detalhes em
[01-visao-geral-e-dominio.md](01-visao-geral-e-dominio.md).

## Glossário

- **Empresa / tenant** — cliente da plataforma. Escopo raiz de todos os dados (`companyId`).
- **Unidade** — loja física de uma empresa (endereço, horário, taxas próprios).
- **Variante** — configuração de build whitelabel (nome, ícone, tema) ligada a 1 empresa.
- **Papel (role)** — nível de acesso: `superAdmin`, `owner`, `manager`, `attendant`, `kitchen`,
  `courier` (motoboy), `customer`.
- **Cardápio** — conjunto de produtos/categorias que uma unidade oferece.
- **Cashback** — crédito acumulado pelo cliente, resgatável em pedidos futuros.

## Impressão de recibos de pedido

- `superAdmin`, `owner`, `manager`, `attendant` e `kitchen` podem imprimir e reimprimir o
  recibo de qualquer pedido visível ao seu escopo, independentemente do status.
- `kitchen` só imprime pedidos das unidades às quais está atribuída. Pedido de outra
  empresa ou unidade deve ser tratado como inexistente. `courier` e `customer` não podem
  imprimir recibos administrativos.
- Impressão é operação somente de leitura: não inicia preparo, não altera status e não
  modifica pedido, pagamento ou responsável.
- Recibo usa bobina de 80 mm e inclui identificação do pedido e unidade, status, data,
  modalidade, cliente, contato, endereço de entrega, itens, opções, observações, pagamento,
  descontos, créditos, total e responsável pelo preparo quando informado.
- Entrega sem endereço mostra `ENDEREÇO NÃO INFORMADO`. Pagamento ausente mostra
  `Pagamento não informado`. Campos opcionais vazios são omitidos.
- Visualizador do navegador permanece aberto como fallback quando diálogo automático de
  impressão não for permitido. Seleção da impressora, escala de 100% e configuração da
  bobina de 80 mm pertencem ao navegador e ao driver local.
- `owner`, `manager` e `superAdmin` podem personalizar o modelo do recibo da empresa.
  Outros papéis imprimem o modelo salvo, mas não podem consultá-lo ou alterá-lo diretamente.
- O modelo é uma lista ordenada de blocos. Cada campo dinâmico (unidade, número, status,
  data, modalidade, dados do cliente, endereço, itens, pagamento, cada linha de valor e
  responsável) aparece no máximo uma vez;
  textos personalizados e linhas divisórias podem aparecer várias vezes. Qualquer bloco
  pode ser removido, reordenado e posteriormente adicionado novamente.

## Índice

1. [Visão geral e domínio](01-visao-geral-e-dominio.md) — produto, tenancy, entidades.
2. [Whitelabel e builds](02-whitelabel-e-builds.md) — variantes, CI/CD, temas/assets.
3. [Papéis e permissões](03-papeis-e-permissoes.md) — matriz Permix.
4. [Unidades](04-unidades.md) — gestão de lojas.
5. [Cardápio](05-cardapio.md) — produtos, categorias, tags, associações.
6. [Pedidos](06-pedidos.md) — ciclo de vida, listagem, WhatsApp.
7. [Clientes](07-clientes.md) — cadastro, listagem, histórico.
8. [App do cliente](08-app-cliente.md) — fluxos de tela (menu → checkout).
9. [Pagamentos, cashback, cupons e frete](09-pagamentos-cashback-cupons-frete.md).
10. [Painel do dono](10-painel-do-dono.md) — dashboard, staff, branding (deduzido).
11. [Entregas / motoboy](11-entregas-motoboy.md) — sistema do entregador.
12. [Referências e benchmark](12-referencias-e-benchmark.md) — concorrentes, MVP vs roadmap.

## Guia de uso para LLM

- Para tarefas amplas (modelagem de domínio, planejamento de épicos), leia o conjunto
  completo. Para tarefas focadas, aponte para a seção tópica relevante.
- **Não invente regras.** Quando faltar decisão, registre em **"Pontos em aberto"** em
  vez de adivinhar.
- Mantenha **regras objetivas** (que bloqueiam) separadas de **regras comportamentais**
  (que notificam/sugerem/penalizam).
- Escopo MVP vs Roadmap: itens não presentes no esboço original são **Roadmap** e estão
  marcados como tal — ver [12-referencias-e-benchmark.md](12-referencias-e-benchmark.md).
