# Mural da Fatec Campinas

Mural público da Fatec Campinas: avisos e comunicados oficiais, eventos do
campus, prazos acadêmicos e notícias da comunidade, num lugar só, legíveis sem
login e com URL própria para cada publicação.

Next.js (App Router) + Drizzle ORM + Postgres.

## Rodar em desenvolvimento

```bash
npm install
npm run dev
```

Abra <http://localhost:3000>.

**Não precisa instalar Postgres para desenvolver.** Sem `DATABASE_URL` (ou com
ela ainda no valor de exemplo), o mural sobe um Postgres em memória — PGlite —,
aplica as migrações e semeia o banco sozinho, com um aviso alto no console. Os
dados somem quando o servidor reinicia: cada `npm run dev` começa do seed de
novo.

> **O conteúdo de exemplo é fictício.** Os comunicados, os editais, os eventos
> e **os nomes de pessoas** que aparecem nesse modo foram inventados para
> desenvolvimento. Nenhum deles é comunicado real da faculdade nem nome de
> aluno real.

Para trabalhar contra um Postgres de verdade, copie `.env.example` para
`.env.local` e preencha a `DATABASE_URL`:

```bash
cp .env.example .env.local
npm run db:push   # aplica o schema
npm run db:seed   # popula com o conteúdo de exemplo
```

## Testes

```bash
npm test           # unidade e integração (vitest); a integração sobe PGlite
npm run test:e2e   # ponta a ponta (playwright); sobe o npm run dev sozinho
```

Também vale checar `npx tsc --noEmit` e `npx eslint src --max-warnings=0` — a
saída do lint é mantida em zero warning de propósito, para continuar valendo a
pena ler.

## Build e deploy

```bash
npm run build
```

**A build exige uma `DATABASE_URL` de verdade, e isso é de propósito.** Sem
ela, `npm run build` falha com uma mensagem dizendo o que fazer, em vez de
completar.

O motivo: as páginas do mural são estáticas com revalidação (`revalidate =
300`), então é a build que gera o HTML que o público vai ler. Se a build
subisse o banco em memória, ela assaria o conteúdo de exemplo — comunicados
inventados e nomes de alunos fictícios — dentro do HTML de um mural
institucional, e o único sinal seria um aviso perdido no log. Uma build que
falha alto é barata; um mural no ar anunciando um comunicado que ninguém
publicou não é.

Por isso não existe variável de ambiente para contornar a trava: uma
escapatória oficial acabaria ligada por engano num deploy, que é exatamente o
acidente que ela existe para impedir. Se você precisar mesmo gerar um build
local sem Postgres, comente a checagem em `src/lib/db/client.ts` na sua cópia —
deliberado e visível, em vez de silencioso.

Em produção (Vercel), defina `DATABASE_URL` nas variáveis de ambiente do
projeto antes do primeiro deploy.

## Onde as coisas estão

```
src/app            rotas (home, /avisos, /eventos, /prazos, /comunidade,
                   /buscar, /p/[slug])
src/components     componentes de layout, do mural e da busca
src/lib/db         schema, cliente, migrações e seed
src/lib/publicacoes  regras do mural: vigência, ordenação, seções, validação
src/lib/busca      filtros e consulta da busca
tests/unidade      testes de unidade (vitest + testing-library)
tests/integracao   testes contra um Postgres real em memória
tests/e2e          testes de ponta a ponta (playwright)
docs               spec e documentação de projeto
```
