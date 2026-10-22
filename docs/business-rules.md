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

Quando a empresa possui apenas uma unidade disponível no catálogo público, ela é a
unidade padrão: a homepage renderiza diretamente seu cardápio, mantendo a URL raiz.
O nome da unidade aparece como subtítulo da empresa no cabeçalho, sem título duplicado. Com várias unidades, a homepage mantém a seleção de unidades.

Na seleção de unidades, unidades sem imagem própria usam o logotipo da empresa
centralizado, sem recorte. Não há configuração separada de imagem padrão da unidade.

## Tema visual

- Sem preferência salva do usuário, aplicar tema padrão da empresa, inclusive antes do login.
- Com troca de tema habilitada, respeitar preferência salva do usuário. Com troca desabilitada, aplicar sempre tema padrão da empresa.
- Tema do dispositivo não substitui automaticamente o padrão da empresa.

## Criação de pedidos

- Pedido pendente de pagamento não bloqueia novos pedidos do mesmo cliente/unidade.
- Nova chave de idempotência cria pedido independente. Repetir a mesma chave
  retorna o pedido já criado, sem duplicar reservas ou débitos de créditos.

## Encerramento do expediente

- Filtro de datas do painel de pedidos considera a data de abertura do expediente de cada
  unidade. Expediente aberto no dia 22 e encerrado na madrugada do dia 23 pertence ao dia 22,
  sem repetir seus pedidos no filtro do dia 23. A abertura é inclusiva e o fechamento é
  exclusivo: pedido criado exatamente no fechamento não pertence ao expediente encerrado.
  Intervalos incluem os expedientes de todas
  as datas selecionadas. Dias sem horário configurado ou marcados como fechados usam o dia
  civil, excluindo a madrugada pertencente ao expediente anterior, para preservar a consulta
  de pedidos. Histórico do cliente e filtros com timestamps (como o dashboard) mantêm
  os limites exatos informados.

- Fim do expediente e encerramento manual do dia não cancelam pedidos operacionais.
- Pedidos não concluídos mantêm status e reservas e continuam visíveis no painel no
  próximo expediente, para resolução pelo gerente ou proprietário. Cancelamento é manual.
- A expiração de pedidos pendentes de pagamento permanece uma regra independente.

## Movimentações de insumos

- O motivo é opcional em entradas, ajustes e perdas. Movimentações sem motivo são
  registradas com texto vazio.

## Glossário

- **Empresa / tenant** — cliente da plataforma. Escopo raiz de todos os dados (`companyId`).
- **Unidade** — loja física de uma empresa (endereço, horário, taxas próprios).
- **Variante** — configuração de build whitelabel (nome, ícone, tema) ligada a 1 empresa.
- **Papel (role)** — nível de acesso: `superAdmin`, `owner`, `manager`, `attendant`, `kitchen`,
  `courier` (motoboy), `customer`.
- **Cardápio** — conjunto de produtos/categorias que uma unidade oferece.
- **Cashback** — crédito acumulado pelo cliente, resgatável em pedidos futuros.

## Códigos WhatsApp e links mágicos de acesso

- Login por celular exige WhatsApp da empresa configurado e pareado. Sem essa configuração, a tentativa deve informar que o login por celular não foi habilitado e orientar o acesso por e-mail, sem tentar enviar o código.
- Códigos de acesso enviados por WhatsApp expiram 30 minutos após a emissão.
- Links mágicos de acesso expiram 30 minutos após a emissão e podem ser usados uma única vez.

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
- O recibo pode destacar o número do pedido em uma faixa preta, usar divisores contínuos
  ou tracejados e exibir, quando disponíveis, previsão, indicador de primeiro pedido, CPF,
  valor pago online e saldo a cobrar. Cashback, fidelidade, descontos e entrega permanecem
  linhas financeiras independentes. Taxas da plataforma não embutidas aparecem juntas no bloco
  singleton `fees`; taxas embutidas aparecem somente nos preços visuais dos itens.

## Taxas de plataforma sobre compras

- Somente `superAdmin` cria, edita, ativa ou exclui taxas globais e administra exceções por empresa.
- Toda empresa herda taxas globais ativas. Exceção empresarial pode sobrescrever valor ou desativar
  a taxa; remover a exceção restaura herança. Exclusão global é lógica e não altera pedidos antigos.
- Taxa `product` incide por unidade sobre preço comercial efetivo, incluindo promoção e opções.
  Taxa `order` incide uma vez sobre subtotal comercial e aceita apenas exibição `checkout_only`.
