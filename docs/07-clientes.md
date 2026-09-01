# 07 — Clientes

O **cliente** (Customer) é o consumidor final do app. Cadastro criado automaticamente no
primeiro checkout (ver [08-app-cliente.md](08-app-cliente.md)). Escopado por `companyId`.

## Cadastro

- **Nome completo**
- **CPF**
- **Email** e **celular** (usados no login passwordless)
- **Endereços** (1..N) — deduzidos por CEP:
  - CEP, Logradouro, Nº (com opção **S/N — Sem número**), Complemento (opcional),
    Bairro, Ponto de referência (opcional).
  - Tudo exceto o número é preenchido automaticamente a partir do CEP (API de CEP —
    Correios/ViaCEP ou similar gratuita).
- **Cashback acumulado** (saldo) — ver [09](09-pagamentos-cashback-cupons-frete.md).

Regra objetiva: preencher o formulário no checkout **salva os dados, cria a conta e loga**
o cliente naquele dispositivo (ver [08](08-app-cliente.md)).

## Listagem e filtros (painel)

Listagem de clientes com **filtragem compreensiva**, incluindo informações de pedidos:
- Por período de cadastro, unidade de preferência, nº de pedidos, **ticket médio**,
  **frequência de compra**, data do último pedido, saldo de cashback.
- Busca por nome/CPF/email/telefone.
- Cada cliente exibe **histórico de pedidos** e métricas (total gasto, cashback).
- Pedidos cancelados antes da confirmação do pagamento não entram em histórico ou métricas
  de cliente; somente uma listagem geral de pedidos pode exibi-los.

Acesso: `owner`/`manager` (gestão), `attendant` (leitura). Ver [03](03-papeis-e-permissoes.md).

## Regras comportamentais

- Segmentação para marketing (aniversário, recuperação, inatividade) — roadmap
  (disparador/automações WhatsApp; ver [12](12-referencias-e-benchmark.md)).
- Cliente só enxerga os próprios dados/pedidos no app.

## Privacidade

- Dados pessoais (CPF, contato, endereço) são sensíveis; acesso conforme papel e sempre
  filtrado por `companyId`. Nunca expor cliente de uma empresa a outra.

## Pontos em aberto

- Provedor de CEP (Correios vs ViaCEP vs outro).
- Validação de CPF (obrigatória no cadastro vs opcional).
- Consentimento/LGPD e retenção de dados.
