# Identidade visual — referência Estação 237

Extraída do HTML “Cardápio · Estação 237 Restaurante e Empório”, fornecido como
`index (7).html`. Referência comercial para preparar briefings do SIM Delivery;
não altera a identidade das empresas cadastradas.

| Papel no HTML | Cor |
| --- | --- |
| Principal / títulos / navegação (`wine`) | `#8E1B2E` |
| Variação principal (`wine-dark`) | `#6E1424` |
| Destaque / detalhes (`gold`) | `#E3A41A` |
| Texto / rodapé (`ink`) | `#1F1513` |
| Texto secundário (`soft`) | `#5F504A` |
| Fundo (`cream`) | `#FBF6EE` |
| Cartões (`card`) | `#FFFFFF` |
| Bordas (`line`) | `#EADFCF` |
| Ação WhatsApp / pedido | `#1F8F4E` |

Títulos e controles: **Rubik**, pesos 500, 700 e 800. Corpo: **Nunito Sans**,
pesos 400, 600 e 700. Texto base: 16 px, entrelinha 1,45. Títulos de seção: 28 px,
peso 800. Rótulos superiores: caixa alta, 13 px, espaçamento 0,18 em.

Composição: fundo creme, cabeçalho branco com filete dourado, navegação vinho,
cartões brancos com bordas suaves, cantos de 16 px e controles em cápsula.
Logo centralizado com 170 px de largura. Fotos horizontais com recorte ou imagens
isoladas com `object-fit: contain`. Rodapé escuro e links dourados.

Marca da referência: **Estação 237 · Restaurante e Empório**, Rio Branco–AC.
Instagram: `@estacao237ac`. WhatsApp público: `(68) 99281-5151`.
O HTML não define tema escuro; não há paleta escura extraída.

## Template comercial

Arquivo genérico: [identidade-visual.html](../frontend/public/templates/identidade-visual.html).
Página visual, sem formulário: mostra cores com nomes e HEX, prévias de aplicação
nos temas claro e escuro e fontes cadastradas. Tema claro genérico usa cores
extraídas da referência; tema escuro é uma adaptação sugerida, identificada na página.

No admin, **Empresas** oferece download genérico e download com identidade atual
na linha de cada empresa. Cores empresariais seguem mesma resolução usada no app;
sem paleta cadastrada, usam padrão do sistema. Fontes são identificadas pelo nome,
sem downloads externos. Nenhum dado financeiro, API ou segredo é exportado.

Na página baixada, **Baixar imagem da paleta (SVG)** exporta todas as cores dos dois
temas. **Imprimir / Salvar PDF** usa impressão do navegador. SVG pode ser editado
em ferramenta vetorial, preservando atributos `data-theme`/`data-token` dos retângulos
e cores `fill` em HEX de seis dígitos. Importação usa `fill`, não texto do rótulo.

Em **Identidade visual → Tema e cores → Importar imagem da paleta (SVG)**,
selecione imagem exportada. Importação é local e preenche edição dos dois temas;
somente **Salvar** persiste. Arquivo incompleto, inválido ou acima de 2 MB é
rejeitado sem alterar cores. PNG/JPG, screenshots e PDFs não preservam identificação
dos campos e não são importáveis. Importação lê somente cores, sem executar SVG
nem alterar fontes ou outros dados da empresa.

Fonte do layout: `frontend/src/lib/visual-identity/template.html`; preenchimento:
`template.ts` na mesma pasta. Ao alterar layout, atualizar também arquivo genérico
público para manter mesma estrutura.