- Valor fixo usa centavos; percentual usa basis points e arredonda por unidade. Taxas acumulam sem
  incidência entre si e preservam preço e margem cadastrados pelo lojista.
- Total: `max(0, subtotal − cupom − cashback − fidelidade) + frete + taxas`. Créditos nunca cobrem
  frete ou taxas. Cashback e fidelidade futuros ignoram taxas.
- `product_explicit` mostra base e taxa no produto; `embedded` mostra preço visual acrescido sem
  expor linha de taxa; `checkout_only` mantém catálogo base e detalha todas as taxas não embutidas
  no checkout.
- Pedido mantém subtotal e itens comerciais separados, grava snapshots completos das taxas e exclui
  taxas de receita, margem e recompensas empresariais. Reembolso atribui parcela comercial de modo
  proporcional ao total pago.
- Pagamentos online enviam à SIM INT PAY uma divisão explícita em centavos: total do comprador,
  parcela da empresa (`total − feeTotalCents`) e taxas da plataforma (`feeTotalCents`). A carteira
  empresarial recebe integralmente sua parcela, incluindo frete e após descontos/créditos, sem
  descontos adicionais de adquirente, liquidez ou serviço. Somente as taxas pertencem à plataforma.
- A divisão é congelada na cobrança e reutilizada na confirmação e no estorno. Configuração
  posterior não recalcula pagamentos históricos. Novas cobranças exigem carteira empresarial
  identificada; ausência de CPF/CNPJ não permite fallback para a conta genérica Zero Grau.
- Publicação requer primeiro o backend SIM INT PAY com suporte à divisão e depois o Delivery.
  Cobranças já pendentes preservam o contrato original; nenhuma retroatribuição é automática.

## Carteira e saques empresariais

- Cadastro do primeiro dono pelo superAdmin provisiona automaticamente conta ativa e carteira
  zerada na SIM INT PAY, usando email normalizado e senha informada. Sem senha, cada sistema
  envia seu próprio link de definição de senha; senhas definidas depois são independentes.
- CPF/CNPJ é opcional no cadastro da empresa e do primeiro dono. Configuração posterior de saques
  sincroniza CPF/CNPJ com conta e vínculo financeiro na SIM INT PAY. Donos adicionais não substituem
  conta financeira. Repetir cadastro do primeiro dono após falha externa retoma provisionamento,
  sem trocar senha ou zerar carteira. Email/CPF/CNPJ de outra conta bloqueiam associação automática.


- Cada empresa possui carteira própria na SIM INT PAY, identificada por
  `integrationKey = sim-delivery_<slug-da-empresa>` e `externalMerchantId = companyId`; saldo e
  saques nunca seguem filtro de unidade nem a integração genérica `sim-delivery`.
- SIM INT PAY é fonte de saldo disponível, valores em processamento, taxa, elegibilidade e
  status. `PENDING` e `APPROVED` permanecem em processamento; `COMPLETED` e `REJECTED` são finais.
- `superAdmin`, `owner` e `manager` consultam a carteira e solicitam saques. Somente
  `superAdmin` configura CPF/CNPJ, mínimo local opcional e chave Pix padrão.
- CPF ou CNPJ válido e único é obrigatório para provisionar a carteira. Mínimo vazio desativa a
  validação local; a SIM INT PAY ainda valida valor positivo, líquido, saldo e limites próprios.
- Cotação e solicitação usam valor bruto em centavos. Taxa fixa e percentual são calculadas
  pela SIM INT PAY e os valores bruto, taxa e líquido ficam congelados no histórico local.
- Chave Pix informada no último saque criado passa a ser o padrão da empresa.
- Solicitação local nasce antes da chamada externa e seu id é chave idempotente. Callbacks
  repetidos são aceitos sem duplicar eventos; consulta direta converge o espelho local quando
  callback atrasar ou falhar.
- Retroatribuição de pagamentos confirmados é operação administrativa, começa em dry-run e
  exige execução explícita após conferência dos conflitos.

- O campo técnico `cnpj` do contrato e do vínculo financeiro aceita CPF (11 dígitos) ou CNPJ (14). Na SIM INT PAY, CPF identifica pessoa física em `user.cpf`; CNPJ identifica pessoa jurídica em `user.cnpj`.

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

## Edição de produtos e customizações

- Produto, grupo de opções e opção têm salvamentos independentes. Salvar uma opção persiste seus dados, incluindo a foto, sem exigir salvar o grupo ou o produto.
- Descartar alterações de um grupo ou produto não desfaz opções ou grupos já salvos.
