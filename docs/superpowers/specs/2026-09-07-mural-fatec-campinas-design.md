# Mural da Fatec Campinas — documento de design

Data: 7 de setembro de 2026
Status: aprovado para planejamento de implementação

---

## 1. O que é

Uma aplicação web que substitui o mural físico da Fatec Campinas: um lugar
público onde alunos encontram avisos oficiais, eventos do campus, prazos
acadêmicos e notícias da comunidade, e onde a secretaria, as coordenações e o
centro acadêmico publicam sem depender de ninguém da TI.

O trabalho nasce como entrega acadêmica, mas a arquitetura foi escolhida para
que a aplicação possa ser oferecida à instituição depois sem reescrita. Isso
define duas regras que valem para todo o projeto:

- Nada de atalhos de demonstração. Sem dados fixos no código, sem login
  simulado, sem tela que só funciona no roteiro da apresentação.
- Nada de integração institucional antes da hora. Não há conversa com o SIGA
  nem login único do Centro Paula Souza na primeira versão.

### O problema que ele resolve

O aluno perde prazo. O aviso importante fica soterrado por conteúdo velho. O
centro acadêmico não tem canal oficial. A secretaria depende de terceiros para
publicar. O mural físico só existe para quem passa no corredor, e a maioria
consulta pelo celular.

### Como saberemos que funcionou

- Um aluno abre o mural e descobre o prazo mais próximo sem usar busca nem
  filtro.
- Um servidor da secretaria publica um comunicado com anexo em menos de três
  minutos, sem treinamento.
- Conteúdo vencido sai do mural sozinho, sem ninguém lembrar de removê-lo.

---

## 2. Decisões já tomadas

Estas foram fechadas durante o brainstorming e não são reabertas no
planejamento.

| Decisão | Escolha | Motivo |
|---|---|---|
| Destino | Acadêmico agora, pronto para virar real | Define as duas regras da seção 1 |
| Stack | Next.js + TypeScript + PostgreSQL | Um código só para site e painel; migra para servidor próprio depois |
| Contas | Só quem publica | Mural público; menos LGPD, menos código, e é como murais institucionais funcionam |
| Governança | Confiança por papel | Reflete a hierarquia real e não cria gargalo na secretaria |
| Modelo de conteúdo | Entidade única com discriminador de tipo | Os quatro tipos compartilham ~80% dos campos; busca e filtro viram uma query |
| Direção visual | Portal institucional | Derivada de harvard.edu, cam.ac.uk e stanford.edu |
| Paleta | Amostrada do logo oficial da Fatec | Ver seção 9 |
| Tipografia | Archivo + Archivo Narrow | Conversa com a voz sans do logo; a Narrow serve as listas densas |
| Ordem de construção | Desktop primeiro, responsividade depois | Definido pelo cliente; ver seção 13 |

---

## 3. Escopo

### Entra na primeira versão

- Mural público em desktop, com os quatro tipos de conteúdo.
- Busca por texto e filtros por curso, tipo e período.
- Expiração automática de conteúdo.
- Autenticação de publicadores com três papéis.
- Painel de publicação com fila de aprovação.
- Upload de imagem e de anexos em PDF.
- Acessibilidade conforme a seção 11.

### Fica para depois

- Responsividade e layout de celular. Decisão do cliente: desenhar a partir da
  versão desktop final, não em paralelo.
- Animações e micro-interações além da mudança de cor em repouso. Discutidas,
  adiadas a pedido do cliente.
- Contas de aluno, favoritos e feed personalizado.
- Notificação por e-mail, RSS e integração com calendário.
- Login único institucional e integração com o SIGA.

### Fora de escopo, sem previsão

- Comentários, curtidas ou qualquer interação social.
- Sistema de inscrição em eventos. O mural aponta para o formulário externo,
  não o hospeda.

---

## 4. Quem usa

### Leitor (sem conta)

