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
O cabeçalho mostra apenas o logotipo da empresa, sem nome da empresa ou da unidade. Com várias unidades, a homepage mantém a seleção de unidades.

Na seleção de unidades, unidades sem imagem própria usam o logotipo da empresa
centralizado, sem recorte. Não há configuração separada de imagem padrão da unidade.

O parâmetro `?menuOnly=true` no cardápio da unidade (ou na homepage com unidade única)
ativa a visualização somente de consulta: categorias, produtos, imagens, descrições e
preços. Produtos abrem detalhes e opções para consulta, incluindo ampliação das fotos,
sem seleção de opções, observações, quantidades ou ações de carrinho. Oculta banners,
detalhes da unidade, funcionamento, entrega, avaliações e cashback. Sem o parâmetro,
ou com `menuOnly=false`, permanece a vitrine completa.

O parâmetro `taxes=false` exibe preços comerciais sem taxas no catálogo, destaques e
detalhes do produto. Com `taxes=true` ou ausente, respeita as regras de exibição das
taxas cadastradas (embutidas, explícitas ou somente no checkout), independentemente
de `menuOnly`. O parâmetro controla a apresentação; não altera taxas reais de pedidos
ou itens adicionados ao carrinho na vitrine completa.

`/$unitId/cardapio` redireciona, substituindo a entrada do histórico, para
`/$unitId?menuOnly=true&taxes=false`.

## Tema visual

- Sem preferência salva do usuário, aplicar tema padrão da empresa, inclusive antes do login.
- Com troca de tema habilitada, respeitar preferência salva do usuário. Com troca desabilitada, aplicar sempre tema padrão da empresa.
- Tema do dispositivo só é aplicado quando não há preferência da conta nem da empresa.
- Todas as empresas usam a mesma estrutura visual da vitrine, personalizada pelas cores, fontes e imagens do branding.
- `fontDisplay` é a fonte de destaque da vitrine: marca no rodapé, nomes de unidades (navbar, cartões e cabeçalho), títulos principais, categorias e seções promocionais, além do nome do produto nos detalhes. Usar peso regular para evitar negrito artificial em fontes decorativas.
- `fontFamily` é a fonte de leitura: descrições, preços, horários, endereços, navegação, botões, campos, títulos funcionais de formulários/modais e subtítulos de conta/checkout. Painéis administrativos e operacionais usam essa fonte também nos títulos, priorizando leitura de dados.
- Ambas as fontes seguem o branding ativo da empresa; o kit visual deve mostrar seus nomes atuais, sem fixar fontes de uma marca específica.
- Texto de abertura, título e descrição da página inicial são editáveis no branding da empresa; valores vazios usam os textos padrão.

As cores seguem os mesmos papéis em todas as empresas; os valores da paleta salva não são convertidos para outra marca:

- `primary` / `primaryForeground`: marca, ações principais, links e seleção ativa.
- `secondary` / `secondaryForeground`: painéis de apoio da marca, incluindo unidades sem foto.
- `accent` / `accentForeground`: chamadas promocionais, ofertas, benefícios e avaliações. Não indica erro nem hover genérico.
- `background` / `foreground`: página; `card` / `cardForeground`: cartões e formulários; `popover` / `popoverForeground`: menus, seletores abertos e tooltips.
- `muted` / `mutedForeground`: apoio neutro, hover e conteúdo secundário; `surfaceSunken`: áreas rebaixadas e imagens ausentes.
- `success`, `warning`, `destructive`: sucesso/conclusão, atenção/espera e erro/exclusão. Texto sobre fundos sólidos de estado é derivado para contraste, sem alterar a cor configurada.
- `border`, `input`, `ring`: divisórias, bordas de campos e foco de teclado.

## Cadastro de clientes

- Uma conta pode ter um cadastro de cliente por empresa, inclusive contas com papel
  `superAdmin` ou de funcionário. Esse cadastro não altera o papel de acesso da conta.
- CPF e telefone de contato são dados do cadastro por empresa. Salvar esse contato não
  altera o telefone global de autenticação nem sua verificação, mesmo quando o número
  de contato pertence ao login de outra conta.
