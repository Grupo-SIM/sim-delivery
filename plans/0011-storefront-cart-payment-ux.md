# Plan 0011 — UX de cardápio, carrinho e pagamentos

## Objective

Corrigir navegação, elevação visual, seleção de customizações, carrinho e pagamento por cartão,
incluindo CPF do titular, erros reais do provedor e gestão de cartões salvos.

## Product and Architecture Decisions

- Grupos `average` e `highest` mantêm valores individuais atuais e explicam como o adicional é calculado.
- Sombras difusas saem de cards e painéis; overlays mantêm elevação funcional.
- Tooltip passiva não abre por tap. Confirmação destrutiva controlada continua disponível no mobile.
- Sugestões mantêm algoritmo atual; produtos com opções abrem o mesmo modal como submodal.
- CPF do titular é separado do CPF do cliente e fica associado ao cartão salvo sem ser exposto pela API.
- Erros de provedor usam contrato `{ error, description? }` e mostram o melhor detalhe seguro disponível.

## Implementation Plan

- [x] 1. Registrar regras de sugestão, cartões salvos e autofill na documentação do projeto.
- [x] 2. Ajustar sombras, categorias, tooltips, scrollbar do produto e barra do carrinho.
- [x] 3. Componentizar as opções do modal, tornar linhas clicáveis e explicar regras de preço.
- [ ] 4. Integrar sugestões ao submodal e inverter ações finais do carrinho.
- [ ] 5. Adicionar documento do titular, exclusão de cartão e erros tipados no backend.
- [ ] 6. Exportar OpenAPI, regenerar SDK e atualizar formulário/perfil no frontend.
- [ ] 7. Cobrir regras críticas, verificar viewports e concluir builds/commits.

## Verification Criteria

- Categorias não encostam na scrollbar; scrollbar do produto fica evidente enquanto houver overflow.
- Cards/painéis não exibem halo difuso; modais e popovers continuam distinguíveis.
- Tap móvel não deixa tooltip passiva aberta; teclado/hover desktop e confirmações continuam funcionando.
- Linha inteira seleciona a opção sem duplicar ações de imagem, checkbox ou stepper.
- Sugestão com opções abre submodal; sem opções adiciona diretamente; carrinho permanece aberto.
- Formulário expõe metadados de autofill, alinha validade/CVC e inicia salvamento desmarcado.
- CPF de terceiro nunca altera o CPF do cliente; cartões podem ser listados e removidos pelo dono.
- Respostas de erro são JSON tipado e exibem mensagens como CPF inválido ou recusa por limite.

## Potential Risks and Mitigations

1. **Mensagem ausente no provedor.** Usar parser tolerante e fallback traduzido.
2. **PII de terceiro.** Escopar por cliente/tenant, não logar e não retornar o CPF completo.
3. **Regressão de foco em modal aninhado.** Usar camada de submodal e validar teclado/touch.
4. **Mudança visual global.** Limitar remoção de sombra aos primitives de superfície e revisar viewports.

## Alternative Approaches

1. Mostrar impacto marginal da média: rejeitado; valores negativos/dinâmicos aumentariam confusão.
2. Remover toda elevação: rejeitado; overlays precisam continuar destacados.
3. Pedir CPF em toda compra com cartão salvo: rejeitado; documento fica associado ao cartão.

## Progress

- Concluído: plano versionado; regras de sugestão, cartão salvo, CPF do titular e autofill registradas.
- Concluído: sombras de superfícies removidas; tooltip respeita modalidade; categorias, barra e scrollbar ajustadas.
- Concluído: modal componentizado; linhas clicáveis e regras `average`/`highest` explicadas.
- Próximo: concluir sugestões/submodal e backend de pagamentos.