Aluno, professor, candidato ou comunidade externa. Lê tudo, busca, filtra e
baixa anexos. Nunca faz login.

### Colaborador

Centro acadêmico, monitores, representantes de turma. Cria publicações, que
entram como **em revisão**. Não publica sozinho. Vê e edita apenas o que criou,
e só enquanto não estiver publicado.

### Editor

Secretaria, coordenações de curso. Publica direto, sem fila. Aprova ou devolve
publicações de Colaboradores. Edita e despublica qualquer publicação. Não
gerencia usuários.

### Administrador

Direção ou TI da unidade. Tudo que o Editor faz, mais criar, desativar e trocar
o papel de usuários, e gerenciar a lista de setores e cursos.

### Regra que sustenta o desenho

Um aviso urgente da secretaria não pode ficar esperando aprovação. Por isso a
confiança vem do papel, e não do conteúdo: quem tem responsabilidade
institucional publica direto, quem não tem passa por revisão.

---

## 5. Modelo de conteúdo

Uma entidade `publicacao` com um campo `tipo` que assume `aviso`, `evento`,
`prazo` ou `noticia`. Os campos específicos de cada tipo são colunas opcionais,
validadas por tipo na camada de aplicação com Zod.

### Campos comuns a todos os tipos

| Campo | Tipo | Obrigatório | Observação |
|---|---|---|---|
| `id` | uuid | sim | |
| `slug` | texto | sim | Único, derivado do título, usado na URL |
| `tipo` | enum | sim | `aviso` / `evento` / `prazo` / `noticia` |
| `titulo` | texto | sim | Máx. 140 caracteres |
| `resumo` | texto | sim | Máx. 220 caracteres; aparece na listagem e na meta description |
| `corpo` | texto rico | sim | Markdown |
| `setor_id` | fk | sim | Em nome de quem publica |
| `autor_id` | fk | sim | Quem criou; não aparece para o leitor |
| `cursos` | fk n:n | não | Vazio significa "todos os cursos" |
| `imagem_url` | texto | não | |
| `imagem_alt` | texto | condicional | **Obrigatório se `imagem_url` existir** |
| `anexos` | json | não | Lista de `{url, nome, bytes, mime}` |
| `link_externo` | json | não | `{url, rotulo}` |
| `destaque` | booleano | sim | Fixa no topo da seção; padrão falso |
| `status` | enum | sim | `rascunho` / `em_revisao` / `publicado` / `arquivado` |
| `publicado_em` | timestamp | condicional | Preenchido na transição para `publicado` |
| `expira_em` | timestamp | sim | Ver seção 6 |
| `criado_em`, `atualizado_em` | timestamp | sim | |

### Campos por tipo

**Aviso** — `urgencia` (`informativo` / `importante` / `urgente`),
`documento_numero` (ex.: "042/2026").

**Evento** — `inicio_em` (obrigatório), `fim_em`, `local` (obrigatório),
`modalidade` (`presencial` / `online` / `hibrido`), `link_inscricao`,
`vagas_restantes`.

Sobre vagas: o mural **não hospeda inscrição**, apenas aponta para o formulário
externo. Logo, não há como o sistema calcular quantas vagas sobraram.
`vagas_restantes` é um número que o publicador digita e atualiza à mão, e o
formulário deixa isso explícito no texto de ajuda. Campo vazio significa "não
informado" e a listagem simplesmente omite a linha — nunca exibe "0 vagas" por
falta de dado.

**Prazo** — `prazo_final` (obrigatório), `abre_em`, `link_acao` com rótulo
próprio (ex.: "Fazer inscrição").

**Notícia** — nenhum campo adicional obrigatório. `pessoas_citadas` (texto
livre) e `credito_foto` são opcionais e alimentam a legenda.

### Três datas diferentes, nunca confundidas

Este é o ponto onde o modelo mais facilmente daria errado.

