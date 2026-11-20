# Validação do site comercial Mansonware

## Cobertura

| Verificação | Resultado observado |
| --- | --- |
| Responsividade | Chromium nas larguras de 320, 360, 390, 768, 1024 e 1440 px. A página ficou dentro da largura disponível e os destinos das âncoras existiam nas seis telas. |
| Acessibilidade | Axe-core 4.10.3, regras WCAG A/AA de 2.0 e 2.1, sem violações automáticas nas seis larguras. Link de salto, detalhes opcionais do orçamento e FAQ exercitados pelo teclado. |
| Cards e movimento | Quatro serviços sob medida e quatro projetos com descrição visível. Entrada ao rolar, preferência de movimento reduzido e botão de repetição da animação do catálogo cobertos no navegador. |
| Orçamento | O teste percorreu as oito ofertas. Para os quatro serviços com preço-base, verificou o total de duas unidades. Os outros quatro exibiram “Sob consulta”. |
| Conversão | Pedido rápido de bot sem preencher campos pessoais. Dois projetos premium geraram R$ 994. O navegador abriu o destino 5512996335539 com segmento, objetivo e caracteres especiais preservados. O destino externo foi interceptado no teste. |
| Privacidade | Zero eventos antes da permissão. Visita, contato direto e abertura com briefing foram testados com consentimento. Revogação persistiu ao recarregar. Global Privacy Control desativou a medição. |
| Resiliência e SEO | Link direto disponível sem JavaScript. Execução com a política de segurança de conteúdo ativa. Robots, sitemap e imagem social acessíveis. Build conferido para canonical, Open Graph absoluto e dados estruturados. |

[Execuções e capturas de tela no GitHub Actions](https://github.com/Mansonware/Mansonware/actions/workflows/comercial.yml)

## Como interpretar as métricas

O serviço de contagem registra totais por tipo de ação e intervalo nos logs privados da Render. Filtre por `mw_actions` e some as chaves de `counts` no período desejado. `visit` é um carregamento consentido, `direct` é um clique de contato direto e `brief` é uma abertura do WhatsApp com briefing. A razão entre `direct + brief` e `visit` representa cliques por carregamento medido. Uma pessoa pode clicar mais de uma vez. Mensagens recebidas e vendas fechadas devem ser conferidas no atendimento.

A origem autorizada e o conjunto fixo de rotas são verificados pelo coletor. O serviço descarta requisições com corpo. Seus registros de aplicação guardam apenas totais e horário. A disponibilidade e a retenção dos logs seguem o plano de hospedagem. O site e o WhatsApp funcionam mesmo se a contagem estiver indisponível.

## Operação

A fonte da página fica em `comercial/`. A raiz do repositório continua servindo o Local Studio. A publicação comercial executa `node comercial-tools/build.mjs` e publica `dist-comercial/`. O build usa o endereço fornecido pela Render, ou `SITE_URL` para um domínio próprio. `METRICS_URL` é a origem HTTPS do contador opcional. O coletor inicia com `node comercial-tools/metrics.mjs` e exige `SITE_URL` com a origem pública exata do site.

A auditoria automática cobre Chromium. Dispositivos físicos, leitores de tela e o envio manual de uma mensagem pelo visitante ficam fora dessa cobertura.

## Créditos visuais

Monograma e composição social criados para a Mansonware. Fonte DM Sans distribuída com a licença em `comercial/media/OFL.txt`. Fotografias das demonstrações fornecidas pelo Unsplash. As marcas e interações dessas demonstrações são fictícias.

- [Gastronomia](https://images.unsplash.com/photo-1574071318508-1cdbab80d002)
- [Hospedagem](https://images.unsplash.com/photo-1449158743715-0a90ebb6d2d8)
- [Barbearia](https://images.unsplash.com/photo-1503951914875-452162b0f3f1)

- [Relógio da demonstração de catálogo](https://images.unsplash.com/photo-1524805444758-089113d48a6d)
