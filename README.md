# Studio Camadas / Camada 3D

Catálogo e gestão de produtos impressos em 3D. React/Vite no frontend; Node.js/Fastify e PostgreSQL no backend.

Endereço oficial de login: **https://studiocamadas.com.br/login**. Administração: **https://studiocamadas.com.br/admin**. O ambiente de validação usará **https://dev.studiocamadas.com.br/login**, com banco e sessões separados. A publicação desses ambientes ainda depende de hospedagem, DNS e HTTPS; os endereços não foram ativados por esta entrega.

## Executar uma prévia local

Requer Node.js 24 ou superior. No PowerShell, use `npm.cmd` caso a política de execução bloqueie `npm`.

```powershell
npm.cmd ci
npm.cmd run setup:local
npm.cmd run dev:full
```

Somente para testes neste computador, abra http://127.0.0.1:3000/login. Esse endereço não é o login oficial da loja. A navegação usa `/login` e `/admin` na origem em que o site está hospedado, sem direcionar visitantes do domínio para o computador local. Após autenticação, administradores e desenvolvedores acessam `/admin`; o catálogo público fica em `/`. O setup cria as contas individuais `dennis` e `talissa`; credenciais temporárias ficam em `.local/acessos-*.txt`, fora do Git, com troca obrigatória no primeiro acesso. O banco fica em `.local/postgres`. Se o ambiente já estiver preparado, basta `npm.cmd run dev:full`.

- [Como usar, recuperar acesso e fazer backup](docs/backend.md)
- [Domínio e ambientes de desenvolvimento e produção](docs/ambientes.md)
- [Produção sob encomenda e estimativa por lotes](docs/producao-encomenda.md)
- [Cadastro de clientes e roteiro de testes exploratórios](docs/cadastro-clientes.md)
- [Planejamento por história e dependências do servidor](docs/plano-sem-servidor.md)

```powershell
npm.cmd test
npm.cmd run build -- --outDir output/validacao-build
```

As histórias continuam em andamento para validação conjunta. A loja opera sob encomenda, com estimativa de impressão por lotes. Fila de produção, prazo de postagem, frete, pedidos, pagamentos e publicação no servidor serão desenvolvidos nas próximas etapas.
