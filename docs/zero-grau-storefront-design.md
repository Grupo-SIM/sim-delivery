# Zero Grau — referência visual do storefront

Referência: **Home do App Zero Grau.pdf**, fornecido pelo cliente. Telas: seleção de unidade, identificação e cardápio em dois estados de rolagem.

O storefront Zero Grau usa Outfit no conteúdo e Luckiest Guy nos títulos promocionais. A ilustração em `frontend/public/zero-grau/delivery.webp` foi extraída da primeira página do PDF fornecido. Fotos, banners, horários, disponibilidade, avaliações e preços continuam vindo da API.

A paleta clara de referência está versionada em `frontend/branding/zero-grau.palette.json`. Foi aplicada ao campo `Company.themeColors.light` da empresa com slug `zero-grau`; o tema escuro foi preservado. Branding continua sendo preparado do banco pelo fluxo normal de build e atualizado em runtime pela consulta de branding. O JSON documenta os valores aplicados, sem substituir futuras edições no painel.

Estrutura visual específica da Zero Grau fica em `frontend/src/storefront.css`, sob `.zero-grau-storefront`. Home usa chamada promocional e ondas; identificação reutiliza as ondas; cardápio tem cartões com logo de fallback, categorias fixadas abaixo do cabeçalho ao rolar e barra de carrinho inferior. Banners e promoções compartilham o carrossel superior, preservando links de promoções. Desktop mantém adaptação responsiva.