- `expira_em` — quando a publicação **sai do mural**. Todos os tipos têm.
- `inicio_em` — quando o **evento acontece**.
- `prazo_final` — a **data-limite** de uma obrigação do aluno.

Um evento pode ter acontecido ontem e continuar no mural por uma semana. Um
prazo deve ganhar destaque crescente conforme se aproxima e sumir assim que
vence. São regras de exibição distintas sobre datas distintas.

---

## 6. Regras de exibição

### Expiração

Conteúdo vencido **sai do mural, mas não é apagado**. A listagem filtra por
`expira_em > agora()`. A página individual continua acessível pela URL, e o
conteúdo aparece no arquivo. Isso preserva o valor de registro de um comunicado
oficial e evita links quebrados em documentos que citaram o mural.

Não há tarefa agendada apagando nada. A expiração é uma condição de consulta.

Valores sugeridos ao publicador, todos editáveis:

| Tipo | Sugestão padrão |
|---|---|
| Aviso | 30 dias após a publicação |
| Evento | 7 dias após `fim_em` |
| Prazo | O próprio `prazo_final` |
| Notícia | 90 dias após a publicação |

### Urgência e contagem

O prazo exibe "Faltam N dias", calculado sobre `prazo_final`. O tratamento
visual muda em dois estados apenas, porque a paleta tem um só acento:

- Mais de 7 dias: neutro, borda cinza sobre fundo branco.
- 7 dias ou menos: fundo vermelho tijolo sólido, texto branco.

Se todos os prazos fossem vermelhos, nenhum seria urgente.

Para avisos, `urgencia = urgente` aplica o selo vermelho e habilita a
publicação no destaque do topo da página.

### Ordenação padrão

O mural ordena por relevância temporal, não por data de publicação pura:

1. Publicações com `destaque = verdadeiro`.
2. Prazos com `prazo_final` nos próximos 7 dias.
3. Avisos com `urgencia = urgente` publicados nos últimos 3 dias.
4. O restante por `publicado_em` decrescente.

### Dominante visual por tipo

Cada tipo tem um elemento que o olho pega primeiro ao rolar. Esta é a regra que
impede o mural de virar uma parede uniforme de retângulos, e ela vale para
qualquer tela futura.

| Tipo | Dominante | Como se manifesta |
|---|---|---|
| Aviso | A urgência | Selo vermelho, sem imagem, atravessa a largura |
| Evento | O quando e o onde | Data por extenso e foto em 3:2 |
| Prazo | A contagem | "Faltam N dias" alinhado à direita da linha |
| Notícia | A imagem | Única com foto de peso e crédito de fotografia |

---

## 7. Busca e filtros

A busca devolve **uma lista única com os quatro tipos misturados**, ordenada por
relevância. É o retorno prático do modelo unificado: uma query, não quatro
combinadas.

### Filtros

- **Curso** — seleção única; "todos os cursos" inclui publicações sem curso.
- **Tipo** — abas de navegação, não campo de formulário.
- **Período** — esta semana, próximos 30 dias, qualquer data.
- **Ordenação** — mais recentes, prazo mais próximo.

O estado dos filtros vive na URL como query string, para que uma busca filtrada
possa ser compartilhada e para que voltar no navegador funcione.

### Filtros ativos

Sempre visíveis como fichas removíveis, com um "limpar tudo". Junto à barra,
uma contagem: "23 publicações no mural agora". Sem isso, quem filtra não
distingue falta de conteúdo de excesso de recorte.

### Quando não há resultado

A tela vazia não diz apenas "nada encontrado". Ela nomeia o filtro que
provavelmente esvaziou a lista e oferece a saída em um clique:

> **Nenhum evento de Segurança da Informação nos próximos 7 dias**
> Há 6 eventos desse curso mais adiante no calendário, e 3 avisos publicados
> nesta semana.
> [Ver os próximos 90 dias] [Incluir avisos e prazos] [Ver todos os cursos]

