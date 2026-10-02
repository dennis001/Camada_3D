# Domínio e ambientes

Preparação em 01/10/2026. Nenhum DNS foi alterado e nenhum ambiente foi publicado.

| Ambiente | Endereço proposto | Dados |
| --- | --- | --- |
| Local | http://127.0.0.1:3000 | PostgreSQL portátil deste computador |
| Desenvolvimento / validação | https://dev.studiocamadas.com.br | Banco e credenciais exclusivos de teste |
| Produção | https://studiocamadas.com.br | Banco e credenciais exclusivos da operação |

`www.studiocamadas.com.br` redireciona para o domínio principal. Cada site serve o frontend e `/api` na mesma origem. Login em `/login`, painel em `/admin`; o acesso direto ao painel também exige autenticação e perfil `admin` ou `developer`. Ambos os perfis administram os recursos disponíveis nesta etapa.

O login oficial é `https://studiocamadas.com.br/login`; a validação publicada usa `https://dev.studiocamadas.com.br/login`. O endereço `127.0.0.1` atende apenas à prévia local. Os links da aplicação são relativos à origem, portanto cada ambiente permanece no próprio domínio. Alterar apenas um link não publica o site: é necessário executar a configuração de hospedagem abaixo.

## Revisão de código

Todo desenvolvimento e push devem ocorrer em branch própria. O usuário revisa e aprova o merge; não fazer push ou merge na `main`. Enviar código ao Git não equivale a publicar o site no domínio.

## O que falta para usar o domínio

1. Identificar onde o DNS autoritativo é administrado e ter acesso ao painel. Preservar registros existentes de e-mail (MX/TXT) e outros serviços.
2. Definir a máquina de hospedagem e seu acesso externo. No servidor caseiro, verificar IP público e CGNAT antes de escolher acesso direto ou túnel. Até os equipamentos chegarem, o desenvolvimento continua local.
3. Configurar registros A/AAAA ou CNAME conforme o destino efetivamente escolhido para o domínio, `www` e `dev`. Não há endereço de destino definido neste projeto.
4. Instalar o proxy HTTPS, publicar builds separados e iniciar dois processos da API com bancos distintos. Não expor PostgreSQL nem portas internas da API na internet.
5. Testar certificados, DNS, autenticação, backup e restauração antes de divulgar o site.

## Configuração preparada

Os modelos `deploy/production.env.example` e `deploy/development.env.example` usam processos nas portas 3001 e 3002 e usuários/bancos PostgreSQL diferentes. Podem ficar na mesma máquina inicialmente, em diretórios separados. Cada usuário do banco deve ter permissão somente sobre seu próprio banco. Não usar o superusuário do PostgreSQL portátil na hospedagem.

Copie cada modelo para um arquivo privado fora do Git, substitua as credenciais e carregue-o com `ENV_FILE`. Essa variável aceita caminho absoluto. Variáveis já presentes no processo têm precedência sobre o arquivo: não reutilize um terminal com `DATABASE_URL` de outro ambiente. Execute migrações, criação inicial de contas e API com o mesmo arquivo selecionado:

```powershell
$env:ENV_FILE = 'C:\config-privada\studio-development.env'
npm.cmd run db:migrate
npm.cmd run admin:setup
npm.cmd run api:start
```

Na hospedagem, ambos usam `NODE_ENV=production`; `APP_ENV` distingue `development` de `production`. `APP_ORIGIN` deve ser o endereço HTTPS exato, sem barra final. Sessões têm nomes de cookie e identificação no banco por ambiente/origem; não são compartilhadas entre os sites. Cookies HTTPS usam prefixo `__Host-`, sem atributo Domain.

`deploy/Caddyfile.example` prepara HTTPS, redirecionamento de `www`, `/api` e fallback das páginas React. Ajuste os diretórios aos builds reais. O site dev exige uma senha adicional no proxy (`DEV_USER` e `DEV_PASSWORD_HASH`, gerado por `caddy hash-password`) e recebe `X-Robots-Tag: noindex, nofollow`. Não indexar não substitui controle de acesso. O modelo ainda precisa de `caddy validate` e teste no servidor; não foi executado aqui.

Referências: [padrões oficiais do Caddy](https://caddyserver.com/docs/caddyfile/patterns) e [atributos de cookies na MDN](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Set-Cookie).

## Publicação e aceite pendentes

Validar primeiro no ambiente dev com dados fictícios. Publicar em produção a mesma revisão do código aprovada, gerando o build com `npm.cmd ci` e `npm.cmd run build`. Fazer backup protegido do banco de produção antes de migrar. Manter a versão anterior do frontend/API e testar o plano de recuperação; reverter código não reverte automaticamente migrações de banco. Nunca copiar o banco de testes por cima da produção.

- [ ] Visitante não vê Administração; `/admin` solicita login.
- [ ] Admin e developer veem o link após login; outras contas recebem acesso restrito inclusive na API.
- [ ] Primeiro acesso exige troca de senha; saída encerra o acesso.
- [ ] Cadastrar/editar produtos, preços e custos funciona na página separada, inclusive no celular.
- [ ] Uma sessão do dev não autentica na produção; alterações de teste não aparecem no catálogo real.
- [ ] Dev exige proteção adicional e não é indexável; HTTPS e redirecionamentos funcionam.
- [ ] Backup externo e restauração são conferidos no servidor.

Os testes automatizados cobrem permissões, ausência do menu público e isolamento de sessões. Aceite visual, implantação e testes dos dois domínios permanecem pendentes; os cards não devem ser concluídos ainda.
