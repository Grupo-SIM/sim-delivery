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
Abra no navegador, clique nos campos e use **Baixar briefing preenchido** para
salvar alterações ou **Imprimir / Salvar PDF**. Envie arquivo e materiais juntos.
Funciona localmente, sem carregar fontes, imagens ou scripts externos.

No admin, **Empresas** oferece download genérico e download preenchido na linha
de cada empresa. Versão preenchida usa dados atuais da listagem, incluindo cores
claras/escuras, logos, banners, fontes e canais públicos. Campos ausentes ficam
como “A preencher”. Não inclui senhas, configurações financeiras, API, rastreadores
ou modelos de mensagens. Links de assets ficam como texto; arquivos não são
incorporados. Revisão do briefing não modifica cadastro.

Fonte do layout: `frontend/src/lib/visual-identity/template.html`; preenchimento:
`template.ts` na mesma pasta. Ao alterar campos/layout, atualizar também arquivo
genérico público para manter mesma estrutura.
