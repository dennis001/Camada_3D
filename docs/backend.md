# Backend — primeiro marco

Atualização: 01/10/2026. SC-01 a SC-05 continuam **Em andamento**, aguardando aceite de Dennis e Talissa.

## Entrega

- Node.js 24+, Fastify 5 e PostgreSQL. Banco portátil disponível somente como ferramenta de desenvolvimento; a API também aceita PostgreSQL externo por `DATABASE_URL`.
- Contas individuais de Dennis e Talissa, ambas administradoras dos recursos implementados. Senhas com scrypt, sessões opacas no banco, cookie HttpOnly/SameSite, expiração de oito horas e limite de tentativas. Em produção o cookie exige HTTPS.
- Senhas temporárias aleatórias e troca obrigatória no primeiro acesso. Troca ou recuperação encerra todas as sessões do usuário.
- Produtos, cores/SKU, ficha de produção e origem/licença persistidos no banco. Catálogo público exclui ficha, custos, arquivos internos e evidências de licença.
- Histórico com responsável, data e revisão de produto. Edições simultâneas usam uma revisão global de catálogo: uma edição desatualizada retorna conflito, preservando os dados já salvos.
- Importação de produtos antigos do navegador ou de JSON, com validação no servidor. A importação mescla por ID; IDs existentes são atualizados e os demais permanecem. As alterações são atômicas.
- Migrações versionadas com checksum. Backup completo do banco e restauração em banco vazio testados, incluindo contas e histórico; sessões ativas não são restauradas.

## Iniciar neste computador

O ambiente e as duas contas já foram preparados. No PowerShell:

```powershell
npm.cmd run dev:full
```

Abra **http://127.0.0.1:3000/login**. A Administração fica na página `/admin`, acessível somente a contas com perfil `admin` ou `developer`; o link aparece na loja apenas após login desses perfis. A API também verifica a permissão em cada operação. Dennis e Talissa permanecem administradores. Não existe cadastro público nem alteração de perfil pelo navegador. A migração 002 exige novo login nas sessões anteriores.

A aplicação inicia PostgreSQL em `127.0.0.1:55432`, API na porta `3001` e frontend na `3000`. As portas são fixas para manter a origem do login consistente. Use sempre o endereço `127.0.0.1`; `localhost` é outra origem. Veja também [domínio e ambientes](ambientes.md).

Consulte `.local/acessos-*.txt` para as credenciais iniciais de `dennis` e `talissa`. Defina uma senha pessoal para cada conta no primeiro acesso e apague o arquivo de credenciais depois. Nenhuma senha foi registrada no Git, na documentação ou no Trello. Não envie esse arquivo para o repositório.

Use Ctrl+C para encerrar os serviços de forma coordenada. O banco permanece em `.local/postgres`, sem serviço instalado no Windows. Não apague essa pasta para reiniciar a aplicação.

Para preparar outro computador:

```powershell
npm.cmd ci
npm.cmd run setup:local
npm.cmd run dev:full
```

`setup:local` cria `.env` somente se ausente, inicializa o banco e cria apenas contas inexistentes. Não redefine senhas já escolhidas. O setup portátil recusa conexão externa para não modificar outro banco por engano. No Windows, utiliza o alias 8.3 da mesma pasta quando o caminho contém acentos, sem mover arquivos. Caso o sistema não ofereça esse alias, use uma pasta de desenvolvimento com caminho ASCII.

## Recuperar acesso

Com `dev:full` em execução, abra outro terminal:

```powershell
npm.cmd run admin:reset -- dennis
# Ou: npm.cmd run admin:reset -- talissa
```

O comando local cria uma senha temporária em um novo arquivo `.local/acessos-*.txt`, revoga as sessões do usuário e exige nova troca no login. Requer acesso ao computador e ao banco. Recuperação por e-mail não foi implementada; dependerá da definição de serviço de e-mail.

## Importar o trabalho anterior

Entre na administração, salve qualquer formulário em edição e use **Trazer cadastros da versão anterior → Importar cadastros deste navegador**. A cópia antiga não é apagada. Dados antigos de `localhost` precisam ser exportados naquela origem e importados como arquivo JSON em `127.0.0.1`.

**Exportar backup** no painel salva produtos/fichas/licenças, sem contas ou histórico. **Baixar rascunho atual** conserva uma edição ainda não salva para conferência e recuperação manual; dados incompletos ainda precisam passar pela validação antes da importação. Falhas de gravação não informam sucesso falso. A sessão é revalidada ao focar a janela e a cada minuto; perder a autenticação ou falhar nessa verificação remove o painel. Exporte rascunhos importantes antes de sair. Navegar para outra página com edição pendente aciona o aviso do navegador.

## Backup completo e restauração

Com o banco iniciado:

```powershell
npm.cmd run db:backup
```

O arquivo fica em `.local/backups/`. Contém dados privados e hashes das senhas: guarde uma cópia protegida fora do computador. O backup local não substitui a cópia externa. Não inclui os arquivos 3MF ou fotos apontados por URL, pois eles não são armazenados pela aplicação.

