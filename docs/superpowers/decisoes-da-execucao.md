# Registro de decisões — construção do mural público

Data: 7 de setembro de 2026

Este arquivo é o diário de bordo da execução do plano
`docs/superpowers/plans/2026-09-07-mural-publico.md`. Ele registra os defeitos
encontrados durante a construção e as decisões tomadas sobre cada um, com o custo
estimado caso a decisão esteja errada.

A maior parte dos defeitos estava no **plano**, não na implementação: um plano
escrito tarefa a tarefa não enxerga o que fica duplicado ou contraditório entre elas.
Seis casos de duplicação e três contradições internas só apareceram na execução.

Cada decisão também vive na mensagem do commit que a aplicou; `git log` é a fonte
primária. Este arquivo é o índice.

---

## Varredura de pré-voo — pares de tarefas que compartilham arquivo ou interface

| Produz | Consome | O que atravessa | Achado |
|---|---|---|---|
| T1 globals.css, layout.tsx | T9 modifica layout.tsx | tokens CSS, variáveis de fonte | ok |
| T1 page.tsx (marcador) | T11 substitui page.tsx | rota raiz | ok, T11 sobrescreve de propósito |
| T2 datas.ts | T3, T10, T11, T12 | FUSO, formatar*, paraAtributoDatetime | ok, assinaturas batem |
| T3 exibicao.ts | T4 diasAte; T10, T12 | diasAte, estadoDoPrazo, rotuloContagem, estaVigente | ok |
| T4 ordenacao.ts | T8, T14 | ordenarMural, ItemOrdenavel | ok, PublicacaoDoMural satisfaz ItemOrdenavel |
| T5 schema.ts | T8 acrescenta relations | mesma arquivo, append no fim | ok, sem migração nova |
| T5 criarBancoDeTeste | T7, T8, T12, T14 | ajuda de teste | ok |
| T6 gerarSlug | T7 seed | slugs viram chave nos testes de T8/T12/T14 | ok, verificado abaixo |
| T7 semear | T8, T12, T14 | 9 publicações, 1 vencida | ok, contagens conferidas |
| T8 consultas.ts, tipos.ts | T11, T12, T14, T15 | PublicacaoDoMural, ROTULO_TIPO, CAMINHO_TIPO | ok |
| T8 função `achatar` | T14 redefine a mesma função | duplicação literal | **achado 1** |
| T9 Navegacao | T11, T12, T15 | prop `ativo` | ok |
| T10 componentes | T11, T12, T15 | props `publicacao`, `agora`, `variante` | ok |
| T11 pagina.module.css | T12, T15 importam | classes .secao .lista .doisPorLinha | ok, todas definidas em T11 |
| T13 filtros.ts | T14, T15 | Filtros, semFiltro, escreverFiltros, ROTULO_PERIODO | ok |
| T14 buscar/sugerirSaidas/listarCursos | T15 | assinaturas | ok |
| T15 rotas | T16 e2e | URLs e textos afirmados | ok |

## Varredura de pré-voo — coerência interna de cada tarefa

| Tarefa | Testes que especifica vs. código que especifica | Achado |
|---|---|---|
| T1 | teste lê globals.css; nove tokens escritos | ok |
| T2 | asserções de dia da semana e horário | **achado 2** |
| T3 | 3, 4, 7, 8 dias e limiar ≤7 | ok, conferido por cálculo |
| T4 | oito casos de faixa e desempate | ok |
| T5 | 3 testes; coluna gerada corrigida à mão na migração | ok |
| T6 | 19 testes; slug e validação | ok |
| T7 | 9 publicações, 1 vencida, datas relativas | ok |
| T8 | espera 8 vigentes; seed tem 9 com 1 vencida | ok |
| T9 | 8 testes de casca | ok |
| T10 | asserções de dia da semana | **achado 2** |
| T11 | 380 KB de 389120 bytes | ok, Math.round dá 380 |
| T12 | 2 vigentes por tipo | ok, seed tem 2 de cada após expirar 1 aviso |
| T13 | 15 testes de URL | ok |
| T14 | 11 testes; 'manutenção' deve dar 0 | ok, está vencida |
| T15 | 10 testes de componente | **achado 3** |
| T16 | 7 testes de ponta a ponta | ok |

## Achados e rulings, antes da execução

**Achado 1 — `achatar` duplicada entre T8 e T14.**
Ruling: T14 extrai a função para `src/lib/publicacoes/achatar.ts` e T8 passa a importá-la; a duplicação está no plano só para cada tarefa ser legível sozinha. Custo se errado: um refactor de dois arquivos.

**Achado 2 — 23/09/2026 é quarta-feira, o plano afirmava terça.**
Verificado por cálculo: 01/09/2026 é terça, 23/09 cai numa quarta. As Tarefas 2 e 10 falhariam nos testes de `formatarDataExtenso` e do `CardEvento`.
Ruling: corrigido no plano, 4 ocorrências trocadas para `quarta-feira, 23 de setembro`, antes de qualquer dispatch. Custo se errado: nenhum, é aritmética de calendário verificável.

