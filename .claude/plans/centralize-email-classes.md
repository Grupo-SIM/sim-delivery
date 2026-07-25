# Centralizar envios de e-mail

## Objetivo
Substituir os objetos `mailer.sendMail(...)` construídos nos callbacks do Better Auth e a função avulsa de atualização de pedido por classes de e-mail. Cada classe recebe apenas os dados variáveis do seu caso de uso (`to`, `name`, `url`, `status`, etc.) e herda o contrato e os defaults de transporte de `BaseEmail`.

## Diagnóstico
- `backend/src/shared/infra/betterAuth.ts` monta diretamente `from`, `to`, `subject`, `text`, `html` e o `render()` para reset de senha e magic link.
- `backend/src/shared/infra/mail.ts` também tem `sendOrderStatusEmail(...)` que cria uma mensagem avulsa e repete a responsabilidade de montagem.
- Há um `mailProvider` no `GlobalPlugin`, vindo de `@hyoretsu/providers`, mas ele não é consumido pelos envios atuais; o transporte efetivamente usado é o `mailer` Nodemailer local.
- Os templates React Email de autenticação já existem em `backend/src/modules/users/emails/`, porém seus nomes colidem com os nomes naturais das classes que devem representar os e-mails enviados.

## Implementação proposta
1. Criar `backend/src/shared/infra/emails/BaseEmail.ts` com uma classe abstrata que:
   - recebe e expõe o destinatário;
   - define o remetente padrão uma única vez, priorizando `MAIL_FROM` e aplicando o nome da aplicação ao fallback com `MAIL_USER`;
   - exige `subject` e `text` de subclasses e permite `html` opcional;
   - concentra `send()`, que delega ao `mailer` já configurado, eliminando qualquer `from` e `sendMail` montado nos casos de uso/autenticação.
2. Criar subclasses concretas no mesmo diretório:
   - `ResetPasswordEmail`: construtor com `{ to, name, url }`, assunto/texto padronizados e HTML renderizado a partir do template;
   - `MagicLinkEmail`: construtor com `{ to, url }`, assunto/texto padronizados e HTML renderizado a partir do template;
   - `OrderStatusEmail`: construtor com `{ to, status, orderId, message }`, com o conteúdo textual existente. A classe usará o comportamento comum da base, mesmo sem template HTML por enquanto.
3. Renomear os componentes React Email de autenticação para `ResetPasswordEmailTemplate` e `MagicLinkEmailTemplate` (inclusive exports/imports) para deixar os nomes sem ambiguidade para as novas classes de domínio de envio.
4. Simplificar `backend/src/shared/infra/betterAuth.ts`:
   - remover imports diretos de `render`, templates e `mailer`;
   - nos callbacks `sendResetPassword` e `sendMagicLink`, instanciar a classe correspondente com os dados gerados pelo Better Auth e chamar `send()`.
5. Remover `sendOrderStatusEmail` de `backend/src/shared/infra/mail.ts` e trocar seus dois chamadores (`UpdateOrderStatus` e `CancelExpiredUnpaidOrders`) por `new OrderStatusEmail(...).send()`, preservando a política atual de não bloquear a alteração do pedido quando a notificação falhar.
6. Cobrir o novo contrato em testes unitários próximos à infraestrutura de e-mail, injetando/mockando o transporte para verificar: remetente padronizado, payload renderizado de cada e-mail de autenticação e payload textual de status. Atualizar os testes de pedidos somente se as mudanças de importação exigirem.
7. Rodar os testes unitários focados de e-mails e pedidos; em seguida executar a validação backend indicada pelo projeto. Não enviar e-mails reais.

## Arquivos previstos
- Novo: `backend/src/shared/infra/emails/BaseEmail.ts`
- Novos: `backend/src/shared/infra/emails/{ResetPasswordEmail,MagicLinkEmail,OrderStatusEmail}.ts`
- Novo: teste unitário adjacente para a infraestrutura de e-mails
- Alterar: `backend/src/shared/infra/mail.ts`
- Alterar: `backend/src/shared/infra/betterAuth.ts`
- Alterar: `backend/src/modules/users/emails/{MagicLinkEmail,ResetPasswordEmail,index}.tsx/.ts`
- Alterar: `backend/src/modules/orders/useCases/{UpdateOrderStatus,CancelExpiredUnpaidOrders}.ts`
- Possivelmente: testes diretamente adjacentes aos dois casos de uso de pedidos, somente para adaptar mocks/imports se necessário.

## Compatibilidade
- Nenhuma rota, DTO ou configuração de ambiente muda.
- Mantém assuntos, textos, URLs, prazo informado e comportamento de erro existentes.
- A implementação não tentará migrar ou ativar o `mailProvider` não utilizado do `GlobalPlugin`; ela preserva o transporte efetivamente usado e centraliza a construção das mensagens sobre ele. A possível remoção/consolidação desse provider fica fora deste refactor para não alterar a seleção de driver/configuração sem necessidade.
