# Studio Camadas / Camada 3D

Catálogo e gestão de produtos impressos em 3D. React/Vite no frontend; Node.js/Fastify e PostgreSQL no backend.

Requer Node.js 24 ou superior. No PowerShell, use `npm.cmd` caso a política de execução bloqueie `npm`.

```powershell
npm.cmd ci
npm.cmd run setup:local
npm.cmd run dev:full
```

Abra http://127.0.0.1:3000/login. Após autenticação, administradores e desenvolvedores acessam `/admin`; o catálogo público fica em `/`. O setup cria as contas individuais `dennis` e `talissa`; credenciais temporárias ficam em `.local/acessos-*.txt`, fora do Git, com troca obrigatória no primeiro acesso. O banco fica em `.local/postgres`. Se o ambiente já estiver preparado, basta `npm.cmd run dev:full`.

- [Como usar, recuperar acesso e fazer backup](docs/backend.md)
- [Domínio e ambientes de desenvolvimento e produção](docs/ambientes.md)
- [Planejamento por história e dependências do servidor](docs/plano-sem-servidor.md)

```powershell
npm.cmd test
npm.cmd run build -- --outDir output/validacao-build
```

As histórias continuam em andamento para validação conjunta. Estoque operacional, pedidos, pagamentos e publicação no servidor serão desenvolvidos nas próximas etapas.
