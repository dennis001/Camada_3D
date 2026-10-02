# Desenvolvimento enquanto o servidor não chega

> Atualização 01/10/2026: SC-01/02 avançaram para API, PostgreSQL local e autenticação; SC-03/04/05 agora persistem no banco. Veja [backend.md](backend.md). Todos seguem Em andamento, aguardando aceite. O planejamento abaixo registra a etapa anterior.

Atualização de 22/09/2026. Quadro: https://trello.com/b/IC3YVn5d/camada-3d

As histórias continuam **Em andamento**, sem aceite ou conclusão. Esta entrega prepara um primeiro conjunto pequeno de funcionalidades locais. Não representa R1/R2 completos nem autorização para iniciar vendas pelo site.

## Primeiro conjunto implementado

| Card | Entrega local | Ainda falta para o aceite completo |
| --- | --- | --- |
| [SC-01](https://trello.com/c/HQ8DYAeB) | Contrato de produto, valores em centavos, backup versionado, desenho de persistência futura em `arquitetura-local.md` | Escolher stack do backend; banco, migrações, transações, autenticação, backup de servidor e restauração |
| [SC-03](https://trello.com/c/4IS7PAyf) | Cadastro e edição de rascunhos, categoria estável, cores/SKU únicos, preço comum, medidas, URLs de fotos e prévia | Banco, contas individuais, vínculo com estoque real de filamentos e fotos comerciais conferidas |
| [SC-04](https://trello.com/c/qCZK7OQU) | Ficha por placa, múltiplos filamentos, minutos, unidades, perfil e referência 3MF; entradas ausentes ficam pendentes | Ficha por variante quando necessário, histórico congelado de OS e conferência do Bambu Studio |
| [SC-05](https://trello.com/c/dOdHuxfO) | Plataforma/link, autor, licença, evidência e três estados de uso comercial; publicação exige comprovação registrada | Conferir efetivamente as permissões de cada modelo; persistência autenticada |
| [SC-15](https://trello.com/c/ynCsxEyc) | Custos diretos estimados por unidade, margem sobre preço e resultado por hora | Resultado por venda/canal, taxas, frete, descontos, tributos, histórico, perdas e realizado |
| [SC-17](https://trello.com/c/OdKTRtsd) | Detalhes, cores/estoque de ensaio, busca sem acentos, categoria e preço numérico; imagens alternativas | Backend, disponibilidade efetiva, encomendas, fotografias e contatos oficiais |
| [SC-18](https://trello.com/c/5q3BF9Gp) | Adicionar por cor, quantidade, remover, contador/subtotal reais e persistência no navegador | Revalidação no servidor, capacidade de produção, checkout, reservas e promessa de envio conjunto |

Os oito bugs existentes entram no trabalho de catálogo/carrinho/navegação. O bug das estrelas perde sua manifestação com a retirada das avaliações fictícias; não foi criado um sistema de avaliações nem validada uma escala fracionária. O aceite desse card deve ser revisto conforme SC-17. Os números antigos de oito produtos de exemplo também deixam de ser dados comerciais de aceite: usar a massa de teste isolada descrita no roteiro.

## Revisão de todas as histórias do quadro

O equipamento do servidor é necessário para instalar e validar a hospedagem. O desenvolvimento de regras, telas e backend pode continuar no computador atual; outras pendências abaixo são de produto, dados ou serviços, e não dependem exclusivamente de hardware.

| Histórias | O que pode ser adiantado | Sequência/pendência |
| --- | --- | --- |
| SC-01 | Modelo de dados e contratos; depois backend e banco locais | Desenho iniciado. Decisão de stack ainda aberta, sem serviço contratado |
| SC-02 | Fluxo de acesso e implementação local de autenticação | Após backend; não simular autorização com botão ou senha no frontend |
| SC-03–05 | Cadastro, ficha e origem dos modelos | Primeiro conjunto em andamento |
| SC-06–07 | Entrada/movimentação de filamentos e alocação por canal | Próximo conjunto sugerido; histórico, reservas e integridade transacional |
| SC-08 | Regras de encomenda, prazo e suspensão por material | Após estoques; definir limites/dias reais e compromissos de material |
| SC-09–10 | Cadastro manual de pedidos e painel | Após produtos/estoque; unicidade canal+número, situações separadas |
| SC-11–13 | OS, etapas de produção, consumo e reimpressões | Após pedidos pagos e estoques; idempotência e histórico por tentativa |
| SC-14 | Alertas no painel | Após filamentos/compromissos; canal externo de aviso pendente |
| SC-15 | Estimativa por produto agora; resultado por pedido depois | Estimativa direta implementada, demais bases ainda pendentes |
| SC-16 | Preço padrão já preparado no cadastro; configuração por canal depois | Política de preços diferentes ainda precisa de definição |
| SC-17–18 | Catálogo e carrinho com estado local | Primeiro conjunto em andamento; sem aceitar pedidos |
| SC-19 | Formulários e validações de checkout | Após regras de disponibilidade; persistência segura e dados de cliente exigem backend |
| SC-20 | Contrato de cotação e cenários locais | Definir serviço, endereço de origem, peso/medidas das embalagens; testar cotação real depois |
| SC-21–22 | Adaptadores e testes em ambiente de testes do provedor | Escolher provedor e regras de parcelamento; credenciais e webhooks sem exposição no frontend |
| SC-23 | Reservas, expiração e concorrência em banco local | Após estoques/pedidos; exige transações, não apenas localStorage |
| SC-24–25 | Fluxos de acompanhamento e conta opcional | Backend, tokens seguros, serviço de e-mail e política de acesso |
| SC-26 | Regras de pedido misto e envio conjunto | Após encomendas/checkout/cotação; promessa congelada no pedido |
| SC-27–28 | Registro de envio e roteiro operacional | Após pedidos; conferir serviços/documentação antes de postagem real |
| SC-29 | Importação histórica com identificação por canal | Após modelo de pedido; proteger contra duplicações e manter origem manual |
| SC-30–32 | Contratos e simulações de integração dos marketplaces | Acesso às APIs, regras e credenciais; priorizar operação manual antes |
| SC-33 | Matriz de permissões e testes de autorização | Após login; ambos administradores completos primeiro |
| SC-34 | Cenários de prazo pela fila | Após produção e capacidade real; prazo fixo primeiro |
| SC-35 | Levantamento do modelo de impressora e interface disponível | Integração real exige equipamento/rede; permanece estudo futuro |
| SC-36 | Contrato de emissão e rastreio | Escolher serviço; operação manual primeiro, sem compra automática de etiquetas |
| SC-37–38 | Checklist de instalação/migração e pontos a levantar | Execução adiada até notebook/rede disponíveis: Linux, DNS, HTTPS, backup externo e acesso público |

## Próximo conjunto sugerido

1. Validar este primeiro conjunto com Dennis e Talissa usando produtos e dados de produção conferidos.
2. Definir backend e banco locais; implementar SC-02 e persistência autenticada dos cadastros.
3. Trabalhar SC-06/07, depois SC-08/09/10 e produção. Limites por cor, estoque reservado e consumo comprometido precisam ser consistentes antes de vender.
4. Preparar checkout e integrações de pagamento/frete em ambiente de testes; publicar somente depois do fluxo completo validado.
5. Com o servidor disponível, retomar SC-37/38 sem alterar DNS antes de conferir os registros existentes.

Nenhuma história que permanece no Backlog foi apresentada como iniciada. Nenhum card foi marcado como concluído. Para validar a entrega atual, seguir `roteiro-validacao.md`.
