# WhatsApp geral e por unidade via WAHA

## Objetivo

Manter a sessão WAHA geral para OTP e fallback, enquanto cada unidade pode conectar uma sessão própria para notificações de pedidos.

## Progresso

- [x] Criar modelo, migration e cliente de administração de sessões WAHA.
- [x] Adicionar endpoints, autorização e fallback do contato público.
- [x] Rotear outbox pela sessão da unidade com fallback geral.
- [x] Criar modal administrativo de conexão e QR Code.
- [x] Regenerar contratos, documentar, testar e validar.

## Decisões

- Sessão da unidade: `sim-delivery_<company-slug>_<unit-slug>`, persistida e imutável após criação.
- Owner, manager atribuído à unidade e superAdmin podem administrar a conexão.
- Sessão geral atende OTP e fallback quando a sessão da unidade não está operacional.
- WhatsApp público configurado prevalece; número conectado funciona como fallback.
- QR Code é obtido sob demanda e nunca persistido.