No mural, resultado zero quase nunca é ausência de conteúdo. É recorte
excessivo, e a interface deve dizer isso.

### Busca textual

`titulo`, `resumo` e `corpo` de publicações com `status = publicado` e não
vencidas. Implementada com full-text search nativo do PostgreSQL em português
(`to_tsvector('portuguese', ...)`), com índice GIN. Sem serviço de busca
externo.

---

## 8. Fluxo de publicação

```
Colaborador cria ──> em_revisao ──> Editor aprova ──> publicado
                          │                              │
                          └── Editor devolve ──> rascunho │
                                                          ▼
                                            expira_em vence ou
                                            Editor despublica
                                                          │
                                                          ▼
                                                      arquivado
```

Editor e Administrador criam já em `publicado`, ou salvam como `rascunho` para
terminar depois.

### Regras

- Devolver exige um comentário. O Colaborador precisa saber o que corrigir.
- Publicação devolvida volta para `rascunho`, editável pelo autor.
- Despublicar move para `arquivado` e tira do mural sem apagar.
- Toda transição de status é registrada com autor, data e comentário. Um mural
  institucional precisa de rastro: quem publicou, quem aprovou, quando saiu.

---

## 9. Sistema de design

### Paleta

Amostrada do arquivo de logo oficial em uso no portal da Fatec Campinas
(`Logo_Fatec.png`, 798×351). A cor dominante do logo **não é vermelha**: é uma
ardósia azul-acinzentada, com o vermelho reservado ao nome da unidade.

| Token | Hex | Papel |
|---|---|---|
| `ardosia` | `#475D68` | Dominante: títulos de seção, navegação, botão de busca |
| `ardosia-escura` | `#33454E` | Bandas: barra de serviços, rodapé, sobreposição do hero |
| `tijolo` | `#B22D30` | Acento único: urgência, prazo apertado, ações, filete do topo |
| `tijolo-escuro` | `#8E2326` | Estado pressionado do acento |
| `tinta` | `#1E272C` | Texto principal |
| `cinza` | `#5A6A72` | Texto secundário, derivado da ardósia |
| `regra` | `#D5DBDE` | Filetes e bordas |
| `lavado` | `#F2F4F5` | Fundo de seção alternada |
| `papel` | `#FFFFFF` | Fundo base |

Referência auxiliar: o Centro Paula Souza usa `#B20000` no site institucional.

**Pendência:** os valores acima vêm de amostragem de PNG, não de manual de
marca. Se a instituição fornecer o manual com o Pantone oficial, ele prevalece.

### Tipografia

- **Archivo** — títulos, navegação, botões, rótulos. Grotesca institucional da
  Omnibus-Type. Conversa com a voz sans do logo.
- **Archivo Narrow** — listas densas: datas, resumos de linha, metadados,
  rodapé. Cabe mais informação por linha sem apertar a leitura, e o mural é
  feito de listas.

Ambas foram desenhadas na América Latina, com til, cedilha e circunflexo
projetados e não adaptados de uma fonte inglesa.

Medida de linha máxima: 72 caracteres em corpo de texto.

### Forma

- Botões, campos e fichas: raio de 7px.
- Imagens: raio de 9px.
- Selos e indicadores: raio de 4 a 6px.
- Seções, filetes, listas e tabelas: **sem raio**. O arredondamento fica no que
  se clica; a grade reta sustenta a leitura institucional.
- Sem sombra de elevação. Hierarquia vem de filete, peso e bloco de cor.

### Regra de interação

> **Nenhuma informação pode existir só no hover.**

Todo texto, data, autor e rótulo é legível com a página parada. O hover apenas
reforça o que já está visível — na primeira versão, só muda a cor de títulos.

Vale por acessibilidade e porque em celular não existe hover, e o celular é
onde a maioria dos alunos vai ler. Elimina de antemão padrões como "o resumo
aparece ao passar o mouse" ou "o botão surge no hover".

