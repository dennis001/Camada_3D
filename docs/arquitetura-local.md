# Base local e evolução para o servidor — SC-01

> Atualização 01/10/2026: o backend PostgreSQL e a autenticação foram implementados. Consulte [backend.md](backend.md) para o estado atual. O restante deste documento preserva o desenho inicial da etapa somente local, que foi substituída no fluxo principal.

Estado: proposta inicial em desenvolvimento, 22/09/2026. Não há backend ou banco implementado nesta entrega e não foi escolhido fornecedor ou contratado serviço.

## O que roda agora

React/Vite mantém cadastro versionado no navegador usado durante `npm run dev`. O painel aparece somente com `import.meta.env.DEV`; o build de produção remove sua importação. O servidor Vite fica vinculado a `127.0.0.1`. Não expor o ambiente de desenvolvimento na rede como administração de produção.

`src/lib/produtos.js` concentra criação, validação e custos. `src/lib/persistencia.js` fornece leitura/escrita e backup. `src/lib/carrinho.js` contém quantidade e disponibilidade de ensaio. Não há bibliotecas, infraestrutura ou serviços novos.

Produto: ID estável, categoria por ID, preço inteiro em centavos e cores com ID/SKU/nome/estoque de ensaio. Ficha registra tempo/consumo por placa, unidades por placa, filamentos por material/cor e custos. A referência 3MF é texto: o arquivo não é transferido. Origem registra plataforma/link/autor/licença/estado/evidência. Dados ausentes são `null` ou texto vazio; zero significa custo explicitamente informado.

Fotos/medidas/licenças são declarações do cadastro: o software não verifica materialmente uma fotografia ou autorização. Rascunhos podem ficar incompletos; publicação na prévia exige dados comerciais e permissão registrada. Campos privados são removidos por uma projeção explícita antes de renderizar o catálogo; o build público só usa `src/data/produtos.js`, inicialmente vazio. Ocultar a interface não substitui autenticação de servidor.

## Persistência e recuperação

Chave do cadastro: `studio-camadas:produtos:v1`. Backup JSON contém `aplicativo: studio-camadas`, `versao: 1`, `exportadoEm` e `produtos`. Valor monetário não é convertido em string formatada no backup. Máximo de 5 MB; usar URLs para fotos.

Importação valida todo o arquivo antes de escrever, atualiza IDs existentes e preserva demais produtos. IDs/SKUs duplicados e arquivos inválidos são rejeitados. Um cadastro corrompido não é apagado automaticamente; exportar seu conteúdo para recuperação e importar backup válido. Falha de armazenamento não informa sucesso. Mudanças de outra aba são detectadas comparando a última versão lida; recarregar antes de continuar. Essa checagem é proteção local de melhor esforço, não uma transação distribuída.

O carrinho possui chaves separadas para prévia e versão pública; conserva apenas produto/cor/quantidade e recalcula preço/disponibilidade. Não reserva estoque ou material, não gera pedido e não aceita pagamento. Mudanças em outra aba não têm sincronização em tempo real. Não cadastrar clientes, senhas ou credenciais nesse protótipo.

## Cálculo atual

- Filamento por unidade = soma de `(gramas na placa / 1000 × preço do kg)` dividida pelas unidades na placa.
- Energia por unidade = `(potência média em W / 1000 × horas da placa × custo do kWh)` dividida pelas unidades na placa.
- Custo direto = filamento + energia + embalagem por unidade + outros custos por unidade.
- Resultado estimado = preço de venda − custo direto.
- Margem = resultado / preço × 100. Tempo por unidade = minutos da placa / unidades.
- Resultado por hora de máquina = resultado / tempo por unidade × 60.

Os componentes de custo são arredondados para centavos após o rateio; o total soma esses componentes. O resultado é uma estimativa antes de taxas de canal/pagamento, descontos, frete, tributos e despesas fixas não registradas. Não é resultado realizado de venda. Alterações de ficha ainda não têm histórico de ordens porque não existem ordens neste conjunto.

## Contratos propostos para a próxima etapa

| Recurso | Contrato esperado | Integridade a implementar no backend |
| --- | --- | --- |
| Usuário/sessão | Contas individuais Dennis/Talissa; operações autenticadas, saída e recuperação | Hash de senha, sessões seguras, autorização em cada operação, auditoria |
| Produto/variante/ficha/origem | Produto estável, revisões de ficha e publicação; projeção pública separada | SKU único, valores em centavos, revisão otimista, arquivos privados |
| Filamento/movimentação | Rolo, material/cor, peso, custo; entradas e ajustes identificados | Livro de movimentos, saldo não negativo, motivos e responsáveis |
| Estoque/alocação/reserva | SKU, canal, físico/alocado/reservado | Soma alocada ≤ físico; reservas dentro da alocação, transferências sem itens reservados |
| Pedido/itens | Canal+número externo, valores e prazo congelados | Unicidade por canal, itens imutáveis historicamente, sem duplicação de importação |
| Pagamento/reserva | Estado separado, eventos do provedor e expiração | Verificar origem do evento, idempotência, pagamento tardio e liberação atômica |
| OS/tentativa/consumo | Demanda do item, ficha congelada, etapas e tentativas | OS só após pagamento; consumo uma vez por tentativa; falhas mantêm histórico |
| Envio | Pacote, frete cobrado/custo, etiqueta, postagem/rastreio | Envio conjunto só com todos prontos; conferência e registro de responsável |

Proposta de API a detalhar após decisão de stack: catálogo público de somente leitura; produtos/fichas/movimentações/pedidos autenticados; endpoints separados para criar reserva, confirmar eventos de pagamento e registrar tentativas. O browser envia IDs e quantidade; o servidor recalcula preços e disponibilidade. Não confiar em custos, estoque ou preço enviados pelo frontend.

As ações de pedido/reserva/pagamento/consumo precisarão de transação no banco, chaves únicas e repetição segura. Valores históricos de itens/OS serão snapshots da revisão vigente, não links que mudam retroativamente. Migrações versionadas devem existir desde a primeira base persistente.

Antes de hospedar: escolher stack conforme notebook disponível, separar ambientes, manter segredos fora do Git, definir backup externo/retenção e executar restauração em ambiente de teste. SC-37/38 dependem de conferir hardware, Linux, upload/CGNAT, DNS e forma de acesso externo; nada disso foi presumido como configurado.
