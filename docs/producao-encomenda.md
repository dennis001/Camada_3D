# Produção sob encomenda

Decisão de 02/10/2026: o catálogo vende por encomenda, sem limitar quantidades pelo estoque de peças prontas. Valores antigos de estoque ficam preservados nos dados, mas não controlam o catálogo ou o carrinho. A administração deixa de solicitar esse campo.

Na ficha do produto, o administrador informa **tempo da placa em minutos** e **unidades por placa**. Esses valores são independentes dos custos opcionais. A ficha da saboneteira ainda precisa desses dois dados reais.

## Cálculo inicial

Para cada produto/cor: `placas = teto(quantidade / unidadesPorPlaca)` e `minutos = placas × tempoPlacaMinutos`. O carrinho soma as durações, considerando uma impressora e placas separadas por produto e cor. Uma placa parcial usa o tempo de uma placa inteira nesta estimativa.

Exemplo ilustrativo: capacidade de 4 peças e duração de 110 minutos. De 1 a 4 peças: 110 minutos; 5 peças: 220 minutos. Isso não representa uma medição da saboneteira. Estudos de aproveitamento e mistura de peças poderão aprimorar o cálculo posteriormente.

Sem dados válidos de algum item, o total fica **A calcular**. A estimativa é atualizada ao adicionar, alterar ou remover itens; adicionar ao carrinho não cria pedido nem reserva capacidade.

## Postagem e entrega

Horas de impressão ainda não são uma data de postagem. Para calculá-la, faltam jornada disponível da impressora, calendário de trabalho, acabamento/embalagem e fila de pedidos confirmados. Transporte também depende do destino e da modalidade de frete. Até essa integração, o site informa que postagem e entrega estão a definir.

## Critérios de aceite exploratório

- [ ] Adicionar uma cor com estoque antigo zero e quantidades superiores ao estoque antigo.
- [ ] Editar tempo e capacidade na administração e conferir o cálculo na vitrine, no popup e no carrinho após atualizar o catálogo.
- [ ] Confirmar o arredondamento por placa, incluindo o limite entre uma e duas placas.
- [ ] Somar cores separadamente e recalcular ao diminuir ou remover itens.
- [ ] Exibir A calcular quando faltar tempo ou capacidade, sem prometer data de entrega.
- [ ] Manter a administração restrita a administradores/desenvolvedores.

Testes automatizados cobrem lotes, alterações de quantidade, ausência de dados e limites numéricos. A história continua em andamento até validação exploratória; fila, frete e checkout continuam pendentes.
