# Painel de pedidos — SC-10

Primeira entrega: consulta dos pedidos de teste do checkout em **Administração → Pedidos**, ou `/admin?secao=pedidos`. Acesso exclusivo a administradores/desenvolvedores, com senha pessoal definida. As rotas deste painel só são registradas no desenvolvimento local, assim como o checkout simulado.

## Funcionalidades

- Busca pelo número completo ou trecho do identificador do pedido.
- Filtros por período de criação (horário de Brasília, datas inicial e final inclusivas), situação e forma de pagamento.
- Paginação de 20 pedidos, mais recentes primeiro; contadores e soma sobre todos os resultados filtrados.
- Lista sem endereço, identificadores de conta ou tokens; detalhe autenticado com itens, SKU/cor, quantidades, valores da compra e endereço.
- Pagamento separado de produção e envio. Totais simulados não representam faturamento.
- Histórico persistente de criação e aprovação simulada; repetição da confirmação não duplica o evento.
- Pedidos anteriores ao painel preservam a data de criação. Confirmações antigas aparecem com data não registrada.
- Alternar entre Produtos e Pedidos preserva o formulário de produto em edição.

## Critérios de aceite exploratório

- [ ] Criar compras fictícias como visitante e com conta, deixando uma pendente e confirmando outra.
- [ ] Entrar como administrador, abrir Pedidos e conferir os totais e itens.
- [ ] Combinar filtros, buscar um número, limpar filtros e testar ausência de resultados.
- [ ] Conferir paginação quando houver mais de 20 resultados.
- [ ] Abrir detalhes, retornar à lista e verificar preservação dos filtros.
- [ ] Conferir endereço, valores históricos e eventos após atualização do catálogo e da página.
- [ ] Repetir a aprovação simulada e verificar um único evento de confirmação.
- [ ] Testar teclado e celular; confirmar que o formulário de produto não perde alterações ao trocar de seção.
- [ ] Confirmar que visitante/cliente não acessam listagem nem detalhes administrativos.

## Validação e limites

Testes automatizados usam exclusivamente massa fictícia em banco isolado e verificam permissões, período, paginação, valores, histórico idempotente, escape de texto e restauração do backup com eventos. Validação visual interativa pendente por falta de navegador conectado.

SC-10 permanece em andamento. Cadastro de pedidos manuais de marketplaces (SC-09), filtros por outros canais, ordens de produção, rastreamento, prazos prometidos e identificação de atrasos ainda não estão implementados. Não inferir atraso sem prazo registrado. SC-39 continua bloqueando uso de dados reais; esta entrega não implementa criptografia de dados ou backups.