---

## 10. Estrutura das páginas

| Rota | Conteúdo |
|---|---|
| `/` | Hero com o aviso urgente do momento, depois avisos, eventos, prazos e comunidade |
| `/buscar` | Lista unificada com filtros e estado vazio |
| `/avisos`, `/eventos`, `/prazos`, `/comunidade` | Listagem por tipo |
| `/p/[slug]` | Página da publicação |
| `/calendario` | Eventos e prazos em ordem cronológica |
| `/entrar` | Login de publicador |
| `/painel` | Painel de publicação |

O cabeçalho tem barra de serviços (SIGA, biblioteca, estágios, centro
acadêmico), lockup da marca, busca visível e navegação por tipo. O rodapé tem
quatro colunas com links por curso e por serviço. Universidade é portal: serve
muitos públicos ao mesmo tempo e não esconde isso atrás de minimalismo.

---

## 11. Painel de publicação

Validado visualmente em 7 de setembro de 2026.

Navegação em barra lateral fixa, com a fila de trabalho como primeira entrada e
um contador do que aguarda revisão. As seções de administração ficam separadas
por um divisor e só aparecem para o Administrador.

### Telas

**`/painel`** — fila de trabalho. Para Colaborador: suas publicações por
status. Para Editor e Administrador: primeiro o que aguarda revisão, com
"Revisar" e "Devolver" na própria linha, depois as próprias, depois tudo.

No topo, quatro contagens: aguardando revisão, rascunhos próprios, publicadas
no mural e **vencem nesta semana**. A última existe porque conteúdo importante
sai do mural sozinho, e alguém precisa perceber que ele precisava ser renovado.

**`/painel/nova`** — formulário. Escolha do tipo primeiro, porque ela muda os
campos seguintes. Rótulo sempre acima do campo, texto de ajuda abaixo, erro
abaixo do campo. Campos comuns, depois o bloco específico do tipo.

Coluna lateral com a data de saída do mural, uma lista de verificação do que
falta e as ações. O rascunho salva sozinho, para que ninguém perca texto ao
fechar a aba.

**`/painel/publicacao/[id]`** — edição, com histórico de transições e o
comentário de devolução, quando houver.

**`/painel/usuarios`** — só Administrador. Criar, desativar e trocar papel. A
tabela tem uma coluna **Publica** que traduz o papel para a consequência
prática, "direto" ou "com revisão" — que é o que a pessoa precisa saber ao
escolher o papel de alguém.

Usuário é **desativado, nunca excluído**, para que o histórico de quem publicou
o quê continue íntegro.

**`/painel/setores`** — só Administrador. Setores e cursos.

### Três decisões de comportamento

1. **Rascunho salva sozinho.** Publicar um comunicado não pode custar o texto
   perdido por uma aba fechada.
2. **Publicar fica desabilitado enquanto houver pendência, com o motivo
   visível ao lado.** É melhor impedir e explicar do que aceitar e reclamar
   depois. A lista de verificação mostra o que está pronto e o que falta.
3. **Nada é excluído.** Publicação vai para o arquivo, usuário é desativado.

### Validações que a interface precisa impedir

- Imagem sem texto alternativo não salva. A mensagem explica por quê.
- Evento sem `inicio_em` ou sem `local` não salva.
- Prazo sem `prazo_final` não salva.
- `expira_em` anterior a agora não salva.
- Título acima de 140 ou resumo acima de 220 caracteres mostram contador antes
  de o autor estourar o limite.

### Escrita da interface

Voz ativa e o mesmo nome para a mesma ação do começo ao fim: o botão diz
"Publicar" e a confirmação diz "Publicado". Erro diz o que aconteceu e como
resolver, sem pedir desculpa. Tela vazia é convite para agir, não recado triste.

---

## 12. Acessibilidade

