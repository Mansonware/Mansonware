# V2 premium — demonstração comercial por segmento

## Escopo entregue
- Direção visual premium em tema escuro para a página de demonstração e composição clara dentro da prévia do site.
- Sete imagens temáticas, uma por segmento, com texto alternativo atualizado ao trocar a categoria.
- Prévia com hierarquia editorial, bloco fotográfico, cartões de soluções e chamada final.
- Transições discretas e animações de entrada respeitando `prefers-reduced-motion`.
- Seletor responsivo, navegação por âncoras e estado compartilhável por `?nicho=`.
- CTA comercial preservado para WhatsApp `5512996335539`, com segmento e objetivo contextualizados.
- Oferta mantida em **R$ 297**, com 50% na contratação e 50% na entrega; escopo e prazo definidos na proposta.
- Conteúdo permanece demonstrativo, sem empresas, depoimentos, avaliações ou métricas fictícias; rota com `noindex,nofollow`.
- CSP da página limita scripts, estilos e conexões à própria origem e permite imagens apenas da origem própria e do CDN Unsplash.

## Imagens
As imagens são carregadas do Unsplash e variam conforme o segmento selecionado. O texto alternativo é alterado junto com a imagem. A página possui fallback visual caso a imagem externa não carregue.

## Validação automatizada
O workflow comercial executa `comercial-tools/check-demo-landing-v2.mjs` antes da suíte Playwright/axe. O teste verifica os sete segmentos, URL e texto alternativo das imagens, CSP, noindex, preço e destino do WhatsApp. A suíte de navegador existente continua cobrindo interação, mensagem contextualizada, ausência de prova social fictícia e larguras de 320, 390, 768 e 1440 px.

## Publicação
Esta alteração permanece no PR #12. Não fazer merge nem publicar em produção sem aprovação explícita do Manson.