**Achado 3 — T1 usava `--no-src-dir` e depois movia `app` para `src/`.**
Com `--no-src-dir`, o create-next-app mapeia `"@/*": ["./*"]`. Mover o código para `src/` sem ajustar o tsconfig quebraria todo import `@/lib/...` — e quebraria já na Tarefa 2, longe da causa.
Ruling: trocado para `--src-dir`, e o passo de mover foi removido. O passo agora manda conferir o mapeamento do tsconfig antes de seguir. Custo se errado: nenhum, é a configuração que o próprio Next.js gera.

**Achado 4 — `.env.example` listado nos arquivos de T1 e de T5.**
Nenhum passo de T1 o cria; T5 Step 2 cria.
Ruling: T5 é a dona do arquivo. A menção em T1 é ruído, não conflito. Custo se errado: nenhum.

**Achado 5 — T15 usa `style={{...}}` inline no h1, contra o padrão CSS Modules do resto.**
Ruling: o implementador de T15 põe esse estilo no módulo CSS da página, como todo o resto. Custo se errado: uma inconsistência estética que o revisor apanharia de qualquer forma.

## Progresso

### Tarefa 1 — fundação do projeto
BASE 1543785 -> HEAD b7a65d0. Implementador: DONE_WITH_CONCERNS, 10/10 testes.
Verificado por mim: docs/, .claude/, .agents/ e skills-lock.json intactos; tsconfig mapeia
"@/*" para ./src/*; .gitignore ainda cobre .superpowers/. Next 16.3.4, vitest ^5.

Ruling: aceito o scaffold feito em diretorio temporario e copiado para a raiz. O brief
mandava rodar create-next-app na raiz, mas o template conflitava com .agents/ e
skills-lock.json. O resultado e identico e nenhum arquivo preexistente foi tocado.
Custo se errado: nenhum, o estado final foi conferido arquivo a arquivo.

Ruling: aceito a subida de @types/node de ^20 para ^24. E conflito real de peer
dependency do vitest 5, nao capricho. Custo se errado: uma incompatibilidade de tipos do
Node que apareceria na compilacao, nao em producao.

Tarefa 1: minor (deferred): dois avisos de depreciacao do Vite/Vitest na saida de teste
(config loader e vite-tsconfig-paths). A constraint pede saida limpa; nao sao falhas e vem
da config que o proprio brief exigiu verbatim. Triagem fica para a revisao final.

Revisao T1: qualidade Approved. Spec marcada ❌ por um unico achado: .env.example listado
nos arquivos da tarefa e nunca criado.

Ruling: o achado e real mas a falha esta no plano, nao no codigo. Nenhum passo da Tarefa 1
criava o arquivo, e a Tarefa 5 Step 2 o cria. Corrigi a lista de arquivos da Tarefa 1 em vez
de mandar o implementador criar um arquivo vazio que a Tarefa 5 sobrescreveria. Isto confirma
o Achado 4 do pre-voo. Custo se errado: nenhum, o arquivo nasce na Tarefa 5 de qualquer forma.

Item ⚠️ do revisor (lint e dev nao verificaveis pelo diff): resolvido por mim, `npm run lint`
roda limpo, sem saida.

Tarefa 1: minor (deferred): --raio-selo define so 4px enquanto a constraint fala em faixa de
4 a 6px. Sem componente de selo ainda; quem construir o primeiro confirma se o token basta.

Tarefa 1: complete (commits 1543785..b7a65d0, review clean apos ruling)

### Tarefa 2 — formatacao de datas em pt-BR
BASE e1f5aea -> HEAD d297b9f. Implementador: DONE, 17/17 testes, tsc e eslint limpos.
Revisao: spec ✅, qualidade Approved, zero Critical e zero Important.

O revisor verificou empiricamente o risco que apontei: rodou date-fns + date-fns-tz com
TZ=UTC, simulando o servidor de producao, e reproduziu as 7 asercoes byte a byte. Confirma
que toZonedTime isola do fuso do sistema. Isso fecha a duvida de fuso para todo o projeto.

Item ⚠️ do revisor (strict do tsconfig fora do diff): resolvido por mim, ja conferi na
Tarefa 1 que tsconfig.json tem "strict": true.

Tarefa 2: minor (deferred): sem teste para minuto nao redondo tipo 19h05, unico ramo nao
exercitado de hora().
Tarefa 2: minor (deferred): sem tratamento de Date invalido; formataria "Invalid Date" em
vez de lancar. Nao foi pedido pelo brief.

Tarefa 2: complete (commits e1f5aea..d297b9f, review clean)

### Tarefa 3 — regras de exibicao
BASE d297b9f -> HEAD 567fd47. Implementador (modelo barato): DONE, 30 testes.
Revisao: spec ✅, Approved, zero Critical e zero Important.
Os dois riscos que nomeei no dispatch checaram certos: limiar `<= 7` inclusive conforme
spec §6, e estaVigente com `&&` mais `>` estrito. A aposta no modelo barato para tarefa de
transcricao se pagou: 11 tool uses contra 17 da tarefa anterior, metade do tempo.

Tarefa 3: minor (deferred): estaVigente tipa status como string crua em vez de uniao. Vem
do brief verbatim; apertar a assinatura quando a Tarefa 8 criar o tipo compartilhado.
Tarefa 3: minor (deferred): sem caso de exatamente 7 dias para rotuloContagem (so para
estadoDoPrazo).

Tarefa 3: complete (commits d297b9f..567fd47, review clean)

### Tarefa 4 — ordenacao do mural
BASE 567fd47 -> HEAD 86d30c8. Implementador (modelo barato): DONE, 38 testes.
Revisao: spec ✅, Approved, zero Critical e zero Important. Os tres riscos que nomeei
checaram certos, e o revisor confirmou que o teste de nao-mutacao detectaria mesmo a
regressao em vez de passar por acaso.

Tarefa 4: minor (deferred): sem teste para prazo ja vencido caindo na faixa normal.

Tarefa 4: complete (commits 567fd47..86d30c8, review clean)

## Rulings antes da Tarefa 5 — dois defeitos do plano que so morderiam depois

**Achado 6 — drizzle.config.ts usa `import 'dotenv/config'`, que le `.env`, mas o plano
manda criar `.env.local`.** O `drizzle-kit generate` nao acharia a DATABASE_URL e falharia
com erro de credencial, sem relacao aparente com a causa.
Ruling: drizzle.config.ts carrega `.env.local` explicitamente. O .gitignore ja cobre `.env`
e `.env*.local`, entao os dois sao seguros. Custo se errado: uma linha de config.

**Achado 7 — `client.ts` lanca no import se DATABASE_URL faltar, e `seed.ts` (Tarefa 7)
importa client no topo do modulo.** Os testes de integracao usam PGlite e nunca precisam de
DATABASE_URL, mas o simples `import { semear } from '@/lib/db/seed'` dispararia o throw. Isso
quebraria os testes das Tarefas 7, 8, 12 e 14 de uma vez, longe da causa.
Ruling: `seed.ts` nao importa `client` no topo. O import vira dinamico, dentro do bloco de
execucao por linha de comando. `client.ts` fica como o plano descreve — o throw ansioso e
desejavel para a aplicacao de verdade. Custo se errado: um import movido de lugar.

Nota para a Tarefa 5: `drizzle-kit generate` nao conecta no banco, so le o schema. Nao e
preciso ter Supabase no ar para concluir a tarefa; basta uma DATABASE_URL sintatica.

### Tarefa 5 — schema do banco
BASE 86d30c8 -> HEAD cb450e8 (2 commits do implementador + 1 meu de correcao do plano).
Implementador: DONE_WITH_CONCERNS, depois DONE apos rodada de correcao. 42 testes.
Revisao: spec ✅, Approved, zero Critical e zero Important.

**Achado 8 — o dicionario portuguese do Postgres preserva acentos.** Descoberto pelo
implementador ao investigar por que o teste falhava; a consequencia real e de produto, nao
de teste: buscar "calendario" sem acento nao acharia "calendário", e e assim que aluno
digita. Verifiquei no PGlite: unaccent nao existe la, e nem seria usavel em coluna gerada
por ser STABLE e nao IMMUTABLE.
Ruling: dobrar acento com translate(), que e IMMUTABLE e dispensa extensao. Os dois lados
dobram — a coluna busca_tsv e o termo da consulta, via semAcento (acrescentado a Tarefa 6).
Plano atualizado nas Tarefas 5, 6 e 14. Custo se errado: a busca fica acento-sensivel, o que
seria pior que o estado atual.

Limitacao registrada: o par -cao/-coes continua sem casar, limitacao do stemmer Snowball
que ja existia antes. Plurais normais funcionam. O teste de stemming da Tarefa 14 passou a
usar "disciplinas" em vez de "inscricoes", para refletir a realidade em vez de mascara-la.

O revisor conferiu os quatro riscos que nomeei: dobra nos tres campos, pesos A/B/C
preservados, paridade de comprimento das strings do translate (script Node, 46/46 caracteres
posicao a posicao) e indice GIN depois da coluna e apontando para ela.

Tarefa 5: minor (deferred): asserção `toMatch(/A/)` no teste do vetor e frouxa; passa por
acidente porque lexemas sao minusculos. Vem do brief verbatim.

Tarefa 5: complete (commits 86d30c8..cb450e8, review clean)

### Tarefa 6 — slug, semAcento e validacao por tipo
BASE cb450e8 -> HEAD 90a6e64. Implementador: DONE_WITH_CONCERNS (so divergencia de contagem
no meu texto: eu disse 19 testes novos, sao 22). 64 testes. Zod 4.5.4, sem adaptacao de API.
Revisao: spec ✅, Approved, zero Critical e zero Important. Os quatro riscos que nomeei
checaram certos: alt text cobre os 4 tipos por viver no superRefine da uniao, descricao em
branco e recusada via trim, a checagem fimEm>=inicioEm sobreviveu a mudanca com narrowing
por tipo, e semAcento e a unica normalizacao usada por gerarSlug.

Tarefa 6: minor (deferred): o bloco de teste do alt text so exercita aviso(). Um teste
direto com tipo 'noticia' tornaria explicita a garantia mais importante de acessibilidade
do produto, hoje so inferivel lendo o superRefine. **Levar isto para a revisao final** —
e o achado menor mais relevante ate agora.
Tarefa 6: minor (deferred): imagemAlt nao tem .trim() de transformacao, ao contrario de
titulo/resumo/corpo. Vem do brief verbatim.
Tarefa 6: minor (deferred): setorId, imagemUrl e as urls de anexo/link nao tem mensagem em
portugues; usuario veria "Invalid uuid" do Zod. Vem do brief verbatim.

Tarefa 6: complete (commits cb450e8..90a6e64, review clean)

### Tarefa 7 — conteudo de exemplo
BASE 90a6e64 -> HEAD 0ba9e8b (2 commits do implementador + 1 meu). DONE apos correcao 1.
67 testes, tsc e eslint limpos, seed roda sem DATABASE_URL.
Revisao: spec ✅, Approved, zero Critical e zero Important. Os quatro riscos checaram: datas
todas relativas, exatamente 1 vencida de 9, vinculos publicacao-curso todos criados, e 2
vigentes por tipo. O revisor rodou o proprio gerarSlug contra os 9 titulos e confirmou os
slugs de contrato.

**Achado 9 — `typeof db` amarra a assinatura das consultas ao driver postgres-js.** Achado
pelo implementador, que verificou com `git stash -u` que o erro nao vinha do baseline e
reportou o desvio em vez de esconder. As Tarefas 8, 12 e 14 esbarrariam no mesmo.
Ruling: `Db` vira `PgDatabase<PgQueryResultHKT, typeof schema>`, declarado uma vez no
client.ts. Import de tipo e apagado na compilacao, entao nao dispara o throw de DATABASE_URL.
Plano atualizado. Custo se errado: assinatura larga demais aceitaria um driver incompativel,
que falharia em runtime nos testes — visivel de imediato.

**Revisao do Achado 1 (pre-voo).** Eu tinha decidido que a Tarefa 14 extrairia `achatar` e a
Tarefa 8 passaria a importa-la. Inverto: a **Tarefa 8 ja cria** `src/lib/publicacoes/achatar.ts`
e a 14 importa. Menos churn e nenhuma janela em que a duplicacao existe. Custo se errado:
nenhum, e o mesmo arquivo em ordem diferente.

Tarefa 7: minor (deferred): titulos literais duplicados entre o insert e as buscas por slug
dos vinculos de curso. Falha ruidosa via throw se divergirem. Vem do brief verbatim.
Tarefa 7: minor (deferred): scripts db:seed/db:generate/db:push nunca rodados ponta a ponta,
porque nao ha Postgres provisionado. Conferir quando existir.

Tarefa 7: complete (commits 90a6e64..0ba9e8b, review clean)

### Tarefa 8 — consultas de listagem
BASE 0ba9e8b -> HEAD d6f33cb. Implementador: DONE apos 2 rodadas de correcao. 81 testes.
Revisao: spec ✅, Approved. Confirmou os 4 riscos, com destaque para buscarPorSlug NAO
filtrar por validade (regra central do produto). O revisor rodou tsc por conta propria para
confirmar que LinhaComRelacoes e checado de verdade, em vez de aceitar a alegacao.

Tarefa 8: fix round 1/5 (1 addressed, 0 open — isNotNull(publicadoEm) na vigencia; o
implementador reproduziu o crash revertendo a checagem; commits 48e2ced..bc0ef6e)
Tarefa 8: fix round 2/5 (1 addressed, 0 open — limite=0 devolvia lista inteira; commits
bc0ef6e..d6f33cb). Re-revisao: ADDRESSED, evidencia RED bate ("length of +0 but got 8").

**Achado 10 — `limite ? cortar : tudo` trata 0 como ausencia de limite.** Defeito do codigo
que eu escrevi no plano, apanhado pelo revisor e rotulado plan-mandated.
Ruling: corrigido para `limite === undefined`. Dormente hoje, mas um caminho de paginacao ou
contagem passaria 0 e receberia a lista inteira — falha silenciosa, nao erro. Custo se
errado: nenhum, e estritamente mais correto.

**Revisao do Achado 9.** O tipo Db generico se provou certo: o revisor confirmou que
PgQueryResultHKT e o supertipo que os dois drivers estendem, e que nao e supressao de tipo.

Tarefa 8: minor (deferred): achatar nao tem guarda de runtime se o shape de `with` mudar na
Tarefa 14. Levar como aviso para o dispatch da 14.
Tarefa 8: minor (deferred): teste "nao traz o aviso vencido" de listarPorTipo passaria com
zero linhas; nao verifica o slug excluido. Vem do brief verbatim.

Tarefa 8: complete (commits 0ba9e8b..d6f33cb, review clean)

### Tarefa 9 — casca do site
BASE d6f33cb -> HEAD 352e215. DONE apos 1 rodada de correcao. 89 testes, eslint e build limpos.
Revisao: spec ✅, Approved, zero Critical e zero Important. Os quatro riscos confirmados:
form GET sem 'use client' em nenhum dos 4 componentes, label real associado ao input (nao
placeholder), hierarquia h1->h2 sem pular nivel, e aria-current em exatamente um link — com
o teste afirmando ausencia do atributo nos outros, nao valor diferente.

**Achado 11 — eu justifiquei `<a>` em vez de `<Link>` com uma premissa falsa.** Disse que
preservava "zero JavaScript", mas `<Link>` renderiza `<a href>` no HTML e funciona igual com
JS desligado. Nao havia trade-off: eu abria mao de navegacao instantanea em troca de nada.
Apanhado pelo implementador via lint.
Ruling: navegacao interna usa Link; `<a>` so para externo e placeholder `href="#"`. Constraint
acrescentada ao plano. Custo se errado: nenhum, e estritamente melhor nos dois cenarios.

**Achado 12 — eu escrevi `#fff` literal nos CSS Modules do plano, contra minha propria
constraint.** O teste da paleta le so o globals.css, entao hex em componente escapa dele.
Ruling: tudo vira var(--papel); rgba com transparencia fica, por nao ter token. 4 corrigidos
no codigo, 11 no plano. Custo se errado: nenhum, mesmo valor.

Confirmei o desvio do implementador: estender a conversao ao /entrar da barra de servicos
foi certo — mesma rota, mesmo tratamento — e ele sinalizou em vez de fazer calado.

Tarefa 9: minor (deferred): .rotuloOculto usa left:-9999px em vez do padrao clip/1px. Vem do
brief. Padronizar num .sr-only na fase de acessibilidade.
Tarefa 9: minor (deferred): o Link da marca tem nome acessivel verboso (4 spans dentro).
Tarefa 9: minor (deferred): BarraServicos sem teste proprio.
Tarefa 9: minor (deferred): historico de commits confunde — meu commit de plano e o de codigo
tem assuntos parecidos. Artefato de eu versionar o plano na mesma branch.

Tarefa 9: complete (commits d6f33cb..352e215, review clean)

### Tarefa 10 — componentes de conteudo por tipo
BASE 352e215 -> HEAD 46b1350. DONE apos 1 rodada de correcao. 108 testes, build limpo,
nenhum 'use client'.
Revisao: primeira "Needs fixes" do plano. Spec ❌ por 1 achado Important plan-mandated.
Re-revisao: ambos ADDRESSED, sem quebra nova.

**Achado 13 — a spec §6 define a noticia como o unico tipo com credito de fotografia, e o
componente que escrevi nunca lia o campo.** creditoFoto existe no schema, e validado e o seed
o preenche. A assinatura da noticia era so autoria de texto.
Ruling: renderizar em figure/figcaption, omitido quando nulo. Credito de foto e obrigacao
editorial, nao enfeite. Custo se errado: nenhum, e requisito explicito da spec.

Confirmei silhuetas distintas pelo CSS: aviso nem toca em imagemUrl, evento trava 3:2, prazo
poe a contagem na ultima coluna, noticia usa 16/10 e a variante compacta nao tem imagem.

O implementador reportou com honestidade que no RED so o teste do credito falhou — os outros
dois ja passavam, por serem guarda de regressao sobre codigo correto. Nao vendeu os tres como
bugs corrigidos.

Tarefa 10: minor (deferred): figcaption dentro do Link engorda o nome acessivel; leitor de
tela anuncia "...Foto: Assessoria de Comunicacao" junto com o titulo.
Tarefa 10: minor (deferred): 2 avisos do eslint sobre <img> em vez de next/image. Decisao
envolve custo de provedor de imagem, nao so codigo. **Levar para a revisao final.**
Tarefa 10: minor (deferred): TituloSecao sem teste; o ramo do link "ver todos" nao e exercitado.
Tarefa 10: minor (deferred): .falta usa 6px literal onde LinhaAviso usa var(--raio-selo).

Tarefa 10: complete (commits 352e215..46b1350, review clean)

### Tarefa 11 — home do mural
BASE 46b1350 -> HEAD 8393694. DONE apos 2 rodadas de correcao. 125 testes.
Revisao: Needs fixes, 2 Important plan-mandated. Re-revisao: ambos ADDRESSED.

**Achado 14 — minha constraint "nenhum hex em CSS Module" era cega demais.**
O implementador obedeceu e trocou o #f3b9ba da linha de identificacao do hero por branco a
72%, o que a deixa identica ao resumo abaixo. Aquela cor e o vermelho institucional clareado
para ter contraste sobre a ardosia escura — e o que amarra o hero a marca.
Ruling: criar o token --tijolo-claro que faltava, e poe-lo no teste que trava a paleta. A
regra estava certa; faltava o token. Nem toda cor merece token, so as que carregam
significado — o hover do botao claro ficou com var(--regra) mesmo. Custo se errado: nenhum.

**Achado 15 — O CRITERIO DE SUCESSO DA SPEC §1 NAO SE CUMPRIA.** ordenarMural so prioriza
prazo dentro de 7 dias; alem disso ele cai na ordem por data de publicacao. A home cortava
prazos em 4 confiando nessa ordem. Com seis prazos e nenhum urgente, o que fecha em 10 dias
ficava em quinto e era cortado — o aluno nao acharia o prazo mais proximo na home. A pagina
/prazos era pior: promete no texto "do que vence antes ao que vence depois" e entregava outra
ordem. Achado pelo revisor da Tarefa 11.
Ruling: nasce ordenarSecao — a ordem dentro de uma secao de um tipo so e a data que aquele
tipo carrega, diferente da ordem do mural, que mistura tipos e vence a relevancia. Usada pela
home e pelas listagens da Tarefa 12. Custo se errado: baixo, a regra e local a secao.

**Achado 16 — a composicao da home nao era testavel**, por viver dentro de um Server
Component que depende de banco. Foi por isso que o Achado 15 atravessou 11 tarefas.
Ruling: extraida para montarSecoesDaHome, pura, com 7 testes. O implementador capturou RED
genuino implementando a versao ingenua de proposito; o re-revisor cruzou o relato com o
arquivo de teste e confirmou que nao era fabricado.

Tarefa 11: fix round 1/5 (1 addressed — token --tijolo-claro; commits 08cafed..3ad633a)
Tarefa 11: fix round 2/5 (2 addressed, 0 open — ordenarSecao e montarSecoesDaHome; commits
3ad633a..8393694)

Tarefa 11: minor (deferred): **se o mural nao tiver nenhum aviso**, escolherDestaque cai para
o primeiro item e o hero mostra um evento com o botao escrito "Ler o comunicado". A copia
assume que o destaque e sempre comunicado. Nao dispara com o seed atual. **Levar para a
revisao final.**
Tarefa 11: minor (deferred): 3o aviso de eslint sobre <img>, agora no Hero.
Tarefa 11: minor (deferred): teste do alt decorativo do hero nao exercita imagemAlt nulo.
Tarefa 11: minor (deferred): .lavada tem margin-top fixo, que descasa se a secao anterior
estiver vazia.

Tarefa 11: complete (commits 46b1350..8393694, review clean)

### Tarefa 12 — listagens por tipo e pagina da publicacao
BASE 8393694 -> HEAD f61e9da. DONE apos 1 rodada de correcao. 142 testes.
Revisao: Needs fixes, 1 Important plan-mandated. Re-revisao: ADDRESSED.

**Achado 17 — cinco paginas e um componente entregues sem nenhum teste de renderizacao.**
O teste que escrevi no plano so exercitava a camada de dados das Tarefas 8 e 11, que ja
existia — passou de primeira, sem RED, e o implementador reportou isso com honestidade em vez
de vender 131 verdes. O que ficava sem cobertura era a regra de negocio central da tarefa: o
ramo que decide entre publicacao vigente e publicacao que saiu do mural.
Ruling: separar busca de desenho. ListaDeSecao e ArtigoPublicacao viram componentes puros,
testaveis; as pecas assincronas encolhem para buscar e delegar. Mesma licao da Tarefa 11 —
o que nao e testavel isoladamente e o que passa despercebido. Custo se errado: nenhum, e
estritamente mais testavel.

O implementador fez um teste de mutacao por iniciativa propria: trocou `{!vigente ? (` por
`{false ? (`, confirmou que o teste pegou, e reverteu. O re-revisor conferiu que nenhum
`{false ?` sobrou no codigo.

Tarefa 12: minor (deferred): dentro do ListaDeSecao, so prazo e evento tem o despacho de
subcomponente verificado; aviso e noticia nao.
Tarefa 12: minor (deferred): ListagemPorTipo importa CSS Module de uma rota (@/app/pagina.
module.css). Acoplamento incomum; extrair para modulo compartilhado numa limpeza futura.
Tarefa 12: minor (deferred): formatacao de bytes embutida na pagina, enquanto datas usam
helper central. Caberia um formatarBytes em lib/formato.
Tarefa 12: minor (deferred): 4o aviso de eslint sobre <img>.

Tarefa 12: complete (commits 8393694..f61e9da, review clean)

### Tarefa 13 — filtros na URL
BASE f61e9da -> HEAD 22c3e66. Implementador (modelo barato): COMPLETO, 158 testes.
Revisao: spec ✅, Approved, zero Critical e zero Important. O revisor extraiu o codigo do
brief e comparou byte a byte com o diff, e conferiu TIPOS contra a definicao real de
TipoPublicacao em vez de confiar no brief. Os cinco riscos rastreados a mao: enums completos,
escreverFiltros cobrindo os 5 campos, ler/escrever inversas, semFiltro sem mutacao (com o
teste realmente capaz de detecta-la), e descreverAtivos removendo so um filtro.

Tarefa 13: minor (deferred): filtros.ts define um rotuloTipo local no plural que duplica o
ROTULO_TIPO singular de tipos.ts. Dois mapas para o mesmo enum, ponto de divergencia futura.
Vem do brief verbatim.

Tarefa 13: complete (commits f61e9da..22c3e66, review clean)

### Tarefa 14 — consulta de busca
BASE 22c3e66 -> HEAD 8652ce0. DONE apos 1 rodada de correcao. 170 testes.
Revisao: Needs fixes, 3 Important. Re-revisao: todos ADDRESSED, sem ciclo de import, e
nenhum arquivo de teste no diff — a contagem estavel reflete testes iguais.

**Achado 18 — tres blocos duplicados entre a busca e as consultas do mural**: a condicao de
vigencia, paraOrdenacao e COM_RELACOES. Causa raiz: o brief da Tarefa 14 foi escrito antes de
a Tarefa 8 centralizar o achatar, e entregava definicoes copiadas. Eu avisei sobre uma; as
outras duas passaram, e o revisor achou a terceira.
O revisor foi preciso sobre onde esta a falha: `vigente()` nao era exportada, entao a busca
nao tinha como reusa-la. Falta de exportacao e o defeito, nao o lugar da copia.
Ruling: COM_RELACOES vai para achatar.ts (ao lado do tipo que descreve o que ela produz),
paraOrdenacao para ordenacao.ts (ao lado do ordenarMural, cuja restricao ela existe para
satisfazer), e vigente e exportada de consultas.ts, que e a fonte. Custo se errado: baixo, e
movimentacao sem mudanca de comportamento, confirmada por 170 testes inalterados.

**Padrao que este achado fecha:** um plano escrito tarefa a tarefa nao enxerga o que fica
duplicado entre elas. Aconteceu 4 vezes (achatar, Db, as tres desta tarefa). Vale como licao
para os Planos 2 e 3: revisar o plano inteiro contra si mesmo depois de escrito, nao so cada
tarefa contra a spec.

Tarefa 14: minor (deferred): sugerirSaidas faz 3 buscas completas para extrair 3 contagens,
descartando as linhas. contarVigentes ja mostra o padrao mais barato. Aceitavel na escala de
um mural de faculdade; revisitar se virar caminho quente.
Tarefa 14: minor (deferred): slug de curso inexistente na URL faz o filtro ser ignorado em
silencio, devolvendo tudo em vez de nada. Sem teste.

Tarefa 14: complete (commits 22c3e66..8652ce0, review clean)

### Tarefa 15 — pagina de busca
BASE 8652ce0 -> HEAD 4e04d4d. DONE apos 1 rodada de correcao. 182 testes.
Revisao: Needs fixes, 2 Important plan-mandated. Re-revisao: ambos ADDRESSED; o revisor
montou a frase a mao em todas as combinacoes e confirmou o portugues, inclusive plurais.

**Achado 19 — "Nenhum publicacao" na tela vazia.** O artigo era fixo em masculino, mas sem
filtro de tipo o substantivo e "publicacao", feminino; com tipo noticia virava "Nenhum
comunidade". O caso sem tipo e o MAIS COMUM de tela vazia. Os testes so exercitavam evento,
masculino por acaso.
Ruling: mapa NA_FRASE com artigo e substantivo por tipo. Na frase corrida, noticia e
"noticia", nao "comunidade" — rotulo de secao e nome em frase sao coisas diferentes, mesma
licao que o implementador ja tinha descoberto sozinho para o periodo. Custo se errado: nenhum.

**Achado 20 — a contagem de "Ver qualquer data" nao correspondia ao link.** semFiltro devolve
o periodo ao padrao de 30 dias; o link leva para "qualquer". Com o padrao ativo — o caso
comum — semFiltro vira no-op, a contagem repete o zero da busca atual e a saida NUNCA aparece,
mesmo havendo resultado adiante. O aluno perde a porta que resolveria o problema dele.
Ruling: contar com { ...f, periodo: 'qualquer' }. semTipo e semCurso ja estavam certos: so o
periodo divergia, por eu ter reusado um helper generico onde precisava de valor especifico.

Tarefa 15: minor (deferred): o termo de busca `q` nao aparece como ficha removivel em
descreverAtivos. Quem busca so por termo ve zero "filtros ativos" mesmo com a lista recortada.
Tarefa 15: minor (deferred): LinhaPrazo.module.css ainda tem border-radius 6px fixo.

Tarefa 15: complete (commits 8652ce0..4e04d4d, review clean)

## Tarefa 16 — precisa de banco real
Nao ha Docker nem Supabase neste ambiente. Cliente escolheu PGlite em memoria.

### Tarefa 15b — banco em memoria para desenvolvimento (acrescentada ao plano)
BASE 4e04d4d -> HEAD 25fd6be. DONE. 182 testes, tsc e eslint limpos, e **npm run build passa
pela primeira vez no projeto**. Home verificada por curl com conteudo do seed.

Ruling: obterDb() memoizada substitui o `db` pronto. Com DATABASE_URL real, postgres-js; sem
ela, PGlite migrado e semeado, com aviso obrigatorio no console. Custo se errado: um caminho
de codigo a mais que diverge de producao — mitigado pelo aviso e por os 182 testes cobrirem os
dois lados.

So foi possivel porque o tipo Db virou independente de driver na correcao do Achado 9, feita
por outro motivo oito tarefas antes.

Ruling: aprovado `serverExternalPackages: ["@electric-sql/pglite"]` no next.config.ts. E a
saida documentada do Next para dependencia nativa; o implementador sinalizou por estar fora do
escopo listado. Custo se errado: nenhum, e configuracao padrao.

Ruling: apagado o .env.local que a Tarefa 5 criou com placeholder. Nunca esteve versionado, e
era a fonte do ECONNREFUSED desde a Tarefa 11. O .env.example documenta o formato.

Ruling: `db:seed` sem DATABASE_URL real agora falha com mensagem clara em vez de semear um
banco descartavel que morre com o processo. Comando que finge funcionar e pior que um que
recusa.

O implementador evitou uma sexta duplicacao sozinho: exportou precisaDeBancoEmMemoria do
client.ts em vez de repetir a checagem no seed.

Revisao T15b: spec ✅, Approved, 1 Important. Re-revisao: 4/4 ADDRESSED.
Os seis riscos de regressao que nomeei checaram: caminho de producao identico, deteccao por
igualdade exata (nao heuristica frouxa), aviso estruturalmente impossivel no caminho real,
memoizacao da PROMESSA (correta sob concorrencia), 4 consumidores atualizados incluindo os
dois de p/[slug], e extracao das migracoes byte a byte.

**Achado 21 — a funcao que separa banco real de banco em memoria nao tinha teste.** Unica
protecao contra producao cair no banco efemero em silencio. Funcao pura, trivial de testar,
e nenhum dos 182 testes a tocava.
Ruling: 4 casos de teste, importando URL_PLACEHOLDER da fonte em vez de repetir o literal —
literal copiado se desatualiza e o teste passa enquanto a protecao quebra. Custo se errado:
nenhum, e teste de funcao pura.

**Verificacao independente minha:** rodei `npm run build`. Passa. 8 rotas: /, /avisos,
/eventos, /prazos, /comunidade estaticas com revalidacao de 5min; /buscar e /p/[slug] sob
demanda. E a arquitetura que o plano previa.

Tarefa 15b: complete (commits 4e04d4d..74ea103, review clean). 186 testes.

### Tarefa 16 — testes de ponta a ponta
BASE 74ea103 -> HEAD 86a3272. DONE apos 2 rodadas de correcao. 8 testes e2e, 186 unidade.

**Achado 22 — BUG REAL DE PRODUCAO, achado pelos testes e2e na primeira execucao.** O .hero
tirava altura da <img> de fundo, que e opcional. Nenhuma das 9 publicacoes do seed tinha
imagem, entao o elemento colapsava e o veu subia por cima do cabecalho, BLOQUEANDO O CLIQUE
no botao de busca. Os 186 testes de unidade e integracao nao podiam pegar: nenhum monta a
pagina inteira num navegador.

**Achado 23 — a primeira correcao trocou um bug por outro.** Tirar a foto do fluxo da grade
inverteu a ordem de pintura: elemento posicionado pinta depois de estatico, entao a foto
passou a cobrir o veu e interceptar o clique no CTA do hero. Achado pelo re-revisor com repro
isolado fora do checkout.
Ruling: z-index explicito nos dois, com position:relative no veu (que nao o tira do fluxo,
preservando o calculo de altura).

**Achado 24 — o ponto cego que escondeu os dois: seed sem imagem nenhuma.**
Ruling: imagem local em public/exemplo (nao baixada, para a suite ser hermetica), usada no
destaque e no evento, mais teste e2e cobrindo o caminho com foto e verificando empilhamento
real via elementFromPoint. Custo se errado: baixo; e dado de exemplo.

**Duas instrucoes MINHAS que o implementador contradisse com evidencia, e estava certo nas
duas:** (1) toBeVisible() do Playwright NAO cobre opacity — provou forcando opacity:0 e vendo
passar; (2) height:100% em item de grid com trilha automatica nao resolve — a imagem quadrada
de teste inflou o hero para 1280px.

**Achado 25 — o teste do hover nao podia falhar.** Usava toContainText, que le o DOM sem
verificar visibilidade. Era justamente o teste construido para travar a regra "nenhuma
informacao so no hover". Verificava 2 dos 4 campos prometidos.
Ruling: toBeVisible mais checagem de opacidade computada, nos quatro campos, com RED provado.

Tarefa 16: fix round 1/5 (2 addressed, 1 novo introduzido; commits aa8fecd..c63101c)
Tarefa 16: fix round 2/5 (2 addressed, 0 open; commits c63101c..86a3272)
Tarefa 16: complete (commits 74ea103..86a3272, review clean)

## TODAS AS 17 TAREFAS COMPLETAS (16 do plano + 15b acrescentada). Falta a revisao final.

## REVISAO FINAL DA BRANCH
Veredito inicial: NAO merge — 6 bloqueadores, 1 duplicacao (a sexta), 5 menores promovidas.
Onda unica de correcao: commits 942499e e 0c3f13a. 186 -> 222 testes, eslint zero avisos.
Re-revisao: 11/11 ADDRESSED, nenhuma quebra nova. **Veredito: pode ir para a master.**

Ruling: a trava de producao barra tambem o `npm run build`, e isso e deliberado — e na build
que o conteudo vira HTML publico. Verifiquei que `npm run dev` segue funcionando sem banco,
entao quem clona ainda ve o mural. Custo se errado: nao da para buildar sem Postgres, o que e
o comportamento correto para um deploy.

Ruling: recusei a valvula de escape por variavel de ambiente que o implementador ofereceu.
Seria posta no CI algum dia e devolveria em silencio o desastre que a trava impede. Trava com
escapatoria facil nao e trava. Custo se errado: alguem precisa comentar uma linha localmente
para buildar sem banco — deliberado e visivel.

### Tres residuais parqueados apos a re-revisao final
Parked: `EstadoVazio.tsx:44` usa `in`, que percorre a cadeia de prototipos — `?curso=toString`
passa por "curso conhecido" e imprime a funcao coagida. Ruling: real mas cosmetico e exige URL
forjada a mao; `Object.hasOwn` resolve numa linha, na proxima rodada de manutencao.

Parked: o layout raiz passou a consultar o banco em toda rota, via RodapeDoMural buscando os
cursos reais. Ruling: e o preco de o rodape nao codificar slugs que a spec §16.1 diz que vao
mudar. Na escala de um mural de faculdade, com revalidacao de 5 minutos, nao pesa. Revisitar
se virar caminho quente.

Parked: publicacao `arquivado` com expiracao futura ainda mostra "saiu do mural em [data
futura]". Ruling: a frase e verdadeira, a data e a errada; pre-existente, sem linha assim no
seed, e so aparece quando o painel do Plano 2 permitir despublicar antes do vencimento —
corrigir la, junto de quem cria o caso.

## PLANO CONCLUIDO. 222 testes de unidade e integracao, 8 de ponta a ponta.