Meta: WCAG 2.1 nível AA.

- Contraste mínimo de 4,5:1 em texto normal e 3:1 em texto grande. A
  combinação `tijolo` sobre branco e `ardosia` sobre branco atende; toda nova
  combinação é verificada antes de entrar.
- Texto alternativo obrigatório por validação, não por recomendação.
- Navegação completa por teclado, com foco visível em contorno de 2px na cor
  de acento. Nenhuma armadilha de foco.
- HTML semântico: `header`, `nav`, `main`, `article`, `footer`, `time` com
  `datetime`, hierarquia de títulos sem pular nível.
- Link para pular ao conteúdo principal.
- Cor nunca é o único portador de informação. O prazo apertado tem fundo
  vermelho **e** o texto "Faltam 4 dias".
- `prefers-reduced-motion` respeitado desde o início.
- Datas por extenso no texto visível ("terça-feira, 23 de setembro"), com o
  formato de máquina no atributo `datetime`.

---

## 13. Arquitetura técnica

### Stack

- **Next.js (App Router) + TypeScript** — site público e painel no mesmo
  código. Server Components por padrão; cliente só onde há interação real.
- **PostgreSQL no Supabase** — banco e armazenamento de arquivos no mesmo
  provedor, com camada gratuita. Postgres é portátil: se a Fatec quiser
  hospedar em servidor próprio, o banco migra sem alteração de código.
- **Drizzle ORM** — schema em TypeScript, migrações versionadas.
- **Auth.js v5** com provedor de credenciais e senha com hash Argon2.
  Justificativa: não depende de serviço de e-mail para funcionar na entrega
  acadêmica. O modelo de autorização por papel não muda quando o login virar
  SSO institucional; troca-se o provedor, não as regras.
- **Zod** — validação compartilhada entre formulário e servidor.
- **Supabase Storage** — imagens e PDFs, atrás de um módulo próprio para que o
  provedor possa ser trocado.

### Organização

Módulos com fronteira clara, cada um compreensível sozinho:

```
app/                    rotas do site público e do painel
lib/publicacoes/        modelo, validação por tipo, regras de exibição
lib/busca/              query de busca e filtros
lib/autorizacao/        papéis e o que cada um pode fazer
lib/armazenamento/      upload e URL de arquivo
lib/db/                 schema Drizzle e migrações
components/             componentes de interface
```

A regra "quem pode fazer o quê" vive **em um só lugar**, em
`lib/autorizacao`, e é consultada tanto pela interface quanto pelas ações de
servidor. Autorização espalhada por componente é como um painel de publicação
vaza permissão.

### Cache

Páginas públicas geradas estaticamente e revalidadas sob demanda quando uma
publicação muda de status. Um mural é lido muito mais do que escrito.

---

## 14. Testes

Desenvolvimento guiado por teste: o teste que falha vem antes do código.

**Unitários (Vitest)** — cálculo de "faltam N dias" e seus limiares; regra de
expiração; ordenação do mural; validação por tipo em Zod; matriz de
autorização por papel.

**Integração** — queries de busca com combinação de filtros, incluindo o caso
de resultado zero; transições de status e seu registro.

**Ponta a ponta (Playwright)** — Colaborador cria e a publicação entra na fila;
Editor devolve com comentário e o autor vê o motivo; Editor publica e o item
aparece no mural; busca com filtro combinado; estado vazio oferece a saída
correta; publicação vencida some da listagem e continua acessível pela URL.

**Acessibilidade** — axe-core nas rotas principais, no pipeline. Verificação
manual de teclado nos fluxos do painel.

---

## 15. Fases de entrega