Para restaurar, prepare um **banco PostgreSQL vazio e separado**, configure `DATABASE_URL` para esse destino e execute:

```powershell
npm.cmd run db:restore -- caminho/do/backup.json
```

O comando aplica migrações e verifica compatibilidade antes de restaurar em transação. Se o banco já tiver usuários/produtos/histórico, recusa a operação. Nenhum dado existente é apagado. Após restauração, faça login novamente; sessões anteriores são descartadas. Para limpar a variável de ambiente de teste no PowerShell use `Remove-Item Env:DATABASE_URL` antes de voltar ao ambiente habitual.

O teste automatizado criou outro banco, restaurou o backup e comparou catálogo, contas e revisões. Também reiniciou o PostgreSQL e conferiu os dados persistidos.

## PostgreSQL externo / futuro servidor

Configure `.env` seguindo `.env.example`, com banco dedicado. Depois:

```powershell
npm.cmd run db:migrate
npm.cmd run admin:setup
npm.cmd run api:start
```

Em desenvolvimento, inicie também `npm.cmd run dev`. O proxy Vite aponta `/api` para `127.0.0.1:3001`; mantenha essa porta ou ajuste `vite.config.js` junto com a configuração da API. Não use `dev:full` com PostgreSQL externo.

Para publicação, ainda falta preparar proxy HTTPS com frontend e `/api` na mesma origem, definir `APP_ORIGIN` exatamente e `NODE_ENV=production`, restringir credenciais do banco, backup externo automático e rotina de restauração. O usuário do cluster portátil tem privilégios de administração do PostgreSQL para facilitar testes e não deve ser reutilizado como credencial da aplicação pública. DNS, Linux e exposição da rede permanecem em SC-37/38.

## Rotas

| Método e caminho | Acesso | Função |
| --- | --- | --- |
| GET `/api/health` | Público | Verifica conexão com banco, sem expor configuração |
| GET `/api/catalogo` | Público | Apenas produtos publicados e campos comerciais |
| POST `/api/auth/login` | Público, origem válida e limite de tentativas | Cria sessão por cookie |
| GET `/api/auth/me` | Sessão | Identidade e token de proteção das alterações |
| POST `/api/auth/logout` | Sessão + token CSRF | Revoga sessão |
| POST `/api/auth/password` | Sessão + token CSRF | Troca senha e revoga todas as sessões |
| GET `/api/admin/produtos` | Administrador com senha pessoal | Produtos completos e revisão global |
| PUT `/api/admin/produtos/:id` | Administrador + CSRF | Salva `{ produto, revision }` |
| POST `/api/admin/produtos/importar` | Administrador + CSRF | Mescla `{ produtos, revision }` |
| GET `/api/admin/historico` | Administrador | Últimos 100 eventos e responsáveis |

Alterações exigem cabeçalho `Origin` igual a `APP_ORIGIN`. Sessões usam token aleatório cujo hash fica no banco; senhas nunca são retornadas pela API. Não há cadastro público de administradores, CORS aberto ou segredo de autenticação no frontend. A proteção contra tentativas é local ao processo; múltiplas instâncias e alertas de abuso ficam para a evolução da hospedagem.

## Testes e aceite

```powershell
npm.cmd test
npm.cmd run build -- --outDir output/validacao-build
```

Os testes usam PostgreSQL real em diretório temporário `.local/test-db-*` e porta livre; não utilizam nem apagam o banco de trabalho. Cobrem login, CSRF, troca/reset, sessões expiradas, limites, origem externa, rascunhos/publicação, dados privados, SKU duplicado, importação atômica, concorrência, histórico, reinício e backup/restauração. A compilação foi validada. Não havia navegador conectado para teste visual nesta sessão.

Roteiro de aceite conjunto, ainda pendente:

1. Entrar como Dennis e trocar a senha temporária; repetir com Talissa em outro perfil de navegador.
2. Cadastrar rascunho com nome/categoria; conferir o mesmo produto na outra conta.
3. Completar cores, ficha e licença; confirmar que valores ausentes não geram custo zero fictício.
4. Publicar após conferir dados/fotos/permissão; ver o catálogo sem dados privados.
5. Editar nas duas contas sem recarregar: a segunda gravação deve informar conflito.
6. Sair, confirmar bloqueio de acesso administrativo e testar recuperação local de uma conta.
7. Encerrar e reiniciar `dev:full`; conferir os produtos. Exportar/importar backup e conferir o histórico.
8. Conferir no celular após preparar acesso de rede seguro; o ambiente atual está limitado ao próprio computador.

## Limites desta etapa

Ainda não existem movimentação de filamentos, alocação operacional por canal, reservas, pedidos, OS, pagamentos, frete, armazenamento de fotos/3MF nem recuperação por e-mail. O estoque no cadastro é quantidade manual por cor e não substitui SC-06/07. Revisões preservam fichas alteradas, mas vínculos históricos com OS dependem da implementação de ordens. O carrinho continua local e não gera cobrança. O servidor de produção ainda não foi montado.
