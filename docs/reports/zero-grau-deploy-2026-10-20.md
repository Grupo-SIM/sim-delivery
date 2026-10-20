# Zero Grau — investigação do deploy em 20/10/2026

Investigação somente leitura, aproximadamente 20:56 UTC. Domínio: `delivery.zerograusorvetesac.com`. Deploy via Komodo, stack Compose `sim_delivery`, imagens `latest`.

## Causa confirmada

Serviços foram renomeados de `frontend`/`backend` para `zero_grau_frontend`/`zero_grau_backend`, com troca de Docker Hub para GHCR. Containers antigos continuaram ativos como órfãos, anunciando os mesmos domínios nas labels do Caddy. Caddy agregou destinos antigos e novos e distribuiu requisições entre versões incompatíveis.

Definição atual em `/opt/komodo/stacks/sim_delivery/compose.yaml`, dentro de `komodo-periphery`, contém somente os dois serviços `zero_grau_*`. Há quatro containers ativos com o mesmo projeto Compose:

| Container | Imagem | Situação |
| --- | --- | --- |
| `sim_delivery-zero_grau_frontend-1` | `ghcr.io/grupo-sim/sim-delivery_frontend_zero-grau:latest` | Atual, criado em 20/10 |
| `sim_delivery-zero_grau_backend-1` | `ghcr.io/grupo-sim/sim-delivery_backend_zero-grau:latest` | Atual, criado em 20/10 |
| `sim_delivery-frontend-1` | `jbmidia/sim-delivery_frontend_zero-grau:latest` | Órfão, criado em 18/10 |
| `sim_delivery-backend-1` | `jbmidia/sim-delivery_backend_zero-grau:latest` | Órfão, criado em 18/10 |

Configuração efetiva consultada na API administrativa local do Caddy:

- Frontend: `172.18.0.70:5173` (atual) e `172.18.0.27:5173` (antigo).
- API: `172.18.0.73:3333` (atual) e `172.18.0.54:3333` (antigo).

## Verificação dos assets

Consultas diretas aos containers isolam o problema do build:

- Atual: HTML referencia `index-DdjVDKMN.js` e `index-ylLHOYls.css`. Ambos retornam 200 com tipos corretos. CSS contém `.zero-grau-storefront`, com 126.511 caracteres. HTML já usa `no-cache, max-age=0, must-revalidate`.
- Antigo: HTML referencia `index-IHaL_gLq.js` e `index-cLYpPL0b.css`. CSS tem 110.570 caracteres, sem `.zero-grau-storefront`. HTML usa `max-age=86400`.
- Domínio público alterna os dois HTMLs mesmo com query strings únicas e `Cache-Control: no-cache`. Requisições de assets podem cair no outro destino: atual responde 404 para assets antigos; antigo retorna HTML para assets novos ausentes.
- Ambos os backends respondem 200 a `/branding?slug=zero-grau`, com empresa `Zero Grau` e cor primária clara `#0A1EEF`. O backend atual está disponível para assumir sozinho o domínio da API.

## Correção proposta — requer autorização para executar

Parar somente os dois containers órfãos:

```sh
docker stop sim_delivery-frontend-1 sim_delivery-backend-1
```

Caddy deve retirar esses destinos automaticamente ao receber eventos Docker. Confirmar que frontend e API ficam com um upstream atual cada, depois executar o smoke check HTTP contra o domínio e repetir consultas com cache ignorado. A parada é reversível com `docker start` nos mesmos nomes.

Em futuras renomeações de serviços, configurar limpeza dos órfãos no fluxo de deploy do Komodo, equivalente a `docker compose up -d --remove-orphans`. Manter `latest` não remove containers de serviços que saíram da definição. Cache antigo do navegador pode exigir recarregamento forçado após a correção dos destinos.

Nenhum container, proxy, banco ou configuração remota foi alterado nesta investigação.
