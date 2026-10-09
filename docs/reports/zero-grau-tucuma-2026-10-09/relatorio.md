# Zero Grau Tucumã — comparação banco × iFood

Consulta em 09/10/2026. Banco capturado às 21:46 UTC (18:46 em Recife).

Fonte: [cardápio da loja no iFood](https://www.ifood.com.br/delivery/rio-branco-ac/zero-grau-sorvetes---tucuma-conjunto-tucuma/e2183ad9-d0c6-46fb-802b-aee61da7122b).
Empresa `01a0f62e-f662-7d28-801d-f4eea0f9be24`; unidade `cmuq0q97v000201qginb30m9x`.

Banco consultado em sessão com `default_transaction_read_only=on` e transação `REPEATABLE READ READ ONLY`, encerrada com `ROLLBACK`. Nenhuma atualização executada. Consulta limitada às tabelas de catálogo; nenhum dado de clientes ou pedidos incluído.

## Resultado

Banco contém 38 produtos, 8 categorias, 33 grupos e 364 opções. Todos os 38 produtos estão associados à unidade, disponíveis e sem preços sobrescritos ou promocionais. Não existem exclusões ou opções adicionais locais.

iFood contém 131 itens em 11 categorias. Essa contagem inclui apresentações separadas de um mesmo produto: sabores de sorvete, tamanhos de açaí e combinações de pizza. Não é correto cadastrar 131 novos produtos: várias apresentações já são representadas pelas opções existentes.

### Produtos novos

| Produto | Preço local proposto | Evidência |
| --- | ---: | --- |
| Paleta mexicana — Açaí | R$ 12,00 | Recheio de leite condensado; família ausente no banco |
| Paleta mexicana — Leite Ninho | R$ 12,00 | Recheio de chocolate ao leite; família ausente no banco |
| Paleta mexicana — Morango (fruta) | R$ 12,00 | Recheio de leite condensado; família ausente no banco |
| Combo — Pizza grande de calabresa + Guaraná Quinari 2 litros | R$ 71,00 | Combo ausente; sabores de bebida Tradicional, Abacaxi ou Zero |

Paletas têm confiança alta quanto à extrapolação do padrão de preço, sem confirmação de tabela local. Combo tem confiança média: R$ 71,00 é preço promocional inferido; pizza e bebida avulsas atuais somam R$ 81,00. Desconto de R$ 10,00 precisa de validação comercial antes de aplicar.

### Opções que faltam

| Produto existente | Grupo proposto | Quantidade | Preço |
| --- | --- | ---: | --- |
| Sorvete | Sabor | 32 | R$ 9,00, exceto Açaí com Leite Ninho a R$ 8,00 inferidos |
| Milk shake | Sabor | 5 | R$ 14,00 pequeno / R$ 18,00 grande, preservados |
| Picolé simples | Sabor | 5 | R$ 2,00 preservados |
| Picolé cremoso | Sabor | 18 | R$ 3,50 preservados |
| Picolé especial | Sabor | 4 | R$ 4,50 preservados |
| Novo combo de pizza | Sabor do Guaraná Quinari | 3 | Incluídos no preço do combo |

Preparadas 4 inserções de produtos, 4 vínculos de categoria, 4 associações à unidade, 6 grupos, 67 opções e 37 atualizações de registros existentes (2 nomes de tamanho, 1 descrição de produto e 34 imagens de sabores de pizza). Cada grupo seleciona um sabor obrigatório, sem repetição. Imagens, descrições, IDs determinísticos, posições e vínculo com o produto estão no JSON. As cinco opções do milk shake servem aos dois tamanhos, comprovados no iFood.

Picolé de Tapioca consta na resposta do catálogo como disponível e habilitado. A exibição inicial do navegador não mostrou esse item; inclusão baseada no dado estruturado da mesma loja.

### Dados incompletos e divergências

- **Milk shake:** banco usa “Pequeno” e “Grande”; iFood informa 330 ml e 550 ml. Preparados novos nomes, preservando IDs e preços. Descrição pode informar sorvete do sabor escolhido e flocos de Ovomaltine.
- **Refrigerante:** faltam marcas/apresentações. iFood confirma Coca-Cola original 350/600/1.000/1.500 ml, Coca-Cola Zero 350/600 ml, Fanta Laranja 350/1.000 ml, Schweppes Citrus 350 ml e Sprite 350 ml. JSON contém imagem, descrição e preço local inferido de cada uma. Não adicionar grupo de marcas independente sem tratar combinações: permitiria, por exemplo, Sprite 2 litros sem evidência. Preparados dados para escolher apresentação única ou produtos por marca; tamanhos atuais não devem ser removidos pela ausência no iFood.
- **Guaraná Quinari:** 500 ml coincide a R$ 5,00. Um litro no banco custa R$ 8,00; iFood sugere R$ 11,00 após descontar o acréscimo. Preservar R$ 8,00. Tradicional, Abacaxi e Zero estão documentados para o combo de 2 litros; não assumir disponibilidade desses sabores em todos os volumes.
- **Água com gás:** falta volume explícito de 500 ml. Dados do grupo de tamanho preparados na seção `review`.
- **Sucos:** sabores e adicional de leite já existem. Banco informa 390 ml; iFood informa 400 ml. Manter volume do cadastro originado no PDF local até confirmação. Cajá e acerola sem leite sugerem R$ 14,00 no iFood descontado; banco cobra R$ 13,00. Com leite sugerem R$ 15,00, compatíveis com banco R$ 13,00 + R$ 2,00. Não alterar deltas automaticamente.
- **Casquinha × cascão:** confirmar se são mesmo item. Cascão atual custa R$ 1,00; casquinha no iFood custa R$ 1,50 e foge do multiplicador usual. Não criar duplicata nem substituir preço sem confirmar.
- **Barca × Barcaçaí:** preço coincide em R$ 52,00. iFood explicita 500 ml de açaí e uma bola de sorvete; banco omite açaí/volume e inclui chantilly/tubetes. Preparada descrição observada, com revisão de composição antes de substituí-la. Sabor do sorvete também precisa ser definido se a bola for mantida.
- **Casadinho:** açaí com cupuaçu já existe em 350/500 ml. iFood informa que acompanhamentos não vão separados; essa observação pode enriquecer a descrição, sem novos produtos.
- **Imagens:** nenhum produto atual está sem imagem. Fotos específicas de sabores e apresentações faltam nas opções; preparadas URLs observadas, preservando imagem principal atual. URL não significa licença de reutilização comprovada.
- **Categorias:** diferenças são de organização. Pizzas tradicionais/doces/especiais e picolés podem continuar nas categorias amplas existentes. Não criar categorias só para reproduzir agrupamento do iFood.
- **Ausência no iFood:** não implica exclusão do banco. Produtos do PDF local, pizza família, sabores adicionais de suco, porções e salgados devem permanecer.

## Pizzas e limite da consulta

Detalhe completo obtido para pizza tradicional pequena: 34 sabores e quatro preferências de borda. Todos os 34 sabores já estão no banco; nenhuma nova opção de sabor necessária nesse detalhe. Faltam as 34 imagens específicas, preparadas como atualização das opções da pizza pequena.

Descrições de ingredientes já existem no banco, provenientes do PDF local. JSON registra texto atual e texto do iFood lado a lado: diferenças devem ser revisadas comercialmente antes de substituir. Sabores dos outros tamanhos não receberam atualização automática de imagens ou composição.

Divergências de preço observadas na pequena:

| Item | Banco | iFood descontado /1,40 | Tratamento |
| --- | ---: | ---: | --- |
| Vegetariana | R$ 56,00 | R$ 68,57 | Preservar banco; padrão externo inconsistente |
| Frango | R$ 48,00 | R$ 48,43 | Preservar banco; provável exceção/arredondamento externo |
| Borda simples | R$ 10,00 | R$ 17,00 | Preservar banco; divergência comercial |

As outras 32 correspondências de sabores da pequena coincidem com o preço local ao dividir por 1,40. iFood exige uma preferência de borda, incluindo tradicional gratuita. Banco usa borda opcional: ausência de seleção já representa tradicional, sem necessidade de cobrar ou duplicar opção.

**Cobertura dos complementos: 1 de 21 detalhes verificado.** Após a primeira consulta, iFood retornou HTTP 403 para os demais detalhes e a interface deixou de carregá-los. As 16 outras apresentações de pizza e os quatro itens de açaí/cupuaçu permanecem sem conferência dos grupos internos. Cadastro principal dos 131 itens foi capturado, mas este relatório não representa auditoria completa desses 20 conjuntos de complementos. JSON lista IDs pendentes em `coverage.uncapturedDetailItemIds`. Resposta de erro com opções vazias não foi tratada como ausência de complementos.

## Critério de preço

Padrão observado: `preço iFood = preço local × 1,40`. Logo, preço local inferido é `arredondar(preço iFood em centavos / 1,40)`.

| Correspondência | Banco | iFood | Fator |
| --- | ---: | ---: | ---: |
| Pizza pequena tradicional | R$ 48,00 | R$ 67,20 | 1,40 |
| Pizza média tradicional | R$ 58,00 | R$ 81,20 | 1,40 |
| Pizza grande tradicional | R$ 70,00 | R$ 98,00 | 1,40 |
| Açaí 350 ml | R$ 14,00 | R$ 19,60 | 1,40 |
| Açaí 500 ml | R$ 18,00 | R$ 25,20 | 1,40 |
| Sorvete comum | R$ 9,00 | R$ 12,60 | 1,40 |
| Picolé simples | R$ 2,00 | R$ 2,80 | 1,40 |
| Picolé cremoso | R$ 3,50 | R$ 4,90 | 1,40 |
| Picolé especial | R$ 4,50 | R$ 6,30 | 1,40 |
| Água mineral | R$ 3,00 | R$ 4,20 | 1,40 |

Não é desconto de 40% sobre iFood: dividir por 1,40 equivale a reduzir cerca de 28,57%. Preços existentes prevalecem, incluindo exceções. Preço de sorvete Açaí com Leite Ninho é R$ 8,00 inferido, expresso como delta de -100 centavos sobre base de R$ 9,00; não reduzir base de todos os sabores.

## Arquivos e aplicação futura

- `dados-preparados.json`: proposta de inserções, atualizações com valores esperados, correspondências e pendências. Preços nas linhas de escrita são locais; preços do iFood ficam na evidência separada.
- `banco-cardapio.json`: snapshot somente do catálogo, incluindo IDs atuais e preços originais.
- `ifood-complementos.json`: detalhe completo da pizza pequena e cobertura explícita dos detalhes pendentes.
- `ifood-cardapio.json`: evidência das 11 categorias e 131 itens, com textos originais e preços externos para auditoria.

JSON é pacote de dados, não migration executada. `sourceItemIds`, motivos, valores esperados e correspondências são metadados; não são colunas SQL. Aplicação futura deve preencher timestamps, verificar tenant/unidade e valores esperados, manter IDs e vínculos, inserir produto/categoria/associação/grupo/opções em uma transação e conferir rerun por IDs determinísticos. Não zerar popularidade de registros existentes. Revalidar disponibilidade e URLs antes de aplicar; disponibilidade do iFood não comprova estoque físico.

Linhas em `review` permanecem propostas, sem decisão implícita de aplicação. Criação de produtos inclui associação à unidade: apenas inserir no catálogo empresarial não os faria aparecer no cardápio Tucumã.
