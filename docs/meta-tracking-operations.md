# Operação — Meta Pixel e API de Conversões

Implementação: [plano 0019](../plans/0019-meta-pixel-capi.md). Regras: [consentimento e marketing](business-rules.md#privacidade-consentimento-e-mensuração-de-marketing).

## Antes de ativar

1. Revisar juridicamente a [minuta de privacidade](legal/politica-de-privacidade.md). A página identifica a empresa como controladora e Grupo SIM como operador; não confundir interface implementada com aprovação jurídica.
2. Preencher razão social, CNPJ, endereço e contatos no cadastro da empresa. Conferir a página `/privacidade` na variante correta.
3. Revisar/aplicar a migração **somente no ambiente autorizado**. A implementação local não autoriza migração em banco compartilhado ou produção.
4. Configurar Pixel e token CAPI da mesma empresa no painel. O token é somente gravável: campo vazio não recupera o segredo. O painel mostra apenas se existe token configurado. Não colocar token em variáveis `VITE_*`, capturas, tickets ou logs.
5. Manter uma chave de criptografia estável do backend: `SIMPAY_CREDENTIALS_ENCRYPTION_KEY` ou o mecanismo versionado `BETTER_AUTH_SECRETS` existente. Mudanças nessas chaves precisam preservar capacidade de descriptografar credenciais anteriores.

## Ativação controlada

- CAPI habilitada por padrão: o worker inicia com o backend e seleciona somente eventos de empresas com token CAPI e Pixel configurados. Sem token, não tenta enviar nem consome tentativas. O envio continua exigindo consentimento de marketing registrado no pedido.
- `META_CAPI_ENABLED=false` desliga explicitamente o worker inteiro. Não é necessário definir `true` para habilitá-lo; a configuração da empresa controla sua elegibilidade.
- Para homologação autorizada, usar `META_CAPI_TEST_EVENT_CODE` fornecido pelo Meta Events Manager. Remover após homologação; não usar código de teste em produção.
- Validar no dataset da empresa consentida. Identificadores da especificação Estação 237 não são defaults globais para outras empresas.
- Não inserir Pixel manualmente em HTML/GTM para contornar o banner. Analytics e marketing são categorias distintas.
- Auditar o container GTM antes da ativação: com analytics aceito e marketing recusado, `ad_storage`, `ad_user_data` e `ad_personalization` permanecem negados. Tags de marketing, inclusive Custom HTML e tags não Google, precisam respeitar consentimento; um container configurado para ignorá-lo não é corrigido apenas pelo loader.

A ativação, pagamentos reais, envio de eventos de teste à Meta e alteração de credenciais de produção são operações externas: exigem autorização específica. Não foram executadas como parte da implementação local.

## Outbox e falhas

A confirmação financeira grava o evento na mesma transação do pagamento. O envio ocorre depois, nunca dentro da transação. A chave lógica por empresa/pedido e `event_id` estável impedem duplicatas técnicas; tentativas HTTP usam sempre o mesmo `event_id`, valor e timestamp.

O worker consulta a fila a cada 30 segundos, em lotes de até 25 eventos, com lease de 120 segundos e timeout HTTP de 15 segundos. Retenta até 12 vezes, com backoff exponencial de 30 segundos até 6 horas e jitter. Eventos com mais de 7 dias expiram. Respostas permanentes 4xx não são repetidas, salvo 429 ou indicação transitória.

Falha Meta não altera pagamento confirmado. Monitorar contagens de eventos pendentes, enviados, falhos e expirados e erros sanitizados; nunca registrar payload, token, e-mail, telefone ou URL sensível. Corrigir credencial/configuração antes de qualquer reprocessamento manual. Não recriar compras antigas nem alterar `event_id` para “forçar” aceitação.

Payload deixa de ser necessário após envio e é limpo. Atribuição e payload remanescentes têm retenção de 7 dias; metadados de entrega e idempotência permanecem sem dados de matching.

## Checklist de homologação

Usar serviços locais descartáveis, transporte Meta falso e dados fictícios para testes automatizados. No navegador, interceptar/bloquear destinos externos durante validação local.

- Sem decisão ou com recusa: nenhum script Meta/GA4/GTM, cookie ou evento não essencial.
- Aceitação por categoria: somente scripts autorizados; navegação SPA emite PageView sem duplicar inicialização.
- Revogação: limpa identificadores, interrompe novos eventos e não perde carrinho/checkout.
- Produto, carrinho, checkout, busca, WhatsApp e cadastro: um evento por ação real; cliente já cadastrado não gera novo cadastro.
- Pix pendente/falho/expirado/cancelado: nenhum Purchase. Aprovação Pix/cartão: um evento lógico com valor total e método correto.
- Repetição de webhook, reconciliação, reload e polling: sem novas compras.
- Erro/timeout/429 Meta: pagamento continua confirmado; retry preserva identificadores e timestamp.
- Empresas distintas: sem mistura de Pixel, token, pedido ou atribuição.
- Painel/API pública: token nunca retorna, inclusive após salvar.

Meta Pixel Helper, Events Manager, Event Match Quality e diagnóstico de produção dependem da homologação externa autorizada e não substituem testes locais.