| Fase | Entrega | Encerra quando |
|---|---|---|
| 1 | Modelo de dados, migrações e seed com conteúdo realista | O banco sobe do zero com dados de exemplo |
| 2 | Mural público em desktop: home, listagens por tipo, página da publicação | Um leitor navega por tudo sem login |
| 3 | Busca, filtros, estado vazio e expiração | Filtro combinado funciona e vencido some sozinho |
| 4 | Autenticação e autorização por papel | Os três papéis entram e enxergam o que devem |
| 5 | Painel: formulário, fila, aprovação, upload | Um Colaborador publica passando por revisão |
| 6 | Gestão de usuários, setores e cursos | Administrador opera sem tocar no banco |
| 7 | Auditoria de acessibilidade e ajuste de contraste | axe sem violação nas rotas principais |
| 8 | **Responsividade e celular** | A partir do desktop final, conforme decisão do cliente |
| 9 | Interações e micro-animações | Retomar as opções discutidas e adiadas |

Fases 1 a 7 entregam um sistema completo em desktop. A 8 e a 9 são o
refinamento acordado para depois.

---

## 16. Premissas e pendências

Itens que assumi para poder avançar, e que precisam de confirmação.

1. **Cursos da unidade.** Usei Análise e Desenvolvimento de Sistemas, Gestão
   Empresarial e Segurança da Informação. **Não verifiquei** quais cursos a
   Fatec Campinas realmente oferece. A lista é dado de banco, não código, mas
   precisa estar certa antes da entrega.
2. **Cores.** Amostradas de PNG, não de manual de marca. Ver seção 9.
3. **Logo.** O cabeçalho reproduz a lógica de duas cores em tipo. Substituir
   pelo arquivo vetorial oficial quando disponível.
4. **Fotografia.** Os exemplos usam imagens de banco. Um mural institucional
   precisa de fotos reais do campus, e alguém precisa produzi-las ou
   autorizá-las.
5. **Nomes de pessoas** nos exemplos são fictícios. Publicar nome e foto de
   aluno real exige autorização, o que é uma questão de LGPD a resolver antes
   da primeira notícia de verdade.
6. **Hospedagem e domínio** não foram definidos. A stack roda na camada
   gratuita da Vercel com Supabase, e migra para servidor próprio depois.
7. **Setores.** Usei Secretaria Acadêmica, Direção, Coordenação de ADS,
   Coordenação de Gestão, Centro Acadêmico e Monitoria de ADS. Como a lista de
   cursos, é dado de banco e precisa ser confirmado com a unidade.

---

## Anexo — histórico do design visual

O caminho até a direção final, registrado porque as rejeições explicam as
escolhas.

1. **Cards com dominante por tipo.** Aprovados evento e prazo; aviso e notícia
   rejeitados. O aviso sumia no feed sendo o conteúdo mais oficial; a notícia
   parecia card de blog.
2. **Duas skills de design em paralelo.** Uma versão editorial sóbria e uma
   versão assimétrica com micro-animação perpétua. Escolhida a segunda.
3. **Rejeição da direção 2.** Ficou com cara de produto SaaS: cantos de
   2.5rem, sombra difusa, avatar com iniciais. Não conversava com o tema.
4. **Análise de harvard.edu, cam.ac.uk e stanford.edu.** Verificado que o
   Stanford usa serifada variável de display e que o Cambridge usa Open Sans.
   O padrão comum é fotografia como material principal, navegação de portal,
   retângulos e datas por extenso.
5. **Portal institucional.** Direção aceita.
6. **Correção de paleta.** A amostragem do logo revelou que a cor dominante da
   Fatec é ardósia, e não vermelha. A paleta anterior estava mais perto do
   crimson de Harvard do que da própria instituição.
7. **Tipografia.** Comparadas Spectral + Public Sans, Alegreya + Alegreya Sans
   e Archivo + Archivo Narrow. Escolhida a terceira.
8. **Regra do hover.** Nenhuma informação pode existir só no hover.
9. **Painel de publicação.** Fila de trabalho, formulário e gestão de usuários
   validados em 7 de setembro, com o formulário revisado no estado de erro e
   não no estado feliz.
