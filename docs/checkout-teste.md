# Carrinho e compra de teste

O carrinho fica em `/carrinho`, com itens, cores, quantidades e subtotal. A vitrine e o carrinho não exibem estimativas de impressão. O checkout fica em `/checkout`.

## Roteiro exploratório

- [ ] Adicionar a saboneteira e abrir o carrinho pelo ícone ou pelo link após inclusão.
- [ ] Alterar quantidades, remover e voltar ao catálogo, conferindo persistência e contador.
- [ ] Continuar compra, entrar ou cadastrar uma conta de cliente e retornar ao checkout após login.
- [ ] Informar endereço fictício; conferir mensagens para campos vazios, CEP e UF inválidos.
- [ ] Selecionar entrega simulada, Pix ou crédito e revisar itens, endereço e total.
- [ ] Voltar às etapas anteriores e conferir preservação dos campos.
- [ ] Criar pedido de teste; conferir o total registrado pelo servidor antes de confirmar.
- [ ] Simular pagamento aprovado e conferir limpeza do carrinho e confirmação.
- [ ] Recarregar a URL do pedido e conferir persistência; outra conta não pode acessá-lo.
- [ ] Repetir com a outra forma de pagamento, também no celular.

## Limites desta entrega

Checkout simulado disponível apenas com ambiente development, NODE_ENV diferente de production e origem local (localhost/loopback). Em produção, as rotas de criar/consultar/confirmar pedidos de teste não são registradas. Não há cobrança, QR Code, coleta de cartão ou reserva da impressora. A modalidade de entrega é explicitamente fictícia, com valor zero para exercitar o fluxo; isso não é cotação de frete grátis.

Os pedidos ficam separados na tabela `test_orders`, vinculados à conta autenticada. Preços vêm do catálogo no servidor, com validação de itens e quantidades; o servidor rejeita preço/total enviados pelo navegador. CSRF e origem são verificados. Repetir a mesma solicitação de criação retorna o mesmo pedido; repetir a confirmação é idempotente. Backup inclui esses registros.

Ainda faltam provedor de frete, gateway, confirmação por webhook, falha/recusa/expiração, parcelamento e fila real. A simulação usa login; a história de checkout sem cadastro continua pendente. Endereço não é persistido no navegador antes de criar o pedido: atualizar a página durante o preenchimento reinicia essa etapa.

Status: em andamento, aguardando aceite exploratório. Testes integrados verificam cliente comum, isolamento entre contas, CSRF, preços, repetição de solicitação, confirmação, bloqueio em produção e restauração do backup. Validação visual interativa depende de navegador conectado.
