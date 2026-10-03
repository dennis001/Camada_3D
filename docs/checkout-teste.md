# Carrinho e compra de teste

O carrinho fica em `/carrinho`, com itens, cores, quantidades e subtotal. A vitrine e o carrinho não exibem estimativas de impressão. O checkout fica em `/checkout`.

## Roteiro exploratório

- [ ] Adicionar a saboneteira e abrir o carrinho pelo ícone ou pelo link após inclusão.
- [ ] Alterar quantidades, remover e voltar ao catálogo, conferindo persistência e contador.
- [ ] Continuar compra sem login: o formulário deve abrir diretamente. Testar também o login opcional.
- [ ] Digitar 01001-000 e conferir rua, bairro, cidade e UF via ViaCEP; completar nome e número fictícios. Complemento é opcional.
- [ ] Testar CEP inexistente, serviço indisponível e CEP sem rua/bairro: permitir preenchimento manual.
- [ ] Trocar rapidamente o CEP: resposta antiga não deve sobrescrever o endereço novo.
- [ ] Selecionar entrega simulada, Pix ou crédito e revisar itens, endereço e total.
- [ ] Voltar às etapas anteriores e conferir preservação dos campos.
- [ ] Criar pedido de teste; conferir o total registrado pelo servidor antes de confirmar.
- [ ] Simular pagamento aprovado e conferir limpeza do carrinho e confirmação.
- [ ] Recarregar a URL do pedido e conferir persistência; outra conta ou outro navegador sem o cookie do visitante não pode acessá-lo.
- [ ] Repetir com a outra forma de pagamento, também no celular.

## Limites desta entrega

Checkout simulado disponível apenas com ambiente development, NODE_ENV diferente de production e origem local (localhost/loopback). Em produção, as rotas de criar/consultar/confirmar pedidos de teste não são registradas. Não há cobrança, QR Code, coleta de cartão ou reserva da impressora. A modalidade de entrega é explicitamente fictícia, com valor zero para exercitar o fluxo; isso não é cotação de frete grátis.

Os pedidos ficam separados na tabela `test_orders`, vinculados à conta autenticada ou a uma sessão de visitante, sem criar cadastro. Preços vêm do catálogo no servidor, com validação de itens e quantidades; o servidor rejeita preço/total enviados pelo navegador. CSRF e origem são verificados. Repetir a mesma solicitação de criação retorna o mesmo pedido; repetir a confirmação é idempotente. Backup inclui esses registros.

Ainda faltam provedor de frete, gateway, confirmação por webhook, falha/recusa/expiração, parcelamento e fila real. O login é opcional. Dados de contato para notificações e recuperação de pedidos de visitantes ainda serão definidos antes de vendas reais. Endereço não é persistido no navegador antes de criar o pedido: atualizar a página durante o preenchimento reinicia essa etapa.

Status: em andamento, aguardando aceite exploratório. Testes integrados verificam cliente comum, isolamento entre contas, CSRF, preços, repetição de solicitação, confirmação, bloqueio em produção e restauração do backup. Validação visual interativa depende de navegador conectado.

## Consulta de CEP e visitante

A rota pública GET /api/cep/:cep consulta https://viacep.com.br/ws/{cep}/json/, valida oito dígitos, limita chamadas e usa timeout de 5 segundos. Segue a [documentação oficial do ViaCEP](https://viacep.com.br/). Rua, bairro, cidade e UF são preenchidos e continuam editáveis. O complemento retornado pelo serviço não substitui o complemento da residência. Nenhum contrato ou credencial dos Correios é utilizado. ViaCEP consulta endereço, não frete.

O visitante recebe cookie HttpOnly/SameSite e CSRF, com validade de sete dias. O identificador do pedido sozinho não autoriza leitura/confirmação. Sessões de visitante não entram no backup e não são restauradas; pedidos são preservados, mas a recuperação sem cookie e a associação posterior a uma conta ainda não estão implementadas. Nenhum endereço é enviado ao ViaCEP: a consulta compartilha somente o CEP.