- Endereços, pedidos, preferências, cartões e créditos pertencem ao cadastro da empresa;
  cadastrar ou comprar em outra empresa não reaproveita nem transfere esses dados.

## Criação de pedidos

- Pedido pendente de pagamento não bloqueia novos pedidos do mesmo cliente/unidade.
- Nova chave de idempotência cria pedido independente. Repetir a mesma chave
  retorna o pedido já criado, sem duplicar reservas ou débitos de créditos.

## Identificação dos pagamentos online

- Descrição enviada ao SimIntPay: `Pedido <nome da empresa> - <nome da unidade>`.
- IDs do gateway e da transação SimIntPay ficam associados ao pedido localmente,
  nos registros de pagamento e tentativa; não precisam aparecer na descrição.

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
- Uma taxa combina percentual e valor fixo (ex.: 4% + R$ 1,00); ao menos um deve ser maior que zero.
  Exceção empresarial sobrescreve cada componente separadamente (vazio herda o global).
  Valor fixo usa centavos; percentual usa basis points e arredonda por unidade, somando o fixo depois. Taxas acumulam sem
  incidência entre si e preservam preço e margem cadastrados pelo lojista.
- Há dois conjuntos de taxas por empresa: as **aditivas** deste app (`PlatformFee`, somadas ao preço do comprador)
  e as **da SimIntPay** (descontadas do valor do lojista pela SimIntPay, por modalidade e parcela). Adicionais do
  `owner` na SimIntPay são outro tipo e são ignorados aqui. Custos das adquirentes são globais (a mais cara entre
  as ativas define o piso por modalidade/parcela), nunca por empresa ou lojista. O percentual mínimo inclui
  a taxa de aquisição **mais os juros do parcelamento** da adquirente, mesmo quando esses componentes são
  cadastrados separadamente na SimIntPay. A SimIntPay entrega esse percentual efetivo em `costs[].ratePpm`;
  o Delivery compara esse valor integral, sem somar juros novamente. Cobertura igual ao piso é suficiente.
- O modo de taxas da empresa pertence à SimIntPay (`Platform.deliveryFeeMode`); este app não guarda cópia e apenas
  o consome (cache de 60 s) e o edita pela SimIntPay. Padrão `SIMINTPAY_ONLY`: `ADDITIVE_ONLY` (só taxas aditivas; a
  SimIntPay não desconta nada), `SIMINTPAY_ONLY` (nenhuma taxa aditiva; a SimIntPay desconta suas taxas do lojista)
  ou `BOTH`. Empresa ainda desconhecida pela SimIntPay (404) segue como `ADDITIVE_ONLY`; qualquer outra falha
  impede precificar, em vez de adivinhar o modo. O pedido é precificado com o modo vigente e a SimIntPay o aplica no
  pagamento: se o modo mudar antes disso e houver taxa aditiva enviada em `SIMINTPAY_ONLY`, a cobrança é recusada
  (`FEE_MODE_CHANGED`) e o pedido deve ser refeito. A taxa `sim` (fixo + percentual sobre o total do comprador) sai
  da parcela do lojista, sem alterar o total do comprador. Somente o dono da SimIntPay altera modo e taxas.
- Percentual e fixo são comparados separadamente ao custo global; salvar taxas SimIntPay, exceções ou modo que
  deixem a cobertura abaixo do custo é rejeitado. A comparação usa as **taxas efetivas da empresa** (SimIntPay +
  aditivas, conforme o modo) e vale para os três modos; só o modal de taxas da empresa a julga. A tela global de
  taxas cria templates genéricos, sem ativação nem validação de cobertura (ativar/associar é por empresa).
- Modalidades que a plataforma não aceita (ex.: SIM Delivery só aceita crédito 1x e Pix) ficam em
  `Platform.deliveryDisabledLanes` na SimIntPay e são desconsideradas na cobertura; a SimIntPay rejeita cobranças
  nessas modalidades.
