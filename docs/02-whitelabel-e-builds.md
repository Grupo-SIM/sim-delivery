# 02 — Whitelabel e builds

Cada imagem atende uma empresa. O cadastro da empresa é a fonte dos valores públicos
de deploy; o build recebe `COMPANY_SLUG` e acesso ao banco por `DATABASE_URL`.
Não há consulta ao backend para descobrir a marca na primeira renderização.

## Configure no superAdmin

Em **Empresas**, edite nome e slug na linha e abra **Configuração de deploy** para
salvar URLs e email de provisionamento. URLs devem ser origens HTTP(S), sem caminho,
credenciais, query string ou fragmento (ex.: `https://api.delivery.empresa.com.br`).

| Cadastro | Configuração da imagem |
|---|---|
| `name` | Nome da marca/app e padrão de `OWNER_NAME`. |
| `slug` | `COMPANY_SLUG`, slug estático do frontend e padrão de `WAHA_SESSION`. |
| `apiUrl` | `API_URL`, padrão de `BETTER_AUTH_URL` e URL do cliente frontend. |
| `siteUrl` | `APP_URL`, padrão de `CORS_WHITELIST` e URL pública do frontend. |
| `ownerEmail` (opcional) | Padrão de `OWNER_EMAIL` e preenchimento inicial do modal Criar dono. |

`packageName`, logo, fontes, cores, rodapé e tracking continuam no branding da empresa.
O identificador do app usa `packageName`, com fallback `com.jbmidia.<slug>`.
O frontend não recebe o email de provisionamento, senhas ou credenciais do banco.

O novo campo `ownerEmail` exige aplicar a migração
`20261018020000_add_company_owner_email` antes de publicar a nova aplicação ou compilar
imagens que consultem esse campo. A aplicação da migração no ambiente de destino é
uma etapa operacional separada; editar o cadastro ou executar o build não a aplica.
O arquivo `rollback.sql` da mesma pasta desfaz a coluna após rollback da aplicação,
com perda dos emails de provisionamento salvos.

## Build local e Docker

No desenvolvimento, defina `COMPANY_SLUG` no ambiente do processo ou nos arquivos
locais do backend/frontend. `VITE_COMPANY_SLUG` continua aceito como fallback do frontend.
As URLs do cadastro prevalecem sobre os antigos fallbacks `VITE_API_URL`/`VITE_APP_URL`.

O Turborepo executa os scripts de injeção antes de build/dev. Eles consultam Prisma
por slug e falham se a empresa não existir. O backend gera branding de emails e
padrões de deploy antes de compilar; o frontend gera seu branding, slug, CSS, favicon
e ícones. URLs de backend e frontend precisam estar cadastradas para o build Docker.

Exemplo de builds locais, partindo da raiz do repositório e com `DATABASE_URL` já
exportada no shell:

```sh
docker buildx build --load --no-cache-filter build \
  --secret id=DATABASE_URL,env=DATABASE_URL \
  --build-arg COMPANY_SLUG=zero-grau \
  -f backend/Dockerfile -t jbmidia/sim-delivery_backend_zero-grau:latest .

docker buildx build --load --no-cache-filter build \
  --secret id=DATABASE_URL,env=DATABASE_URL \
  --build-arg COMPANY_SLUG=zero-grau \
  -f frontend/Dockerfile -t jbmidia/sim-delivery_frontend_zero-grau:latest .
```

O secret BuildKit fica disponível apenas durante o build. Arquivos `.env` locais
são excluídos do contexto Docker. Senhas, tokens e conexão de banco de runtime
continuam fora dos padrões gerados.

Os builds e as tarefas de injeção de marca não usam cache Turbo, pois alterações
no banco não aparecem no hash dos arquivos. No Docker, use `--no-cache-filter build`
após alterar o cadastro; secrets não invalidam cache de layers. Alternativamente,
passe um novo `--build-arg BRANDING_REVISION=<revisão>` em cada rebuild.

A configuração local do workflow CD passa uma revisão por execução e precisa
apenas de `VARIANTS`, uma empresa por linha, além do secret `DATABASE_URL`.
Por compatibilidade, se `VARIANTS` estiver ausente, a seleção ainda extrai
slugs das antigas linhas `slug@url` em `APP_URL`; essas URLs e a variável `API_URL`
não configuram mais as imagens. Nenhum build ou publicação é disparado pelo painel.

## Runtime e Compose

Na inicialização, o backend carrega os padrões compilados antes de configurar
autenticação, CORS e WhatsApp. Variáveis de runtime não vazias têm prioridade.
Sem override específico, `BETTER_AUTH_URL` acompanha `API_URL`, CORS usa a origem
de `APP_URL` e `WAHA_SESSION` acompanha `COMPANY_SLUG`.

Remova os valores duplicados do `.env` para usar os padrões do cadastro. Mantenha
`DATABASE_URL`, secrets de autenticação, email, storage, pagamentos e demais
integrações necessárias. Overrides de URLs no backend não alteram frontend estático
nem labels Caddy; esses também precisam refletir os domínios usados.

O botão **Baixar Docker Compose** gera `compose.<slug>.yaml` com nomes de imagens,
labels Caddy e redes externas `postgres`/`proxy`. O `.env` fica apenas no serviço
backend; o frontend é servido como arquivos estáticos. O download não cria redes,
executa Docker, publica imagens nem altera o proxy. As redes precisam existir no destino.

## Provisionamento do dono

Prefira **Criar dono** na listagem de empresas: com senha opcional ou link de
definição por email. O campo `ownerEmail` apenas preenche esse formulário e o
padrão de provisionamento inicial; salvar outro email não muda nenhum usuário.

Para provisionamento no primeiro boot, configure `OWNER_PASSWORD` como secret de
runtime. O backend só cria um usuário novo se a empresa ainda não tiver dono e o
email ainda não existir. Nunca promove ou move usuários existentes, nem substitui
um dono. Sem senha de runtime, não há provisionamento automático. Senhas não são
armazenadas no cadastro da empresa nem incluídas no build.

## Mudanças exigem novas imagens

URLs, slug, nome, email de provisionamento e branding são congelados na imagem.
Salvar no painel não altera containers existentes. Gere novas imagens para aplicar
os novos padrões e baixe um novo Compose se os domínios ou slug mudarem.
