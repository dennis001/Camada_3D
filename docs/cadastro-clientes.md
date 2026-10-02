# Cadastro de clientes — SC-25

Implementado em 02/10/2026; aceite exploratório pendente.

Em `/login`, a opção **Novo por aqui? Criar conta** abre o formulário com nome, e-mail, senha e confirmação. Após salvar, o cliente entra com e-mail e senha e volta à loja. O catálogo continua acessível sem login. O cadastro não habilita checkout: pedidos, cobrança e pagamento continuam pendentes.

O endpoint `POST /api/auth/register` aceita somente `name`, `email` e `password`. Exige a origem configurada, limita tentativas e cria exclusivamente o perfil `customer`. O servidor normaliza o e-mail, impede duplicidade, armazena hash da senha e registra a criação no histórico. A tabela de identidades continua denominada `admins` por compatibilidade; clientes não recebem permissões administrativas. Sessões, backup e restauração incluem as contas comuns. Contas existentes de Dennis/Talissa continuam usando seus usuários habituais.

## Roteiro exploratório

- [ ] Abrir `/login` sem sessão e alternar entre entrar e criar conta.
- [ ] Conferir nome/e-mail obrigatórios, senha de 8 a 128 caracteres com maiúscula, minúscula e caractere especial e confirmação igual.
- [ ] Cadastrar e entrar; conferir retorno à loja e ausência de Administração no menu.
- [ ] Abrir `/admin` como cliente e conferir acesso restrito. A API também deve negar acesso.
- [ ] Sair, entrar novamente e tentar cadastrar o mesmo e-mail com outras letras maiúsculas.
- [ ] Entrar como administrador e conferir acesso aos cadastros de produtos.
- [ ] Conferir campos e mensagens no celular.

Use dados fictícios nos testes locais. Confirmação de e-mail, recuperação automática por e-mail e associação de pedidos anteriores ainda não foram implementadas; não considerar o e-mail informado como propriedade verificada. A recuperação local existente atende apenas Dennis/Talissa. Não há armazenamento de CPF, endereço ou dados de cartão nesta etapa.

Build: `npm.cmd run build`. Para explorar o build com banco e API, execute `npm.cmd run preview:full` e abra a prévia local em `http://127.0.0.1:3000/login`. Encerre `dev:full` antes, pois utilizam as mesmas portas e banco. `preview:full` é exclusivo dos testes locais, não serve como hospedagem pública. Abrir `dist/index.html` diretamente não executa o backend. O endereço oficial permanece `https://studiocamadas.com.br/login`, aguardando a publicação no servidor.