- Relatórios do lojista usam o total após taxas efetivas e coprodução: `total − taxas aditivas − coprodução −
  taxa SimIntPay` (`Payment.simintpayFeeCents`, congelada na confirmação). Para a SimIntPay, o custo da adquirente
  é custo e as taxas aditivas e SimIntPay são receita.
- Total: `max(0, subtotal − cupom − cashback − fidelidade) + frete + taxas`. Créditos nunca cobrem
  frete ou taxas. Cashback e fidelidade futuros ignoram taxas.
- `product_explicit` mostra base e taxa no produto; `embedded` mostra preço visual acrescido sem
  expor linha de taxa; `checkout_only` mantém catálogo base e detalha todas as taxas não embutidas
  no checkout.
- Pedido mantém subtotal e itens comerciais separados, grava snapshots completos das taxas e exclui
  taxas de receita, margem e recompensas empresariais. Reembolso atribui parcela comercial de modo
  proporcional ao total pago.
- Pagamentos online enviam à SIM INT PAY uma divisão explícita em centavos: total do comprador,
  parcela da empresa (`total − feeTotalCents`) e taxas da plataforma (`feeTotalCents`). A parcela comercial inclui frete e considera descontos/créditos. SimIntPay pode repartir
  itens líquidos entre empresa e coprodutores configurados exclusivamente naquela plataforma, sem
  descontos adicionais de adquirente, liquidez ou serviço. Somente as taxas pertencem à plataforma; frete fica integralmente com empresa.
- Relatórios financeiros (receita, margem, dashboard) descontam da parcela da empresa a parcela de
  coprodutores informada pela SIM INT PAY (`Payment.coproductionCents`), gravada na confirmação e
  nunca recalculada; pagamentos históricos permanecem com zero. Reembolso é proporcional à parcela líquida.
- A divisão é congelada na cobrança e reutilizada na confirmação e no estorno. Configuração
  posterior não recalcula pagamentos históricos. Novas cobranças exigem carteira empresarial
  identificada; ausência de CPF/CNPJ não permite fallback para a conta genérica Zero Grau.
- Publicação requer primeiro o backend SIM INT PAY com suporte à divisão e depois o Delivery.
  Cobranças já pendentes preservam o contrato original; nenhuma retroatribuição é automática.

## Carteira e saques empresariais

- Criação da empresa pelo superAdmin reserva plataforma pendente na SIM INT PAY antes de existir dono; não cria usuário fictício. Primeiro dono conclui plataforma e autorizações, mantendo id da reserva. Empresas já existentes sem reserva concluem o mesmo fluxo no cadastro do primeiro dono. Vínculos anteriores são preservados.
- Falha na reserva externa mantém empresa local. Repetir criação com os mesmos dados antes de existir dono retoma reserva; dados diferentes ou empresa com dono mantêm erro de slug duplicado. Cadastro do primeiro dono também retoma reserva pendente.
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

## Integração financeira canônica

Delivery usa bootstrap `/platform-registrations/:companyId` e operações `/platforms/:tag/merchants/:companyId`. Credenciais empresariais ficam criptografadas e separadas do DTO público da empresa. Tokenização de cartões passa pela SIM INT PAY com mesma conta DOM explicitamente configurada; BIN nunca deriva do token. Cartões antigos sem metadados exigem nova digitação; substituir registro salvo exige consentimento. Tentativa de pagamento nasce antes da chamada externa com chave idempotente e divisão congelada; timeout mantém incerteza e nunca autoriza cobrança duplicada. Eventos canônicos usam HMAC do corpo bruto, segredo por empresa e inbox deduplicada. Histórico anterior preserva titular e carteira; callbacks antigos continuam aceitos durante drenagem.

### Detalhamento comercial para SimIntPay

- Novas tentativas online congelam itens líquidos (`total − taxas − frete`) e frete
  separadamente, com chave idempotente estável. Tentativas anteriores mantêm contrato
  original; não inferir ou preencher histórico retroativamente.
