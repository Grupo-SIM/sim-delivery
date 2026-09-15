# WhatsApp via WAHA

## Objetivo

Concluir notificações duráveis de status de pedido e autenticação OTP por WhatsApp no login inicial usando uma instância WAHA existente.

## Decisões

- Mensagens de pedido usam outbox persistente com entrega pelo menos uma vez.
- OTP usa envio síncrono para devolver falhas ao usuário.
- OTP aparece somente no login inicial (`/identify`), não na identificação dentro do checkout.
- Telefones aceitos: Brasil em E.164 (`+55` e 11 dígitos nacionais).
- WAHA não será provisionado por este repositório.

## Progresso

- [x] Cliente WAHA compartilhado, validação de configuração e OTP.
- [x] Modelo, migration, enfileiramento transacional e worker da outbox.
- [x] Templates completos de status e SDK regenerado.
- [x] Fluxo frontend de OTP por WhatsApp.
- [x] OTP restrito ao login inicial; checkout mantém identificação por e-mail.
- [x] Editor transacional multiline com prévia e até três anexos de imagem/PDF por status.
- [x] Testes, hooks de commit e documentação final.

## Próximo passo

Concluído. Configurar drivers e credenciais no ambiente antes do deploy; migration permanece para aplicação pelo operador.