- Contas e percentuais de coprodução pertencem exclusivamente à SimIntPay. Delivery
  não escolhe, recebe ou aplica repasses. Configuração financeira inválida gera erro
  operacional; não apresentar como recusa de cartão.
- Publicação: backend SimIntPay compatível, migration e Delivery detalhado, interface
  SimIntPay; somente então habilitar acordos após auditoria de vínculos.

## Privacidade, consentimento e mensuração de marketing

- Cada empresa é controladora dos dados dos seus clientes; Grupo SIM atua como operador da plataforma. A política de privacidade usa razão social, CNPJ, endereço e contatos da empresa, nunca dados de outra loja ou de uma variante fixa. Campos ausentes devem ser identificados, sem inventar dados jurídicos. A minuta jurídica exige revisão antes de publicação definitiva.
- Cookies essenciais independem de consentimento. Analytics (GA4/GTM) e marketing (Meta Pixel/CAPI) exigem escolhas separadas, inicialmente desativadas. Aceitar e recusar têm o mesmo destaque. O cliente pode revisar ou revogar escolhas pelo rodapé sem perder carrinho, identificação ou capacidade de comprar.
- Sem consentimento de marketing, não carregar Pixel, capturar ou persistir atribuição de marketing, nem enviar eventos à Meta, inclusive `Purchase`. Revogar limpa identificadores de marketing mantidos no navegador e bloqueia novos eventos.
- Atribuição do pedido é congelada no checkout somente com consentimento de marketing: versão do consentimento, cookies Meta, origem sem dados sensíveis e contexto técnico necessário. IP e navegador são obtidos pelo servidor. Não reconstruir atribuição de pedidos antigos.
- Um pagamento online Pix ou cartão confirmado pelo backend gera um único `Purchase` lógico por pedido consentido. Pagamento pendente, falho, expirado ou cancelado, telas de sucesso, recargas, polling e webhooks repetidos não geram novas compras. Pagamentos presenciais/dinheiro não geram `Purchase`.
- O `Purchase` usa `order.total` como valor pago, moeda `BRL`, timestamp da aprovação e `event_id` persistente. Pix e cartão distinguem-se pelo parâmetro `payment_method`. Compra é enviada exclusivamente pelo backend; navegador nunca envia `Purchase`.
- Confirmação financeira não depende da Meta. Evento de marketing nasce atomicamente com a confirmação em uma outbox; falhas de envio não desfazem pagamento, cashback ou atualização do pedido. Tentativas reutilizam o mesmo evento e timestamp, com limite, backoff e bloqueio de processamento concorrente.
- Pixel e token CAPI pertencem à empresa. Token permanece criptografado e somente gravável; consultas públicas, HTML, SDK de resposta e logs nunca recebem seu valor. Administração recebe apenas indicação de configuração. Desabilitar ou corrigir credenciais não altera o histórico financeiro.
- Dados pessoais enviados à CAPI restringem-se aos necessários para matching. E-mail e telefone são normalizados e enviados com SHA-256; identificadores técnicos exigidos pela Meta não são substituídos por hashes. Conteúdo integral de pedidos, observações e dados de pagamento não integram eventos de marketing.
- Eventos de funil representam ações reais: produto aberto, item efetivamente adicionado, checkout iniciado, cartão submetido, busca, clique de WhatsApp e primeiro cadastro. Renderização, recarga ou retorno de cliente existente não equivalem a nova ação. Mensuração nunca bloqueia navegação ou compra.

## Orientações de imagens no painel

- Campos de imagem exibem orientação de dimensões antes e depois do upload. São recomendações, sem bloquear arquivos por resolução.
- Logotipo e imagens anexas do WhatsApp aceitam qualquer dimensão.
- Ícone mobile: idealmente 512 × 512 px; imagem da unidade: 263 × 219 px; banners da unidade: 1112 × 450 px; imagem do produto: 408 × 408 px.
- Opções/complementos exibem miniatura de 56 × 56 px. A ampliação usa até 75% da altura da tela, limitada pela largura disponível, sem máximo fixo em pixels.
- A página inicial não possui banners próprios; banners pertencem às unidades.
