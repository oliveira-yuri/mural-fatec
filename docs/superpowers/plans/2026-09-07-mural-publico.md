# Mural Público da Fatec Campinas — Plano de Implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Entregar o mural público em desktop — leitura, listagens por tipo, página da publicação, busca e filtros — com dados reais em PostgreSQL e expiração automática de conteúdo.

**Architecture:** Next.js App Router com Server Components por padrão; o cliente só entra onde há interação real (barra de filtros). Uma entidade `publicacao` com discriminador de tipo, para que mural e busca sejam uma query só. Regras de exibição (contagem de prazo, vigência, ordenação) são funções puras testadas isoladamente, sem tocar em banco nem em React.

**Tech Stack:** Next.js 15 (App Router), TypeScript strict, PostgreSQL, Drizzle ORM, Zod, CSS Modules com tokens em custom properties, next/font, date-fns + date-fns-tz, react-markdown, Vitest, PGlite (Postgres em WASM para testes de integração), Playwright.

**Spec:** `docs/superpowers/specs/2026-09-07-mural-fatec-campinas-design.md`

**Escopo deste plano:** fases 1 a 3 da seção 15 da spec. Autenticação e painel de publicação ficam para o Plano 2; acessibilidade auditada, responsividade e interações para o Plano 3.

---

## Global Constraints

Requisitos que valem para **todas** as tarefas. Valores copiados da spec.

**Paleta** (seção 9 da spec) — definida uma única vez como custom properties, nunca repetida em hex dentro de componente:

| Token | Hex |
|---|---|
| `--ardosia` | `#475D68` |
| `--ardosia-escura` | `#33454E` |
| `--tijolo` | `#B22D30` |
| `--tijolo-escuro` | `#8E2326` |
| `--tinta` | `#1E272C` |
| `--cinza` | `#5A6A72` |
| `--regra` | `#D5DBDE` |
| `--lavado` | `#F2F4F5` |
| `--papel` | `#FFFFFF` |

**Tipografia** — Archivo para títulos, navegação, botões e rótulos; Archivo Narrow para listas densas (datas, resumos de linha, metadados, rodapé). Carregadas por `next/font/google`, nunca por `<link>` ou `@import`.

**Forma** — botões, campos e fichas com raio 7px; imagens 9px; selos e indicadores 4 a 6px; seções, filetes, listas e tabelas **sem raio**. Sem sombra de elevação.

**Navegação interna usa `<Link>` do `next/link`.** `<a>` fica só para link externo,
âncora e placeholder (`href="#"`). O `<Link>` renderiza um `<a href>` no HTML, então
continua funcionando com JavaScript desligado — a navegação instantânea é ganho puro, sem
perda. É também o que o `@next/next/no-html-link-for-pages` cobra, e manter o lint limpo é o
que faz ele proteger os links seguintes.

**Nenhum hex dentro de CSS Module.** Branco é `var(--papel)`, não `#fff`. O teste da
Tarefa 1 trava a paleta lendo apenas o `globals.css`; um hex escrito num componente escapa
dele e é como uma paleta começa a divergir. Variações com transparência
(`rgba(255,255,255,.72)`) são permitidas, porque não existem como token.

**Regra do hover** — nenhuma informação pode existir só no hover. Todo texto, data, autor e rótulo é legível com a página parada. Nesta fase o hover só muda cor de título.

**Nada é apagado** — expiração é condição de consulta (`expira_em > agora()`), nunca `DELETE`. Publicação vencida sai da listagem e continua acessível por URL.

**Texto alternativo** — se `imagem_url` existe, `imagem_alt` é obrigatório. Validado no schema Zod, não por convenção.

**Datas por extenso** no texto visível ("quarta-feira, 23 de setembro"), sempre com o formato de máquina em `<time datetime="...">`.

**Fuso horário** — `America/Sao_Paulo` para toda conta de dias. O servidor pode rodar em UTC; nenhuma diferença de data pode depender disso.

**Medida de linha** — máximo 72 caracteres em corpo de texto.

**Acessibilidade** — HTML semântico, hierarquia de títulos sem pular nível, foco visível de 2px em `--tijolo`, cor nunca é o único portador de informação.

**Desktop primeiro** — não escrever media queries de celular neste plano. A responsividade é desenhada a partir da versão desktop final, no Plano 3.

**TypeScript strict** — `strict: true`, sem `any`, sem `@ts-ignore`.

---

## Estrutura de arquivos

Cada arquivo com uma responsabilidade. Regras de negócio ficam fora de componente; componente não conhece banco.

```
mural-fatec/
├── package.json
├── tsconfig.json
├── next.config.ts
├── drizzle.config.ts
├── vitest.config.ts
├── playwright.config.ts
├── .env.example
├── src/
│   ├── app/
│   │   ├── layout.tsx                    casca: fontes, cabeçalho, rodapé
│   │   ├── globals.css                   tokens, reset, tipografia base
│   │   ├── page.tsx                      home do mural
│   │   ├── buscar/page.tsx               busca com filtros
│   │   ├── (tipos)/avisos/page.tsx       listagem por tipo
│   │   ├── (tipos)/eventos/page.tsx
│   │   ├── (tipos)/prazos/page.tsx
│   │   ├── (tipos)/comunidade/page.tsx
│   │   └── p/[slug]/page.tsx             página da publicação
│   ├── lib/
│   │   ├── db/
│   │   │   ├── schema.ts                 tabelas e enums Drizzle
│   │   │   ├── client.ts                 conexão
│   │   │   └── seed.ts                   conteúdo de exemplo
│   │   ├── publicacoes/
│   │   │   ├── tipos.ts                  tipos TS derivados do schema
│   │   │   ├── validacao.ts              Zod discriminado por tipo
│   │   │   ├── exibicao.ts               diasAte, estadoDoPrazo, estaVigente
│   │   │   ├── ordenacao.ts              ordenarMural
│   │   │   └── consultas.ts              listagem e busca por slug
│   │   ├── busca/
│   │   │   ├── filtros.ts                URL <-> filtros
│   │   │   └── consulta.ts               query com filtros e full-text
│   │   └── formato/
│   │       └── datas.ts                  formatação pt-BR
│   └── components/
│       ├── layout/
│       │   ├── BarraServicos.tsx
│       │   ├── Cabecalho.tsx
│       │   ├── Navegacao.tsx
│       │   └── Rodape.tsx
│       ├── mural/
│       │   ├── Hero.tsx
│       │   ├── LinhaAviso.tsx
│       │   ├── CardEvento.tsx
│       │   ├── LinhaPrazo.tsx
│       │   ├── NotaComunidade.tsx
│       │   └── TituloSecao.tsx
│       └── busca/
│           ├── BarraFiltros.tsx           'use client'
│           ├── FichasAtivas.tsx
│           └── EstadoVazio.tsx
└── tests/
    ├── unidade/
    ├── integracao/
    └── e2e/
```

**Por que PGlite nos testes de integração:** é o PostgreSQL real compilado para WASM, então `to_tsvector('portuguese', ...)` funciona igual à produção, sem exigir Docker de quem for rodar o projeto. Testes de integração sobem um banco em memória, aplicam as migrações e derrubam ao final.

---

### Task 1: Fundação do projeto

Cria o projeto, os tokens de design, as fontes e o arranjo de testes. Ao final, `npm run dev` mostra uma página usando a paleta e a tipografia corretas, e `npm test` roda.

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `vitest.config.ts`
- Create: `src/app/layout.tsx`, `src/app/globals.css`, `src/app/page.tsx`
- Test: `tests/unidade/fundacao.test.ts`

**Interfaces:**
- Consumes: nada
- Produces: `src/app/globals.css` expondo as custom properties da paleta; `fonteArchivo` e `fonteArchivoNarrow` exportados de `src/app/layout.tsx` como variáveis CSS `--fonte-archivo` e `--fonte-archivo-narrow`

- [ ] **Step 1: Criar o projeto Next.js**

```bash
npx create-next-app@latest . --typescript --app --no-tailwind --src-dir --import-alias "@/*" --eslint --use-npm
```

Responder **não** para Turbopack se perguntado. O comando reclama de diretório não vazio: confirmar sobrescrita, os arquivos existentes (`docs/`, `.gitignore`, `.claude/`) são preservados.

- [ ] **Step 2: Instalar as dependências**

Com `--src-dir`, o create-next-app já cria `src/app` e mapeia `"@/*": ["./src/*"]` no tsconfig. Conferir esse mapeamento antes de seguir: sem ele, todo import `@/lib/...` quebra.

```bash
npm install drizzle-orm postgres zod date-fns date-fns-tz react-markdown remark-gfm
npm install -D drizzle-kit vitest @vitejs/plugin-react vite-tsconfig-paths @testing-library/react @testing-library/jest-dom jsdom @electric-sql/pglite dotenv tsx
```

- [ ] **Step 3: Escrever o teste que falha**

Este teste guarda a constraint global da paleta: se alguém trocar um hex, o teste acusa.

```ts
// tests/unidade/fundacao.test.ts
import { readFileSync } from 'node:fs'
import { describe, it, expect } from 'vitest'

const css = readFileSync('src/app/globals.css', 'utf8')

describe('tokens de design', () => {
  it.each([
    ['--ardosia', '#475D68'],
    ['--ardosia-escura', '#33454E'],
    ['--tijolo', '#B22D30'],
    ['--tijolo-escuro', '#8E2326'],
    ['--tinta', '#1E272C'],
    ['--cinza', '#5A6A72'],
    ['--regra', '#D5DBDE'],
    ['--lavado', '#F2F4F5'],
    ['--papel', '#FFFFFF'],
  ])('define %s como %s', (token, hex) => {
    expect(css).toContain(`${token}: ${hex}`)
  })

  it('não usa sombra de elevação', () => {
    expect(css).not.toMatch(/box-shadow:\s*(?!none)/)
  })
})
```

- [ ] **Step 4: Configurar o Vitest**

```ts
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['tests/unidade/**/*.test.ts?(x)', 'tests/integracao/**/*.test.ts'],
  },
})
```

Adicionar ao `package.json`:

```json
"scripts": {
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "test": "vitest run",
  "test:watch": "vitest"
}
```

- [ ] **Step 5: Rodar o teste e confirmar que falha**

Run: `npm test`
Expected: FAIL — `globals.css` ainda tem o conteúdo padrão do create-next-app, sem os tokens.

- [ ] **Step 6: Escrever os tokens e o reset**

```css
/* src/app/globals.css */
:root {
  --ardosia: #475D68;
  --ardosia-escura: #33454E;
  --tijolo: #B22D30;
  --tijolo-escuro: #8E2326;
  --tinta: #1E272C;
  --cinza: #5A6A72;
  --regra: #D5DBDE;
  --lavado: #F2F4F5;
  --papel: #FFFFFF;

  --raio-controle: 7px;
  --raio-imagem: 9px;
  --raio-selo: 4px;

  --largura-pagina: 1150px;
  --medida-texto: 72ch;
}

*, *::before, *::after { box-sizing: border-box; }

html { -webkit-text-size-adjust: 100%; }

body {
  margin: 0;
  background: var(--papel);
  color: var(--tinta);
  font-family: var(--fonte-archivo), system-ui, sans-serif;
  font-size: 16px;
  line-height: 1.5;
}

img { max-width: 100%; display: block; }

a { color: inherit; text-decoration: none; }

a:focus-visible,
button:focus-visible,
input:focus-visible,
select:focus-visible {
  outline: 2px solid var(--tijolo);
  outline-offset: 2px;
}

.pagina {
  max-width: var(--largura-pagina);
  margin: 0 auto;
  padding: 0 30px;
}

.narrow { font-family: var(--fonte-archivo-narrow), system-ui, sans-serif; }

.pular-para-conteudo {
  position: absolute;
  left: -9999px;
}
.pular-para-conteudo:focus {
  left: 8px;
  top: 8px;
  z-index: 10;
  background: var(--papel);
  padding: 10px 14px;
  border: 2px solid var(--tijolo);
  border-radius: var(--raio-controle);
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

- [ ] **Step 7: Escrever o layout com as fontes**

```tsx
// src/app/layout.tsx
import type { Metadata } from 'next'
import { Archivo, Archivo_Narrow } from 'next/font/google'
import './globals.css'

const fonteArchivo = Archivo({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--fonte-archivo',
  display: 'swap',
})

const fonteArchivoNarrow = Archivo_Narrow({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--fonte-archivo-narrow',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Mural da Fatec Campinas',
  description: 'Avisos, eventos e prazos da Fatec Campinas.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${fonteArchivo.variable} ${fonteArchivoNarrow.variable}`}>
      <body>
        <a className="pular-para-conteudo" href="#conteudo">Pular para o conteúdo</a>
        {children}
      </body>
    </html>
  )
}
```

- [ ] **Step 8: Substituir a home padrão por um marcador**

```tsx
// src/app/page.tsx
export default function Home() {
  return (
    <main id="conteudo" className="pagina">
      <h1>Mural da Fatec Campinas</h1>
    </main>
  )
}
```

Apagar `src/app/page.module.css` se o create-next-app tiver gerado.

- [ ] **Step 9: Rodar os testes e confirmar que passam**

Run: `npm test`
Expected: PASS — 10 testes.

- [ ] **Step 10: Confirmar que o servidor sobe**

Run: `npm run dev`
Expected: `http://localhost:3000` responde com o título, em Archivo, sem erro no console.

- [ ] **Step 11: Commit**

```bash
git add -A
git commit -m "feat: fundação do projeto com tokens de design e fontes

Next.js com App Router, TypeScript strict e Vitest. Paleta amostrada do
logo da Fatec como custom properties, travada por teste para que um hex
trocado por engano não passe despercebido.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 2: Formatação de datas em pt-BR

O mural escreve data por extenso em todo lugar. Centralizar aqui evita que cada componente invente o seu formato.

**Files:**
- Create: `src/lib/formato/datas.ts`
- Test: `tests/unidade/datas.test.ts`

**Interfaces:**
- Consumes: nada
- Produces:
  - `formatarDataExtenso(d: Date): string` → `"quarta-feira, 23 de setembro"`
  - `formatarDataCurta(d: Date): string` → `"4 de setembro"`
  - `formatarDataCompleta(d: Date): string` → `"2 de setembro de 2026"`
  - `formatarHorario(inicio: Date, fim?: Date | null): string` → `"19h30 às 21h"`
  - `paraAtributoDatetime(d: Date): string` → `"2026-09-23"`
  - `FUSO: 'America/Sao_Paulo'`

- [ ] **Step 1: Escrever o teste que falha**

```ts
// tests/unidade/datas.test.ts
import { describe, it, expect } from 'vitest'
import {
  formatarDataExtenso,
  formatarDataCurta,
  formatarDataCompleta,
  formatarHorario,
  paraAtributoDatetime,
} from '@/lib/formato/datas'

// 23/09/2026 19h30 em São Paulo (UTC-3) = 22h30 UTC
const evento = new Date('2026-09-23T22:30:00Z')
const fimEvento = new Date('2026-09-24T00:00:00Z') // 21h00 em São Paulo

describe('formatarDataExtenso', () => {
  it('escreve dia da semana, dia e mês', () => {
    expect(formatarDataExtenso(evento)).toBe('quarta-feira, 23 de setembro')
  })
})

describe('formatarDataCurta', () => {
  it('escreve dia e mês', () => {
    expect(formatarDataCurta(new Date('2026-09-04T15:00:00Z'))).toBe('4 de setembro')
  })
})

describe('formatarDataCompleta', () => {
  it('inclui o ano', () => {
    expect(formatarDataCompleta(new Date('2026-09-02T15:00:00Z'))).toBe('2 de setembro de 2026')
  })
})

describe('formatarHorario', () => {
  it('usa "às" quando há fim', () => {
    expect(formatarHorario(evento, fimEvento)).toBe('19h30 às 21h')
  })

  it('omite minutos redondos', () => {
    expect(formatarHorario(fimEvento)).toBe('21h')
  })

  it('funciona sem hora de fim', () => {
    expect(formatarHorario(evento)).toBe('19h30')
  })
})

describe('paraAtributoDatetime', () => {
  it('devolve a data no fuso de São Paulo, não em UTC', () => {
    // 00h30 UTC do dia 24 ainda é dia 23 em São Paulo
    expect(paraAtributoDatetime(new Date('2026-09-24T00:30:00Z'))).toBe('2026-09-23')
  })
})
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `npx vitest run tests/unidade/datas.test.ts`
Expected: FAIL — `Failed to resolve import "@/lib/formato/datas"`.

- [ ] **Step 3: Implementar**

```ts
// src/lib/formato/datas.ts
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { toZonedTime } from 'date-fns-tz'

export const FUSO = 'America/Sao_Paulo'

function noFuso(d: Date): Date {
  return toZonedTime(d, FUSO)
}

export function formatarDataExtenso(d: Date): string {
  return format(noFuso(d), "EEEE, d 'de' MMMM", { locale: ptBR })
}

export function formatarDataCurta(d: Date): string {
  return format(noFuso(d), "d 'de' MMMM", { locale: ptBR })
}

export function formatarDataCompleta(d: Date): string {
  return format(noFuso(d), "d 'de' MMMM 'de' yyyy", { locale: ptBR })
}

function hora(d: Date): string {
  const z = noFuso(d)
  const h = format(z, 'H')
  const m = format(z, 'mm')
  return m === '00' ? `${h}h` : `${h}h${m}`
}

export function formatarHorario(inicio: Date, fim?: Date | null): string {
  return fim ? `${hora(inicio)} às ${hora(fim)}` : hora(inicio)
}

export function paraAtributoDatetime(d: Date): string {
  return format(noFuso(d), 'yyyy-MM-dd')
}
```

- [ ] **Step 4: Rodar e confirmar que passa**

Run: `npx vitest run tests/unidade/datas.test.ts`
Expected: PASS — 7 testes.

- [ ] **Step 5: Commit**

```bash
git add src/lib/formato/datas.ts tests/unidade/datas.test.ts
git commit -m "feat: formatação de datas em português com fuso de São Paulo

Toda conta de data passa por America/Sao_Paulo. O teste do atributo
datetime cobre o caso que quebraria em produção: 00h30 UTC do dia 24
ainda é dia 23 no Brasil, e o servidor roda em UTC.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 3: Regras de exibição

Funções puras: quanto falta para um prazo, em que estado ele está, e se uma publicação ainda pertence ao mural. Sem banco, sem React.

**Files:**
- Create: `src/lib/publicacoes/exibicao.ts`
- Test: `tests/unidade/exibicao.test.ts`

**Interfaces:**
- Consumes: `FUSO` de `@/lib/formato/datas`
- Produces:
  - `diasAte(alvo: Date, agora: Date): number` — diferença em dias de calendário no fuso de São Paulo; negativo se já passou
  - `type EstadoPrazo = 'vencido' | 'apertado' | 'normal'`
  - `estadoDoPrazo(prazoFinal: Date, agora: Date): EstadoPrazo` — `apertado` quando faltam 7 dias ou menos
  - `rotuloContagem(prazoFinal: Date, agora: Date): string` — `"Faltam 4 dias"`, `"Falta 1 dia"`, `"Termina hoje"`, `"Encerrado"`
  - `estaVigente(p: { status: string; expiraEm: Date }, agora: Date): boolean`

- [ ] **Step 1: Escrever o teste que falha**

```ts
// tests/unidade/exibicao.test.ts
import { describe, it, expect } from 'vitest'
import { diasAte, estadoDoPrazo, rotuloContagem, estaVigente } from '@/lib/publicacoes/exibicao'

const agora = new Date('2026-09-08T12:00:00Z') // 8 de setembro, 9h em São Paulo

describe('diasAte', () => {
  it('conta dias de calendário, não períodos de 24 horas', () => {
    // 12/09 às 23h59 em São Paulo = 13/09 02h59 UTC
    expect(diasAte(new Date('2026-09-13T02:59:00Z'), agora)).toBe(4)
  })

  it('devolve 0 no mesmo dia, mesmo faltando poucas horas', () => {
    expect(diasAte(new Date('2026-09-08T23:00:00Z'), agora)).toBe(0)
  })

  it('devolve negativo para data passada', () => {
    expect(diasAte(new Date('2026-09-05T12:00:00Z'), agora)).toBe(-3)
  })
})

describe('estadoDoPrazo', () => {
  it('marca como apertado quando faltam 7 dias ou menos', () => {
    expect(estadoDoPrazo(new Date('2026-09-15T12:00:00Z'), agora)).toBe('apertado')
  })

  it('marca como normal quando faltam mais de 7 dias', () => {
    expect(estadoDoPrazo(new Date('2026-09-16T12:00:00Z'), agora)).toBe('normal')
  })

  it('marca como vencido depois da data', () => {
    expect(estadoDoPrazo(new Date('2026-09-07T12:00:00Z'), agora)).toBe('vencido')
  })
})

describe('rotuloContagem', () => {
  it('usa plural', () => {
    expect(rotuloContagem(new Date('2026-09-12T12:00:00Z'), agora)).toBe('Faltam 4 dias')
  })

  it('usa singular com um dia', () => {
    expect(rotuloContagem(new Date('2026-09-09T12:00:00Z'), agora)).toBe('Falta 1 dia')
  })

  it('avisa quando termina hoje', () => {
    expect(rotuloContagem(new Date('2026-09-08T23:00:00Z'), agora)).toBe('Termina hoje')
  })

  it('avisa quando encerrou', () => {
    expect(rotuloContagem(new Date('2026-09-01T12:00:00Z'), agora)).toBe('Encerrado')
  })
})

describe('estaVigente', () => {
  it('aceita publicada e dentro da validade', () => {
    const p = { status: 'publicado', expiraEm: new Date('2026-10-01T12:00:00Z') }
    expect(estaVigente(p, agora)).toBe(true)
  })

  it('recusa publicada e vencida', () => {
    const p = { status: 'publicado', expiraEm: new Date('2026-09-01T12:00:00Z') }
    expect(estaVigente(p, agora)).toBe(false)
  })

  it('recusa rascunho dentro da validade', () => {
    const p = { status: 'rascunho', expiraEm: new Date('2026-10-01T12:00:00Z') }
    expect(estaVigente(p, agora)).toBe(false)
  })
})
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `npx vitest run tests/unidade/exibicao.test.ts`
Expected: FAIL — módulo não encontrado.

- [ ] **Step 3: Implementar**

```ts
// src/lib/publicacoes/exibicao.ts
import { differenceInCalendarDays } from 'date-fns'
import { toZonedTime } from 'date-fns-tz'
import { FUSO } from '@/lib/formato/datas'

export type EstadoPrazo = 'vencido' | 'apertado' | 'normal'

const LIMITE_APERTADO = 7

export function diasAte(alvo: Date, agora: Date): number {
  return differenceInCalendarDays(toZonedTime(alvo, FUSO), toZonedTime(agora, FUSO))
}

export function estadoDoPrazo(prazoFinal: Date, agora: Date): EstadoPrazo {
  const dias = diasAte(prazoFinal, agora)
  if (dias < 0) return 'vencido'
  if (dias <= LIMITE_APERTADO) return 'apertado'
  return 'normal'
}

export function rotuloContagem(prazoFinal: Date, agora: Date): string {
  const dias = diasAte(prazoFinal, agora)
  if (dias < 0) return 'Encerrado'
  if (dias === 0) return 'Termina hoje'
  if (dias === 1) return 'Falta 1 dia'
  return `Faltam ${dias} dias`
}

export function estaVigente(
  p: { status: string; expiraEm: Date },
  agora: Date,
): boolean {
  return p.status === 'publicado' && p.expiraEm.getTime() > agora.getTime()
}
```

- [ ] **Step 4: Rodar e confirmar que passa**

Run: `npx vitest run tests/unidade/exibicao.test.ts`
Expected: PASS — 13 testes.

- [ ] **Step 5: Commit**

```bash
git add src/lib/publicacoes/exibicao.ts tests/unidade/exibicao.test.ts
git commit -m "feat: regras de exibição de prazo e vigência

Contagem por dias de calendário, não por períodos de 24 horas: um prazo
que vence às 23h59 de sexta mostra 'Faltam 4 dias' na segunda inteira,
e não muda de número no meio da tarde.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 4: Ordenação do mural

O mural não ordena por data de publicação pura. Um prazo que vence amanhã importa mais que uma notícia publicada hoje de manhã. É a regra da seção 6 da spec, isolada numa função pura.

**Files:**
- Create: `src/lib/publicacoes/ordenacao.ts`
- Test: `tests/unidade/ordenacao.test.ts`

**Interfaces:**
- Consumes: `diasAte` de `@/lib/publicacoes/exibicao`
- Produces:
  - `type ItemOrdenavel = { tipo: string; destaque: boolean; publicadoEm: Date; prazoFinal?: Date | null; urgencia?: string | null }`
  - `ordenarMural<T extends ItemOrdenavel>(itens: readonly T[], agora: Date): T[]` — devolve novo array, não muta a entrada

- [ ] **Step 1: Escrever o teste que falha**

```ts
// tests/unidade/ordenacao.test.ts
import { describe, it, expect } from 'vitest'
import { ordenarMural, type ItemOrdenavel } from '@/lib/publicacoes/ordenacao'

const agora = new Date('2026-09-08T12:00:00Z')

function item(id: string, campos: Partial<ItemOrdenavel> = {}): ItemOrdenavel & { id: string } {
  return {
    id,
    tipo: 'noticia',
    destaque: false,
    publicadoEm: new Date('2026-09-01T12:00:00Z'),
    prazoFinal: null,
    urgencia: null,
    ...campos,
  }
}

function ids(itens: { id: string }[]): string[] {
  return itens.map((i) => i.id)
}

describe('ordenarMural', () => {
  it('põe destaque acima de tudo', () => {
    const lista = [
      item('noticia-nova', { publicadoEm: new Date('2026-09-08T10:00:00Z') }),
      item('fixada', { destaque: true }),
    ]
    expect(ids(ordenarMural(lista, agora))).toEqual(['fixada', 'noticia-nova'])
  })

  it('põe prazo apertado acima de notícia recente', () => {
    const lista = [
      item('noticia-de-hoje', { publicadoEm: new Date('2026-09-08T10:00:00Z') }),
      item('prazo-perto', { tipo: 'prazo', prazoFinal: new Date('2026-09-12T12:00:00Z') }),
    ]
    expect(ids(ordenarMural(lista, agora))).toEqual(['prazo-perto', 'noticia-de-hoje'])
  })

  it('não privilegia prazo distante', () => {
    const lista = [
      item('noticia-de-hoje', { publicadoEm: new Date('2026-09-08T10:00:00Z') }),
      item('prazo-longe', { tipo: 'prazo', prazoFinal: new Date('2026-11-01T12:00:00Z') }),
    ]
    expect(ids(ordenarMural(lista, agora))).toEqual(['noticia-de-hoje', 'prazo-longe'])
  })

  it('põe aviso urgente recente acima do restante', () => {
    const lista = [
      item('noticia-de-hoje', { publicadoEm: new Date('2026-09-08T10:00:00Z') }),
      item('urgente', {
        tipo: 'aviso',
        urgencia: 'urgente',
        publicadoEm: new Date('2026-09-06T12:00:00Z'),
      }),
    ]
    expect(ids(ordenarMural(lista, agora))).toEqual(['urgente', 'noticia-de-hoje'])
  })

  it('deixa de privilegiar aviso urgente depois de 3 dias', () => {
    const lista = [
      item('noticia-de-hoje', { publicadoEm: new Date('2026-09-08T10:00:00Z') }),
      item('urgente-velho', {
        tipo: 'aviso',
        urgencia: 'urgente',
        publicadoEm: new Date('2026-09-01T12:00:00Z'),
      }),
    ]
    expect(ids(ordenarMural(lista, agora))).toEqual(['noticia-de-hoje', 'urgente-velho'])
  })

  it('desempata por data de publicação decrescente', () => {
    const lista = [
      item('antiga', { publicadoEm: new Date('2026-09-02T12:00:00Z') }),
      item('recente', { publicadoEm: new Date('2026-09-07T12:00:00Z') }),
    ]
    expect(ids(ordenarMural(lista, agora))).toEqual(['recente', 'antiga'])
  })

  it('desempata prazos apertados pelo que vence primeiro', () => {
    const lista = [
      item('vence-depois', { tipo: 'prazo', prazoFinal: new Date('2026-09-14T12:00:00Z') }),
      item('vence-antes', { tipo: 'prazo', prazoFinal: new Date('2026-09-10T12:00:00Z') }),
    ]
    expect(ids(ordenarMural(lista, agora))).toEqual(['vence-antes', 'vence-depois'])
  })

  it('não muta o array recebido', () => {
    const lista = [item('a'), item('b', { destaque: true })]
    const copia = [...lista]
    ordenarMural(lista, agora)
    expect(lista).toEqual(copia)
  })
})
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `npx vitest run tests/unidade/ordenacao.test.ts`
Expected: FAIL — módulo não encontrado.

- [ ] **Step 3: Implementar**

```ts
// src/lib/publicacoes/ordenacao.ts
import { diasAte } from '@/lib/publicacoes/exibicao'

export type ItemOrdenavel = {
  tipo: string
  destaque: boolean
  publicadoEm: Date
  prazoFinal?: Date | null
  urgencia?: string | null
}

const DIAS_PRAZO_APERTADO = 7
const DIAS_AVISO_QUENTE = 3

const FAIXA_DESTAQUE = 0
const FAIXA_PRAZO_APERTADO = 1
const FAIXA_AVISO_URGENTE = 2
const FAIXA_NORMAL = 3

function faixa(item: ItemOrdenavel, agora: Date): number {
  if (item.destaque) return FAIXA_DESTAQUE

  if (item.tipo === 'prazo' && item.prazoFinal) {
    const dias = diasAte(item.prazoFinal, agora)
    if (dias >= 0 && dias <= DIAS_PRAZO_APERTADO) return FAIXA_PRAZO_APERTADO
  }

  if (item.tipo === 'aviso' && item.urgencia === 'urgente') {
    const diasDesdePublicacao = -diasAte(item.publicadoEm, agora)
    if (diasDesdePublicacao <= DIAS_AVISO_QUENTE) return FAIXA_AVISO_URGENTE
  }

  return FAIXA_NORMAL
}

export function ordenarMural<T extends ItemOrdenavel>(itens: readonly T[], agora: Date): T[] {
  return [...itens].sort((a, b) => {
    const faixaA = faixa(a, agora)
    const faixaB = faixa(b, agora)
    if (faixaA !== faixaB) return faixaA - faixaB

    // Dentro da faixa de prazo apertado, vem primeiro quem termina antes.
    if (faixaA === FAIXA_PRAZO_APERTADO && a.prazoFinal && b.prazoFinal) {
      return a.prazoFinal.getTime() - b.prazoFinal.getTime()
    }

    return b.publicadoEm.getTime() - a.publicadoEm.getTime()
  })
}
```

- [ ] **Step 4: Rodar e confirmar que passa**

Run: `npx vitest run tests/unidade/ordenacao.test.ts`
Expected: PASS — 8 testes.

- [ ] **Step 5: Commit**

```bash
git add src/lib/publicacoes/ordenacao.ts tests/unidade/ordenacao.test.ts
git commit -m "feat: ordenacao do mural por relevancia temporal

Quatro faixas: destaque, prazo que vence em ate 7 dias, aviso urgente
dos ultimos 3 dias, e o resto por data. Um aviso urgente perde a
prioridade depois de tres dias; senao o mural fica permanentemente em
estado de alarme e ninguem mais enxerga o que e urgente de verdade.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 5: Schema do banco

Tabelas, enums, coluna de busca gerada e migração. A tabela `usuarios` entra agora porque `publicacoes.autor_id` aponta para ela; a autenticação em si é o Plano 2.

**Files:**
- Create: `src/lib/db/schema.ts`, `src/lib/db/client.ts`, `drizzle.config.ts`, `.env.example`
- Create: `drizzle/0000_inicial.sql` (gerada pelo drizzle-kit e complementada à mão)
- Test: `tests/integracao/ajuda/banco.ts`, `tests/integracao/schema.test.ts`

**Interfaces:**
- Consumes: nada
- Produces:
  - Tabelas `setores`, `cursos`, `usuarios`, `publicacoes`, `publicacoesCursos`
  - Enums `tipoPublicacao`, `statusPublicacao`, `urgenciaAviso`, `modalidadeEvento`, `papelUsuario`
  - `db` (conexão real) e `type Db` (genérico de driver) de `@/lib/db/client`
  - `criarBancoDeTeste(): Promise<{ db, cliente, encerrar }>` de `tests/integracao/ajuda/banco`

- [ ] **Step 1: Escrever o schema**

```ts
// src/lib/db/schema.ts
import {
  boolean, customType, index, integer, jsonb, pgEnum, pgTable,
  primaryKey, text, timestamp, uniqueIndex, uuid,
} from 'drizzle-orm/pg-core'

const tsvector = customType<{ data: string }>({
  dataType: () => 'tsvector',
})

export const tipoPublicacao = pgEnum('tipo_publicacao', ['aviso', 'evento', 'prazo', 'noticia'])
export const statusPublicacao = pgEnum('status_publicacao', ['rascunho', 'em_revisao', 'publicado', 'arquivado'])
export const urgenciaAviso = pgEnum('urgencia_aviso', ['informativo', 'importante', 'urgente'])
export const modalidadeEvento = pgEnum('modalidade_evento', ['presencial', 'online', 'hibrido'])
export const papelUsuario = pgEnum('papel_usuario', ['colaborador', 'editor', 'administrador'])

export const setores = pgTable('setores', {
  id: uuid('id').primaryKey().defaultRandom(),
  nome: text('nome').notNull(),
  slug: text('slug').notNull().unique(),
  ativo: boolean('ativo').notNull().default(true),
})

export const cursos = pgTable('cursos', {
  id: uuid('id').primaryKey().defaultRandom(),
  nome: text('nome').notNull(),
  sigla: text('sigla').notNull(),
  slug: text('slug').notNull().unique(),
  ativo: boolean('ativo').notNull().default(true),
})

export const usuarios = pgTable('usuarios', {
  id: uuid('id').primaryKey().defaultRandom(),
  nome: text('nome').notNull(),
  email: text('email').notNull().unique(),
  senhaHash: text('senha_hash').notNull(),
  papel: papelUsuario('papel').notNull().default('colaborador'),
  setorId: uuid('setor_id').notNull().references(() => setores.id),
  ativo: boolean('ativo').notNull().default(true),
  criadoEm: timestamp('criado_em', { withTimezone: true }).notNull().defaultNow(),
})

export const publicacoes = pgTable(
  'publicacoes',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    slug: text('slug').notNull(),
    tipo: tipoPublicacao('tipo').notNull(),

    titulo: text('titulo').notNull(),
    resumo: text('resumo').notNull(),
    corpo: text('corpo').notNull(),

    setorId: uuid('setor_id').notNull().references(() => setores.id),
    autorId: uuid('autor_id').notNull().references(() => usuarios.id),

    imagemUrl: text('imagem_url'),
    imagemAlt: text('imagem_alt'),
    creditoFoto: text('credito_foto'),
    anexos: jsonb('anexos').$type<{ url: string; nome: string; bytes: number; mime: string }[]>(),
    linkExterno: jsonb('link_externo').$type<{ url: string; rotulo: string } | null>(),

    destaque: boolean('destaque').notNull().default(false),
    status: statusPublicacao('status').notNull().default('rascunho'),
    publicadoEm: timestamp('publicado_em', { withTimezone: true }),
    expiraEm: timestamp('expira_em', { withTimezone: true }).notNull(),

    urgencia: urgenciaAviso('urgencia'),
    documentoNumero: text('documento_numero'),

    inicioEm: timestamp('inicio_em', { withTimezone: true }),
    fimEm: timestamp('fim_em', { withTimezone: true }),
    local: text('local'),
    modalidade: modalidadeEvento('modalidade'),
    linkInscricao: text('link_inscricao'),
    vagasRestantes: integer('vagas_restantes'),

    prazoFinal: timestamp('prazo_final', { withTimezone: true }),
    abreEm: timestamp('abre_em', { withTimezone: true }),
    linkAcao: jsonb('link_acao').$type<{ url: string; rotulo: string } | null>(),

    pessoasCitadas: text('pessoas_citadas'),

    buscaTsv: tsvector('busca_tsv'),

    criadoEm: timestamp('criado_em', { withTimezone: true }).notNull().defaultNow(),
    atualizadoEm: timestamp('atualizado_em', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('publicacoes_slug_idx').on(t.slug),
    index('publicacoes_mural_idx').on(t.status, t.expiraEm),
    index('publicacoes_busca_idx').using('gin', t.buscaTsv),
  ],
)

export const publicacoesCursos = pgTable(
  'publicacoes_cursos',
  {
    publicacaoId: uuid('publicacao_id').notNull().references(() => publicacoes.id, { onDelete: 'cascade' }),
    cursoId: uuid('curso_id').notNull().references(() => cursos.id, { onDelete: 'cascade' }),
  },
  (t) => [primaryKey({ columns: [t.publicacaoId, t.cursoId] })],
)
```

- [ ] **Step 2: Escrever o cliente e a configuração**

```ts
// src/lib/db/client.ts
import { drizzle } from 'drizzle-orm/postgres-js'
import type { PgDatabase, PgQueryResultHKT } from 'drizzle-orm/pg-core'
import postgres from 'postgres'
import * as schema from './schema'

const url = process.env.DATABASE_URL
if (!url) throw new Error('DATABASE_URL não definida. Copie .env.example para .env.local.')

const conexao = postgres(url, { prepare: false })

export const db = drizzle(conexao, { schema })

/**
 * Tipo do banco independente de driver. Toda consulta recebe este tipo para
 * que os testes passem uma instância PGlite e a aplicação passe a conexão
 * postgres-js, sem duas assinaturas paralelas.
 *
 * `typeof db` NÃO serve aqui: amarra a assinatura ao postgres-js e faz o
 * `tsc` recusar a instância PGlite dos testes de integração.
 *
 * Importe sempre como `import type { Db }`. Um import de tipo é apagado na
 * compilação e não executa este módulo, que lança se DATABASE_URL faltar —
 * o que quebraria os testes, que nunca precisam dessa variável.
 */
export type Db = PgDatabase<PgQueryResultHKT, typeof schema>
```

```ts
// drizzle.config.ts
import type { Config } from 'drizzle-kit'
import 'dotenv/config'

export default {
  schema: './src/lib/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: { url: process.env.DATABASE_URL! },
} satisfies Config
```

Criar `.env.example` com uma linha:

```
DATABASE_URL="postgresql://usuario:senha@host:5432/postgres"
```

Criar `.env.local` (não versionado) com a URL real do projeto Supabase.

- [ ] **Step 3: Gerar a migração**

```bash
npx drizzle-kit generate --name inicial
```

Expected: cria `drizzle/0000_inicial.sql`.

- [ ] **Step 4: Trocar a coluna de busca por uma coluna gerada**

O drizzle-kit cria `busca_tsv` como coluna comum, porque não sabe gerar `GENERATED ALWAYS AS` com `to_tsvector`. Abrir `drizzle/0000_inicial.sql`, apagar a linha `"busca_tsv" tsvector,` de dentro do `CREATE TABLE "publicacoes"` e inserir o bloco abaixo logo **depois** desse `CREATE TABLE` e **antes** do `CREATE INDEX "publicacoes_busca_idx"`:

```sql
ALTER TABLE "publicacoes" ADD COLUMN "busca_tsv" tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('portuguese', translate(coalesce("titulo", ''),
      'áàâãäéèêëíìîïóòôõöúùûüçÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇ',
      'aaaaaeeeeiiiiooooouuuucAAAAAEEEEIIIIOOOOOUUUUC')), 'A') ||
    setweight(to_tsvector('portuguese', translate(coalesce("resumo", ''),
      'áàâãäéèêëíìîïóòôõöúùûüçÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇ',
      'aaaaaeeeeiiiiooooouuuucAAAAAEEEEIIIIOOOOOUUUUC')), 'B') ||
    setweight(to_tsvector('portuguese', translate(coalesce("corpo", ''),
      'áàâãäéèêëíìîïóòôõöúùûüçÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇ',
      'aaaaaeeeeiiiiooooouuuucAAAAAEEEEIIIIOOOOOUUUUC')), 'C')
  ) STORED;
--> statement-breakpoint
```

O peso A no título faz o título valer mais que o corpo no ranking da busca.

**Por que o `translate`:** o dicionário `portuguese` do Postgres **preserva acentos** —
`to_tsvector('portuguese','calendário')` devolve `'calendári'`, e buscar `calendario` sem
acento não acha nada. Aluno brasileiro digita sem acento, então isso quebraria a busca no
uso principal dela. A extensão `unaccent` resolveria, mas não existe no PGlite e não é
`IMMUTABLE`, o que a proíbe dentro de coluna gerada. `translate` é `IMMUTABLE`, dispensa
extensão e se comporta igual no PGlite e no Supabase.

**O que continua sem casar:** o par `-ção`/`-ções`. `inscrições` não acha `inscrição`, nem
antes nem depois da dobra — limitação do stemmer Snowball, não regressão. Plurais normais
funcionam: `disciplinas` acha `disciplina`, `estágios` acha `estagio`.

- [ ] **Step 5: Escrever a ajuda de banco de teste**

```ts
// tests/integracao/ajuda/banco.ts
import { PGlite } from '@electric-sql/pglite'
import { drizzle } from 'drizzle-orm/pglite'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import * as schema from '@/lib/db/schema'

export async function criarBancoDeTeste() {
  const cliente = new PGlite()
  const db = drizzle(cliente, { schema })

  const pasta = 'drizzle'
  const migracoes = readdirSync(pasta).filter((f) => f.endsWith('.sql')).sort()

  for (const arquivo of migracoes) {
    const conteudo = readFileSync(join(pasta, arquivo), 'utf8')
    for (const comando of conteudo.split('--> statement-breakpoint')) {
      const limpo = comando.trim()
      if (limpo) await cliente.exec(limpo)
    }
  }

  return { db, cliente, encerrar: () => cliente.close() }
}
```

- [ ] **Step 6: Escrever o teste que falha**

```ts
// tests/integracao/schema.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { criarBancoDeTeste } from './ajuda/banco'
import { setores, usuarios, publicacoes } from '@/lib/db/schema'

let ctx: Awaited<ReturnType<typeof criarBancoDeTeste>>

beforeAll(async () => { ctx = await criarBancoDeTeste() })
afterAll(async () => { await ctx.encerrar() })

async function semear() {
  const [setor] = await ctx.db.insert(setores)
    .values({ nome: 'Secretaria Acadêmica', slug: 'secretaria-academica' })
    .returning()
  const [autor] = await ctx.db.insert(usuarios)
    .values({
      nome: 'Helena Vasconcelos',
      email: `helena-${Date.now()}@fatec.sp.gov.br`,
      senhaHash: 'nao-usado-neste-plano',
      papel: 'editor',
      setorId: setor.id,
    })
    .returning()
  return { setor, autor }
}

describe('schema', () => {
  it('grava e lê uma publicação com os padrões corretos', async () => {
    const { setor, autor } = await semear()
    await ctx.db.insert(publicacoes).values({
      slug: 'calendario-2o-semestre',
      tipo: 'aviso',
      titulo: 'Alteração no calendário acadêmico do 2º semestre',
      resumo: 'Início das aulas antecipado em uma semana.',
      corpo: 'As novas datas de provas estão no edital anexo.',
      setorId: setor.id,
      autorId: autor.id,
      status: 'publicado',
      urgencia: 'urgente',
      publicadoEm: new Date('2026-09-04T12:00:00Z'),
      expiraEm: new Date('2026-10-04T12:00:00Z'),
    })

    const linhas = await ctx.db.select().from(publicacoes)
    expect(linhas).toHaveLength(1)
    expect(linhas[0].titulo).toContain('calendário acadêmico')
    expect(linhas[0].destaque).toBe(false)
  })

  it('gera o vetor de busca em português, com o título em peso A', async () => {
    const resultado = await ctx.cliente.query<{ v: string }>(
      "select busca_tsv::text as v from publicacoes limit 1",
    )
    const vetor = resultado.rows[0].v
    // "acadêmico" entra sem acento e reduzido ao radical, marcado com peso A
    expect(vetor).toMatch(/academ/)
    expect(vetor).toMatch(/A/)
  })

  it('recusa slug duplicado', async () => {
    const { setor, autor } = await semear()
    await expect(
      ctx.db.insert(publicacoes).values({
        slug: 'calendario-2o-semestre',
        tipo: 'aviso',
        titulo: 'Outro aviso',
        resumo: 'Outro resumo',
        corpo: 'Outro corpo',
        setorId: setor.id,
        autorId: autor.id,
        expiraEm: new Date('2026-10-04T12:00:00Z'),
      }),
    ).rejects.toThrow()
  })
})
```

- [ ] **Step 7: Rodar até passar**

Run: `npx vitest run tests/integracao/schema.test.ts`

Se falhar com erro de sintaxe SQL, conferir se o Step 4 deixou algum `--> statement-breakpoint` desbalanceado. Se falhar dizendo que `busca_tsv` não existe, o bloco do Step 4 não foi inserido.

Expected ao final: PASS — 3 testes.

- [ ] **Step 8: Commit**

```bash
git add src/lib/db drizzle drizzle.config.ts .env.example tests/integracao vitest.config.ts
git commit -m "feat: schema do banco com busca full-text em portugues

Coluna busca_tsv gerada pelo proprio Postgres, com peso A no titulo e C
no corpo, mais indice GIN. Sem servico de busca externo.

Testes de integracao rodam em PGlite, o Postgres real compilado para
WASM: quem clonar o projeto roda a suite sem instalar Docker, e o
to_tsvector('portuguese') se comporta igual a producao.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 6: Slug e validação por tipo

O banco aceita quase tudo, porque as colunas específicas de tipo são opcionais. Quem garante que evento tem local e que imagem tem descrição é o Zod. Esta tarefa também entrega a geração de slug, usada pelo seed e, no Plano 2, pelo formulário.

**Files:**
- Create: `src/lib/publicacoes/slug.ts`, `src/lib/publicacoes/validacao.ts`
- Test: `tests/unidade/slug.test.ts`, `tests/unidade/validacao.test.ts`

**Interfaces:**
- Consumes: nada
- Produces:
  - `semAcento(texto: string): string` — tira acento preservando a letra
  - `gerarSlug(titulo: string): string`
  - `criarSchemaPublicacao(agora: Date)` — devolve o schema Zod; recebe `agora` para que a validação de data futura seja testável sem depender do relógio
  - `type EntradaPublicacao = z.infer<ReturnType<typeof criarSchemaPublicacao>>`

- [ ] **Step 1: Escrever o teste de slug que falha**

```ts
// tests/unidade/slug.test.ts
import { describe, it, expect } from 'vitest'
import { gerarSlug, semAcento } from '@/lib/publicacoes/slug'

describe('semAcento', () => {
  it('remove acento preservando a letra', () => {
    expect(semAcento('Alteração no calendário acadêmico'))
      .toBe('Alteracao no calendario academico')
  })

  it('não mexe em texto sem acento', () => {
    expect(semAcento('monitoria remunerada')).toBe('monitoria remunerada')
  })
})

describe('gerarSlug', () => {
  it('remove acentos e deixa em minúsculas', () => {
    expect(gerarSlug('Alteração no calendário acadêmico'))
      .toBe('alteracao-no-calendario-academico')
  })

  it('troca cedilha e pontuação por hífen', () => {
    expect(gerarSlug('Inscrição: monitoria 2026/2!')).toBe('inscricao-monitoria-2026-2')
  })

  it('não deixa hífen no começo nem no fim', () => {
    expect(gerarSlug('  — Feira de estágios —  ')).toBe('feira-de-estagios')
  })

  it('colapsa hifens repetidos', () => {
    expect(gerarSlug('TCC --- entrega final')).toBe('tcc-entrega-final')
  })

  it('preserva o ordinal como número', () => {
    expect(gerarSlug('Calendário do 2º semestre')).toBe('calendario-do-2-semestre')
  })
})
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `npx vitest run tests/unidade/slug.test.ts`
Expected: FAIL — módulo não encontrado.

- [ ] **Step 3: Implementar o slug**

```ts
// src/lib/publicacoes/slug.ts
/**
 * Remove acentos preservando a letra. A Tarefa 14 reusa isto para dobrar o
 * termo de busca do mesmo jeito que a coluna busca_tsv dobra o conteúdo — se
 * os dois lados não dobrarem igual, a busca não casa.
 */
export function semAcento(texto: string): string {
  return texto.normalize('NFD').replace(/[̀-ͯ]/g, '')
}

export function gerarSlug(titulo: string): string {
  return semAcento(titulo)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
```

- [ ] **Step 4: Rodar e confirmar que passa**

Run: `npx vitest run tests/unidade/slug.test.ts`
Expected: PASS — 5 testes.

- [ ] **Step 5: Escrever o teste de validação que falha**

```ts
// tests/unidade/validacao.test.ts
import { describe, it, expect } from 'vitest'
import { criarSchemaPublicacao } from '@/lib/publicacoes/validacao'

const agora = new Date('2026-09-08T12:00:00Z')
const schema = criarSchemaPublicacao(agora)

const SETOR = '11111111-1111-4111-8111-111111111111'

function aviso(extra: Record<string, unknown> = {}) {
  return {
    tipo: 'aviso',
    titulo: 'Alteração no calendário acadêmico do 2º semestre',
    resumo: 'Início das aulas antecipado em uma semana.',
    corpo: 'As novas datas estão no edital anexo.',
    setorId: SETOR,
    expiraEm: new Date('2026-10-08T12:00:00Z'),
    urgencia: 'urgente',
    ...extra,
  }
}

function evento(extra: Record<string, unknown> = {}) {
  return {
    tipo: 'evento',
    titulo: 'Semana de Tecnologia',
    resumo: 'Abertura da programação.',
    corpo: 'Mesa sobre inferência em dispositivos de borda.',
    setorId: SETOR,
    expiraEm: new Date('2026-10-08T12:00:00Z'),
    inicioEm: new Date('2026-09-23T22:30:00Z'),
    local: 'Auditório do Bloco B',
    modalidade: 'presencial',
    ...extra,
  }
}

describe('campos comuns', () => {
  it('aceita um aviso completo', () => {
    expect(schema.safeParse(aviso()).success).toBe(true)
  })

  it('recusa título acima de 140 caracteres', () => {
    const r = schema.safeParse(aviso({ titulo: 'a'.repeat(141) }))
    expect(r.success).toBe(false)
  })

  it('recusa resumo acima de 220 caracteres', () => {
    const r = schema.safeParse(aviso({ resumo: 'a'.repeat(221) }))
    expect(r.success).toBe(false)
  })

  it('recusa data de saída no passado', () => {
    const r = schema.safeParse(aviso({ expiraEm: new Date('2026-09-01T12:00:00Z') }))
    expect(r.success).toBe(false)
  })
})

describe('texto alternativo', () => {
  it('recusa imagem sem descrição', () => {
    const r = schema.safeParse(aviso({ imagemUrl: 'https://exemplo.org/foto.jpg' }))
    expect(r.success).toBe(false)
    if (!r.success) {
      expect(r.error.issues.some((i) => i.path.includes('imagemAlt'))).toBe(true)
    }
  })

  it('recusa descrição em branco', () => {
    const r = schema.safeParse(
      aviso({ imagemUrl: 'https://exemplo.org/foto.jpg', imagemAlt: '   ' }),
    )
    expect(r.success).toBe(false)
  })

  it('aceita imagem com descrição', () => {
    const r = schema.safeParse(
      aviso({
        imagemUrl: 'https://exemplo.org/foto.jpg',
        imagemAlt: 'Estudantes no pátio central da Fatec Campinas',
      }),
    )
    expect(r.success).toBe(true)
  })

  it('aceita publicação sem imagem nenhuma', () => {
    expect(schema.safeParse(aviso()).success).toBe(true)
  })
})

describe('campos por tipo', () => {
  it('aceita evento completo', () => {
    expect(schema.safeParse(evento()).success).toBe(true)
  })

  it('recusa evento sem local', () => {
    const semLocal = evento()
    delete (semLocal as Record<string, unknown>).local
    expect(schema.safeParse(semLocal).success).toBe(false)
  })

  it('recusa evento sem data de início', () => {
    const semInicio = evento()
    delete (semInicio as Record<string, unknown>).inicioEm
    expect(schema.safeParse(semInicio).success).toBe(false)
  })

  it('recusa evento que termina antes de começar', () => {
    const r = schema.safeParse(evento({ fimEm: new Date('2026-09-23T20:00:00Z') }))
    expect(r.success).toBe(false)
  })

  it('recusa prazo sem data-limite', () => {
    const r = schema.safeParse({
      tipo: 'prazo',
      titulo: 'Inscrição em disciplinas',
      resumo: 'Pelo SIGA.',
      corpo: 'Detalhes no edital.',
      setorId: SETOR,
      expiraEm: new Date('2026-10-08T12:00:00Z'),
    })
    expect(r.success).toBe(false)
  })

  it('aceita notícia sem campo específico', () => {
    const r = schema.safeParse({
      tipo: 'noticia',
      titulo: 'Equipe de ADS fica em terceiro na Maratona',
      resumo: 'Vaga garantida na final nacional.',
      corpo: 'Os três alunos disputaram a etapa regional.',
      setorId: SETOR,
      expiraEm: new Date('2026-12-08T12:00:00Z'),
    })
    expect(r.success).toBe(true)
  })

  it('recusa tipo desconhecido', () => {
    expect(schema.safeParse(aviso({ tipo: 'recado' })).success).toBe(false)
  })
})
```

- [ ] **Step 6: Rodar e confirmar que falha**

Run: `npx vitest run tests/unidade/validacao.test.ts`
Expected: FAIL — módulo não encontrado.

- [ ] **Step 7: Implementar a validação**

```ts
// src/lib/publicacoes/validacao.ts
import { z } from 'zod'

const anexo = z.object({
  url: z.string().url(),
  nome: z.string().min(1),
  bytes: z.number().int().positive(),
  mime: z.string().min(1),
})

const link = z.object({
  url: z.string().url(),
  rotulo: z.string().min(1),
})

function camposComuns(agora: Date) {
  return {
    titulo: z.string().trim().min(1, 'Escreva um título.').max(140, 'O título tem no máximo 140 caracteres.'),
    resumo: z.string().trim().min(1, 'Escreva um resumo.').max(220, 'O resumo tem no máximo 220 caracteres.'),
    corpo: z.string().trim().min(1, 'Escreva o texto da publicação.'),
    setorId: z.string().uuid(),
    cursoIds: z.array(z.string().uuid()).default([]),
    imagemUrl: z.string().url().nullish().default(null),
    imagemAlt: z.string().nullish().default(null),
    creditoFoto: z.string().nullish().default(null),
    anexos: z.array(anexo).default([]),
    linkExterno: link.nullish().default(null),
    destaque: z.boolean().default(false),
    expiraEm: z.coerce.date().refine(
      (d) => d.getTime() > agora.getTime(),
      'A data de saída do mural precisa estar no futuro.',
    ),
  }
}

export function criarSchemaPublicacao(agora: Date) {
  const comum = camposComuns(agora)

  const avisoSchema = z.object({
    ...comum,
    tipo: z.literal('aviso'),
    urgencia: z.enum(['informativo', 'importante', 'urgente']).default('informativo'),
    documentoNumero: z.string().nullish().default(null),
  })

  const eventoSchema = z
    .object({
      ...comum,
      tipo: z.literal('evento'),
      inicioEm: z.coerce.date(),
      fimEm: z.coerce.date().nullish().default(null),
      local: z.string().trim().min(1, 'Informe onde o evento acontece.'),
      modalidade: z.enum(['presencial', 'online', 'hibrido']).default('presencial'),
      linkInscricao: z.string().url().nullish().default(null),
      vagasRestantes: z.number().int().nonnegative().nullish().default(null),
    })
    .refine(
      (e) => !e.fimEm || e.fimEm.getTime() >= e.inicioEm.getTime(),
      { message: 'O evento não pode terminar antes de começar.', path: ['fimEm'] },
    )

  const prazoSchema = z.object({
    ...comum,
    tipo: z.literal('prazo'),
    prazoFinal: z.coerce.date(),
    abreEm: z.coerce.date().nullish().default(null),
    linkAcao: link.nullish().default(null),
  })

  const noticiaSchema = z.object({
    ...comum,
    tipo: z.literal('noticia'),
    pessoasCitadas: z.string().nullish().default(null),
  })

  return z
    .discriminatedUnion('tipo', [avisoSchema, eventoSchema, prazoSchema, noticiaSchema])
    .superRefine((valor, ctx) => {
      if (valor.imagemUrl && !valor.imagemAlt?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['imagemAlt'],
          message:
            'Descreva a imagem para quem usa leitor de tela. Sem isso a publicação não pode ir ao ar.',
        })
      }
    })
}

export type EntradaPublicacao = z.infer<ReturnType<typeof criarSchemaPublicacao>>
```

Nota sobre o `.refine` do evento: schemas dentro de um `discriminatedUnion` precisam ser objetos, e um `.refine` transforma o schema num efeito. Se o Zod reclamar de tipo, mover a checagem de `fimEm` para dentro do `superRefine` da união, testando `valor.tipo === 'evento'`.

- [ ] **Step 8: Rodar e confirmar que passa**

Run: `npx vitest run tests/unidade/validacao.test.ts tests/unidade/slug.test.ts`
Expected: PASS — 19 testes.

- [ ] **Step 9: Commit**

```bash
git add src/lib/publicacoes/slug.ts src/lib/publicacoes/validacao.ts tests/unidade/slug.test.ts tests/unidade/validacao.test.ts
git commit -m "feat: validacao por tipo e geracao de slug

Imagem sem descricao nao passa na validacao. A acessibilidade da spec
vira impedimento de fato, e nao recomendacao que alguem lembra de
seguir.

O schema e criado por uma funcao que recebe 'agora', para que a regra
de data futura seja testavel sem depender do relogio da maquina.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 7: Conteúdo de exemplo

Um banco vazio não deixa ninguém julgar o mural. O seed cria setores, cursos, um usuário autor e publicações dos quatro tipos, com datas **relativas ao momento da execução** — assim o prazo apertado continua apertado daqui a três meses.

**Files:**
- Create: `src/lib/db/seed.ts`
- Modify: `package.json` (script `db:seed`)

**Interfaces:**
- Consumes: `db` de `@/lib/db/client`; tabelas de `@/lib/db/schema`; `gerarSlug` de `@/lib/publicacoes/slug`
- Produces: `semear(db: Db, agora?: Date): Promise<void>` — exportada para reuso nos testes de integração

- [ ] **Step 1: Escrever o seed**

```ts
// src/lib/db/seed.ts
import { addDays, subDays } from 'date-fns'
import { db as bancoPadrao, type Db } from './client'
import { cursos, publicacoes, publicacoesCursos, setores, usuarios } from './schema'
import { gerarSlug } from '@/lib/publicacoes/slug'

// Confirmar esta lista com a unidade antes da entrega (seção 16 da spec).
const CURSOS = [
  { nome: 'Análise e Desenvolvimento de Sistemas', sigla: 'ADS' },
  { nome: 'Gestão Empresarial', sigla: 'GE' },
  { nome: 'Segurança da Informação', sigla: 'SI' },
]

const SETORES = [
  'Secretaria Acadêmica',
  'Direção',
  'Coordenação de ADS',
  'Coordenação de Gestão Empresarial',
  'Centro Acadêmico',
]

export async function semear(db: Db, agora: Date = new Date()): Promise<void> {
  const setoresGravados = await db
    .insert(setores)
    .values(SETORES.map((nome) => ({ nome, slug: gerarSlug(nome) })))
    .returning()

  const cursosGravados = await db
    .insert(cursos)
    .values(CURSOS.map((c) => ({ ...c, slug: gerarSlug(c.nome) })))
    .returning()

  const porSetor = (nome: string) => {
    const s = setoresGravados.find((x) => x.nome === nome)
    if (!s) throw new Error(`Setor ausente no seed: ${nome}`)
    return s.id
  }
  const porCurso = (sigla: string) => {
    const c = cursosGravados.find((x) => x.sigla === sigla)
    if (!c) throw new Error(`Curso ausente no seed: ${sigla}`)
    return c.id
  }

  const [autor] = await db
    .insert(usuarios)
    .values({
      nome: 'Helena Vasconcelos',
      email: 'helena.vasconcelos@fatec.sp.gov.br',
      // Substituído por hash real no Plano 2, quando a autenticação existir.
      senhaHash: 'definir-no-plano-2',
      papel: 'editor',
      setorId: porSetor('Secretaria Acadêmica'),
    })
    .returning()

  const comuns = { autorId: autor.id, status: 'publicado' as const }

  const gravadas = await db
    .insert(publicacoes)
    .values([
      {
        ...comuns,
        slug: gerarSlug('Alteração no calendário acadêmico do 2º semestre'),
        tipo: 'aviso',
        titulo: 'Alteração no calendário acadêmico do 2º semestre',
        resumo: 'Início das aulas antecipado em uma semana. Novas datas de provas no edital.',
        corpo:
          'O início das aulas foi antecipado em uma semana. As novas datas de provas e de encerramento do semestre estão no edital anexo.\n\nA alteração vale para todos os cursos e períodos.',
        setorId: porSetor('Secretaria Acadêmica'),
        urgencia: 'urgente',
        documentoNumero: '042/2026',
        destaque: true,
        publicadoEm: subDays(agora, 3),
        expiraEm: addDays(agora, 27),
      },
      {
        ...comuns,
        slug: gerarSlug('Edital de monitoria remunerada para o 2º semestre'),
        tipo: 'aviso',
        titulo: 'Edital de monitoria remunerada para o 2º semestre',
        resumo: 'Doze vagas em seis disciplinas, com bolsa mensal e oito horas semanais.',
        corpo: 'As inscrições vão até 19 de setembro, pelo SIGA, com histórico e carta de intenção.',
        setorId: porSetor('Coordenação de ADS'),
        urgencia: 'importante',
        documentoNumero: '039/2026',
        publicadoEm: subDays(agora, 5),
        expiraEm: addDays(agora, 25),
      },
      {
        ...comuns,
        slug: gerarSlug('Semana de Tecnologia: IA aplicada a sistemas embarcados'),
        tipo: 'evento',
        titulo: 'Semana de Tecnologia: IA aplicada a sistemas embarcados',
        resumo: 'Abertura da programação com pesquisadores da Unicamp e engenheiros da região.',
        corpo: 'A mesa de abertura discute inferência em dispositivos de borda.',
        setorId: porSetor('Coordenação de ADS'),
        inicioEm: addDays(agora, 15),
        fimEm: addDays(agora, 15),
        local: 'Auditório do Bloco B',
        modalidade: 'presencial',
        vagasRestantes: 23,
        publicadoEm: subDays(agora, 6),
        expiraEm: addDays(agora, 22),
      },
      {
        ...comuns,
        slug: gerarSlug('Feira de estágios e primeiro emprego'),
        tipo: 'evento',
        titulo: 'Feira de estágios e primeiro emprego',
        resumo: 'Dezenove empresas da região recebem currículos e entrevistam no mesmo dia.',
        corpo: 'Levar currículo impresso. Não é preciso se inscrever.',
        setorId: porSetor('Direção'),
        inicioEm: addDays(agora, 24),
        fimEm: addDays(agora, 24),
        local: 'Pátio coberto',
        modalidade: 'presencial',
        publicadoEm: subDays(agora, 2),
        expiraEm: addDays(agora, 31),
      },
      {
        ...comuns,
        slug: gerarSlug('Inscrição em disciplinas do 2º semestre'),
        tipo: 'prazo',
        titulo: 'Inscrição em disciplinas do 2º semestre',
        resumo: 'Pelo SIGA, até as 23h59 da data-limite.',
        corpo: 'Confira a grade antes de confirmar. Depois do prazo só há ajuste presencial.',
        setorId: porSetor('Secretaria Acadêmica'),
        prazoFinal: addDays(agora, 4),
        publicadoEm: subDays(agora, 10),
        expiraEm: addDays(agora, 4),
      },
      {
        ...comuns,
        slug: gerarSlug('Entrega do relatório parcial de TCC'),
        tipo: 'prazo',
        titulo: 'Entrega do relatório parcial de TCC',
        resumo: 'Turmas do 6º ciclo, no SIGA e impresso na secretaria.',
        corpo: 'Duas vias impressas, assinadas pelo orientador.',
        setorId: porSetor('Coordenação de ADS'),
        prazoFinal: addDays(agora, 21),
        publicadoEm: subDays(agora, 8),
        expiraEm: addDays(agora, 21),
      },
      {
        ...comuns,
        slug: gerarSlug('Equipe de ADS fica em terceiro na Maratona de Programação'),
        tipo: 'noticia',
        titulo: 'Equipe de ADS fica em terceiro na Maratona de Programação',
        resumo: 'Os três alunos garantiram vaga na final nacional, em novembro.',
        corpo: 'A equipe disputou a etapa regional contra 112 equipes.',
        setorId: porSetor('Coordenação de ADS'),
        pessoasCitadas: 'Marcela Tsuchiya, Ithalo Bandeira e Renan Sposito',
        creditoFoto: 'Assessoria de Comunicação',
        publicadoEm: subDays(agora, 6),
        expiraEm: addDays(agora, 84),
      },
      {
        ...comuns,
        slug: gerarSlug('Campanha de doação de sangue reúne 84 voluntários'),
        tipo: 'noticia',
        titulo: 'Campanha de doação de sangue reúne 84 voluntários',
        resumo: 'A ação do centro acadêmico ocupou o pátio coberto por dois dias.',
        corpo: 'O hemocentro recebeu doadores de todos os cursos e períodos.',
        setorId: porSetor('Centro Acadêmico'),
        publicadoEm: subDays(agora, 32),
        expiraEm: addDays(agora, 58),
      },
      {
        // Vencida de propósito: prova que expiração some da listagem
        // e que a página individual continua acessível.
        ...comuns,
        slug: gerarSlug('Manutenção elétrica no Bloco C'),
        tipo: 'aviso',
        titulo: 'Manutenção elétrica no Bloco C',
        resumo: 'Aulas do noturno remanejadas para as salas 201 a 206 do Bloco A.',
        corpo: 'O fornecimento foi restabelecido na manhã seguinte.',
        setorId: porSetor('Direção'),
        urgencia: 'informativo',
        publicadoEm: subDays(agora, 40),
        expiraEm: subDays(agora, 10),
      },
    ])
    .returning()

  const porSlug = (slug: string) => {
    const p = gravadas.find((x) => x.slug === slug)
    if (!p) throw new Error(`Publicação ausente no seed: ${slug}`)
    return p.id
  }

  await db.insert(publicacoesCursos).values([
    { publicacaoId: porSlug(gerarSlug('Edital de monitoria remunerada para o 2º semestre')), cursoId: porCurso('ADS') },
    { publicacaoId: porSlug(gerarSlug('Semana de Tecnologia: IA aplicada a sistemas embarcados')), cursoId: porCurso('ADS') },
    { publicacaoId: porSlug(gerarSlug('Inscrição em disciplinas do 2º semestre')), cursoId: porCurso('ADS') },
    { publicacaoId: porSlug(gerarSlug('Inscrição em disciplinas do 2º semestre')), cursoId: porCurso('GE') },
    { publicacaoId: porSlug(gerarSlug('Entrega do relatório parcial de TCC')), cursoId: porCurso('ADS') },
    { publicacaoId: porSlug(gerarSlug('Equipe de ADS fica em terceiro na Maratona de Programação')), cursoId: porCurso('ADS') },
  ])
}

// Execução direta: npm run db:seed
if (process.argv[1]?.includes('seed')) {
  semear(bancoPadrao)
    .then(() => {
      console.log('Mural semeado com 9 publicações.')
      process.exit(0)
    })
    .catch((erro) => {
      console.error(erro)
      process.exit(1)
    })
}
```

- [ ] **Step 2: Adicionar os scripts de banco**

No `package.json`:

```json
"db:generate": "drizzle-kit generate",
"db:push": "drizzle-kit push",
"db:seed": "tsx src/lib/db/seed.ts"
```

- [ ] **Step 3: Escrever o teste que falha**

```ts
// tests/integracao/seed.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { criarBancoDeTeste } from './ajuda/banco'
import { semear } from '@/lib/db/seed'
import { publicacoes } from '@/lib/db/schema'

const agora = new Date('2026-09-08T12:00:00Z')
let ctx: Awaited<ReturnType<typeof criarBancoDeTeste>>

beforeAll(async () => {
  ctx = await criarBancoDeTeste()
  await semear(ctx.db, agora)
})
afterAll(async () => { await ctx.encerrar() })

describe('seed', () => {
  it('cria publicações dos quatro tipos', async () => {
    const linhas = await ctx.db.select().from(publicacoes)
    const tipos = new Set(linhas.map((l) => l.tipo))
    expect(tipos).toEqual(new Set(['aviso', 'evento', 'prazo', 'noticia']))
  })

  it('inclui uma publicação já vencida, para exercitar a expiração', async () => {
    const linhas = await ctx.db.select().from(publicacoes)
    const vencidas = linhas.filter((l) => l.expiraEm.getTime() <= agora.getTime())
    expect(vencidas).toHaveLength(1)
  })

  it('usa datas relativas, mantendo um prazo apertado', async () => {
    const linhas = await ctx.db.select().from(publicacoes)
    const prazos = linhas.filter((l) => l.tipo === 'prazo' && l.prazoFinal)
    const apertados = prazos.filter((p) => {
      const dias = (p.prazoFinal!.getTime() - agora.getTime()) / 86_400_000
      return dias >= 0 && dias <= 7
    })
    expect(apertados.length).toBeGreaterThan(0)
  })
})
```

- [ ] **Step 4: Rodar até passar**

Run: `npx vitest run tests/integracao/seed.test.ts`
Expected: PASS — 3 testes.

- [ ] **Step 5: Semear o banco de verdade e conferir**

```bash
npm run db:push
npm run db:seed
```

Expected: `Mural semeado com 9 publicações.`

- [ ] **Step 6: Commit**

```bash
git add src/lib/db/seed.ts package.json tests/integracao/seed.test.ts
git commit -m "feat: conteudo de exemplo com datas relativas

As datas sao calculadas a partir do momento da execucao, entao o prazo
apertado continua apertado daqui a tres meses e ninguem precisa
reeditar o seed para demonstrar o sistema.

Inclui de proposito uma publicacao vencida, para que os testes de
expiracao tenham o que exercitar.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 8: Consultas de listagem

A regra "vencido sai do mural mas não é apagado" mora aqui: a listagem filtra por validade, a página individual não filtra.

**Files:**
- Modify: `src/lib/db/schema.ts` (acrescentar as `relations` ao final do arquivo)
- Create: `src/lib/publicacoes/tipos.ts`, `src/lib/publicacoes/consultas.ts`
- Test: `tests/integracao/consultas.test.ts`

**Interfaces:**
- Consumes: `db`/`Db` de `@/lib/db/client`; `ordenarMural` de `@/lib/publicacoes/ordenacao`
- Produces:
  - `type PublicacaoDoMural` — linha de `publicacoes` mais `setor: { nome, slug }` e `cursos: { nome, sigla, slug }[]`
  - `listarMural(db: Db, agora: Date, limite?: number): Promise<PublicacaoDoMural[]>`
  - `listarPorTipo(db: Db, tipo: TipoPublicacao, agora: Date): Promise<PublicacaoDoMural[]>`
  - `buscarPorSlug(db: Db, slug: string): Promise<PublicacaoDoMural | null>` — devolve mesmo se vencida
  - `contarVigentes(db: Db, agora: Date): Promise<number>`
  - `type TipoPublicacao = 'aviso' | 'evento' | 'prazo' | 'noticia'`

- [ ] **Step 1: Acrescentar as relations ao schema**

No final de `src/lib/db/schema.ts`:

```ts
import { relations } from 'drizzle-orm'

export const relacoesPublicacoes = relations(publicacoes, ({ one, many }) => ({
  setor: one(setores, { fields: [publicacoes.setorId], references: [setores.id] }),
  autor: one(usuarios, { fields: [publicacoes.autorId], references: [usuarios.id] }),
  cursos: many(publicacoesCursos),
}))

export const relacoesPublicacoesCursos = relations(publicacoesCursos, ({ one }) => ({
  publicacao: one(publicacoes, {
    fields: [publicacoesCursos.publicacaoId],
    references: [publicacoes.id],
  }),
  curso: one(cursos, {
    fields: [publicacoesCursos.cursoId],
    references: [cursos.id],
  }),
}))
```

Nenhuma migração é necessária: `relations` só existe no TypeScript, não no banco.

- [ ] **Step 2: Escrever os tipos**

```ts
// src/lib/publicacoes/tipos.ts
import type { publicacoes } from '@/lib/db/schema'

export type TipoPublicacao = 'aviso' | 'evento' | 'prazo' | 'noticia'

export type LinhaPublicacao = typeof publicacoes.$inferSelect

export type PublicacaoDoMural = LinhaPublicacao & {
  setor: { nome: string; slug: string }
  cursos: { nome: string; sigla: string; slug: string }[]
}

export const ROTULO_TIPO: Record<TipoPublicacao, string> = {
  aviso: 'Aviso',
  evento: 'Evento',
  prazo: 'Prazo',
  noticia: 'Comunidade',
}

export const CAMINHO_TIPO: Record<TipoPublicacao, string> = {
  aviso: '/avisos',
  evento: '/eventos',
  prazo: '/prazos',
  noticia: '/comunidade',
}
```

- [ ] **Step 3: Escrever o teste que falha**

```ts
// tests/integracao/consultas.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { criarBancoDeTeste } from './ajuda/banco'
import { semear } from '@/lib/db/seed'
import { listarMural, listarPorTipo, buscarPorSlug, contarVigentes } from '@/lib/publicacoes/consultas'

const agora = new Date('2026-09-08T12:00:00Z')
let ctx: Awaited<ReturnType<typeof criarBancoDeTeste>>

beforeAll(async () => {
  ctx = await criarBancoDeTeste()
  await semear(ctx.db, agora)
})
afterAll(async () => { await ctx.encerrar() })

describe('listarMural', () => {
  it('não traz a publicação vencida', async () => {
    const itens = await listarMural(ctx.db, agora)
    expect(itens.some((i) => i.slug === 'manutencao-eletrica-no-bloco-c')).toBe(false)
  })

  it('traz oito publicações vigentes', async () => {
    const itens = await listarMural(ctx.db, agora)
    expect(itens).toHaveLength(8)
  })

  it('põe a publicação em destaque em primeiro lugar', async () => {
    const itens = await listarMural(ctx.db, agora)
    expect(itens[0].destaque).toBe(true)
  })

  it('inclui o nome do setor emissor', async () => {
    const itens = await listarMural(ctx.db, agora)
    expect(itens[0].setor.nome).toBe('Secretaria Acadêmica')
  })

  it('inclui os cursos relacionados', async () => {
    const itens = await listarMural(ctx.db, agora)
    const inscricao = itens.find((i) => i.slug === 'inscricao-em-disciplinas-do-2-semestre')
    expect(inscricao?.cursos.map((c) => c.sigla).sort()).toEqual(['ADS', 'GE'])
  })

  it('respeita o limite', async () => {
    const itens = await listarMural(ctx.db, agora, 3)
    expect(itens).toHaveLength(3)
  })
})

describe('listarPorTipo', () => {
  it('traz só eventos vigentes', async () => {
    const itens = await listarPorTipo(ctx.db, 'evento', agora)
    expect(itens).toHaveLength(2)
    expect(itens.every((i) => i.tipo === 'evento')).toBe(true)
  })

  it('não traz o aviso vencido na listagem de avisos', async () => {
    const itens = await listarPorTipo(ctx.db, 'aviso', agora)
    expect(itens.every((i) => i.expiraEm.getTime() > agora.getTime())).toBe(true)
  })
})

describe('buscarPorSlug', () => {
  it('encontra uma publicação vigente', async () => {
    const p = await buscarPorSlug(ctx.db, 'feira-de-estagios-e-primeiro-emprego')
    expect(p?.titulo).toBe('Feira de estágios e primeiro emprego')
  })

  it('encontra uma publicação vencida, porque a URL não pode quebrar', async () => {
    const p = await buscarPorSlug(ctx.db, 'manutencao-eletrica-no-bloco-c')
    expect(p).not.toBeNull()
    expect(p!.expiraEm.getTime()).toBeLessThan(agora.getTime())
  })

  it('devolve null para slug inexistente', async () => {
    expect(await buscarPorSlug(ctx.db, 'nao-existe')).toBeNull()
  })
})

describe('contarVigentes', () => {
  it('conta só o que está no mural agora', async () => {
    expect(await contarVigentes(ctx.db, agora)).toBe(8)
  })
})
```

- [ ] **Step 4: Rodar e confirmar que falha**

Run: `npx vitest run tests/integracao/consultas.test.ts`
Expected: FAIL — `@/lib/publicacoes/consultas` não encontrado.

- [ ] **Step 5: Implementar as consultas**

```ts
// src/lib/publicacoes/consultas.ts
import { and, count, eq, gt, isNotNull } from 'drizzle-orm'
import type { Db } from '@/lib/db/client'
import { publicacoes } from '@/lib/db/schema'
import { ordenarMural } from '@/lib/publicacoes/ordenacao'
import type { PublicacaoDoMural, TipoPublicacao } from '@/lib/publicacoes/tipos'

const COM_RELACOES = {
  setor: { columns: { nome: true, slug: true } },
  cursos: { with: { curso: { columns: { nome: true, sigla: true, slug: true } } } },
} as const

type LinhaCrua = Awaited<ReturnType<Db['query']['publicacoes']['findFirst']>>

function achatar(linha: NonNullable<LinhaCrua>): PublicacaoDoMural {
  const { cursos, ...resto } = linha as never as {
    cursos: { curso: { nome: string; sigla: string; slug: string } }[]
  } & PublicacaoDoMural
  return { ...resto, cursos: cursos.map((c) => c.curso) }
}

/**
 * Condição única de "está no mural agora". Usada por toda listagem.
 *
 * `publicadoEm` entra na condição porque a ordenação depende dele e a coluna
 * é nulável. Uma linha publicada sem data de publicação é dado malformado:
 * some da listagem em silêncio, em vez de derrubar a home com um erro de
 * leitura de nulo. A garantia de escrita virá do painel, no Plano 2.
 */
function vigente(agora: Date) {
  return and(
    eq(publicacoes.status, 'publicado'),
    isNotNull(publicacoes.publicadoEm),
    gt(publicacoes.expiraEm, agora),
  )
}

export async function listarMural(
  db: Db,
  agora: Date,
  limite?: number,
): Promise<PublicacaoDoMural[]> {
  const linhas = await db.query.publicacoes.findMany({
    where: vigente(agora),
    with: COM_RELACOES,
  })
  const ordenadas = ordenarMural(linhas.map(achatar), agora)
  // `limite === 0` precisa devolver lista vazia, não a lista inteira.
  // Um teste ternário sobre o número trata 0 como ausência de limite.
  return limite === undefined ? ordenadas : ordenadas.slice(0, limite)
}

export async function listarPorTipo(
  db: Db,
  tipo: TipoPublicacao,
  agora: Date,
): Promise<PublicacaoDoMural[]> {
  const linhas = await db.query.publicacoes.findMany({
    where: and(vigente(agora), eq(publicacoes.tipo, tipo)),
    with: COM_RELACOES,
  })
  return ordenarMural(linhas.map(achatar), agora)
}

/** Sem filtro de validade: uma URL publicada num edital não pode quebrar. */
export async function buscarPorSlug(db: Db, slug: string): Promise<PublicacaoDoMural | null> {
  const linha = await db.query.publicacoes.findFirst({
    where: eq(publicacoes.slug, slug),
    with: COM_RELACOES,
  })
  return linha ? achatar(linha) : null
}

export async function contarVigentes(db: Db, agora: Date): Promise<number> {
  const [linha] = await db.select({ total: count() }).from(publicacoes).where(vigente(agora))
  return linha.total
}
```

Se o TypeScript reclamar do achatamento, conferir que as `relations` do Step 1 foram exportadas e que `drizzle(cliente, { schema })` recebe o módulo inteiro — sem isso `db.query` não enxerga as relações.

- [ ] **Step 6: Rodar e confirmar que passa**

Run: `npx vitest run tests/integracao/consultas.test.ts`
Expected: PASS — 12 testes.

- [ ] **Step 7: Commit**

```bash
git add src/lib/db/schema.ts src/lib/publicacoes tests/integracao/consultas.test.ts
git commit -m "feat: consultas de listagem com regra unica de vigencia

A condicao 'esta no mural agora' existe numa funcao so, usada por toda
listagem, para que ninguem escreva um filtro divergente mais tarde.

buscarPorSlug nao filtra por validade de proposito: uma URL citada em
edital nao pode virar 404 so porque o aviso saiu do mural.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 9: Casca do site

Barra de serviços, cabeçalho com marca e busca, navegação por tipo e rodapé. Tudo que aparece em toda página.

**Files:**
- Create: `src/components/layout/BarraServicos.tsx` + `.module.css`
- Create: `src/components/layout/Cabecalho.tsx` + `.module.css`
- Create: `src/components/layout/Navegacao.tsx` + `.module.css`
- Create: `src/components/layout/Rodape.tsx` + `.module.css`
- Modify: `src/app/layout.tsx`
- Test: `tests/unidade/casca.test.tsx`

**Interfaces:**
- Consumes: tokens de `globals.css`
- Produces: `<BarraServicos />`, `<Cabecalho />`, `<Navegacao ativo={caminho} />`, `<Rodape />`; todos Server Components

- [ ] **Step 1: Escrever o teste que falha**

```tsx
// tests/unidade/casca.test.tsx
import { describe, it, expect } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { Cabecalho } from '@/components/layout/Cabecalho'
import { Navegacao } from '@/components/layout/Navegacao'
import { Rodape } from '@/components/layout/Rodape'

describe('Cabecalho', () => {
  it('mostra a marca com a unidade', () => {
    render(<Cabecalho />)
    expect(screen.getByText('Fatec')).toBeInTheDocument()
    expect(screen.getByText('Campinas')).toBeInTheDocument()
  })

  it('tem campo de busca com rótulo acessível', () => {
    render(<Cabecalho />)
    expect(screen.getByLabelText('Buscar no mural')).toBeInTheDocument()
  })

  it('envia a busca por GET para /buscar, para que o resultado seja compartilhável', () => {
    const { container } = render(<Cabecalho />)
    const form = container.querySelector('form')
    expect(form).toHaveAttribute('action', '/buscar')
    expect(form).toHaveAttribute('method', 'get')
  })
})

describe('Navegacao', () => {
  it('lista as seções do mural', () => {
    render(<Navegacao ativo="/" />)
    const nav = screen.getByRole('navigation', { name: 'Seções do mural' })
    for (const rotulo of ['Tudo', 'Avisos', 'Eventos', 'Prazos', 'Comunidade']) {
      expect(within(nav).getByRole('link', { name: rotulo })).toBeInTheDocument()
    }
  })

  it('marca a seção atual com aria-current', () => {
    render(<Navegacao ativo="/eventos" />)
    expect(screen.getByRole('link', { name: 'Eventos' })).toHaveAttribute('aria-current', 'page')
  })

  it('não marca as demais', () => {
    render(<Navegacao ativo="/eventos" />)
    expect(screen.getByRole('link', { name: 'Avisos' })).not.toHaveAttribute('aria-current')
  })
})

describe('Rodape', () => {
  it('agrupa links em colunas com título', () => {
    render(<Rodape />)
    expect(screen.getByRole('heading', { name: 'O mural' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Por curso' })).toBeInTheDocument()
  })

  it('identifica a instituição', () => {
    render(<Rodape />)
    expect(screen.getByText(/Centro Paula Souza/)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `npx vitest run tests/unidade/casca.test.tsx`
Expected: FAIL — componentes não encontrados.

- [ ] **Step 3: Escrever a barra de serviços**

```tsx
// src/components/layout/BarraServicos.tsx
import css from './BarraServicos.module.css'

const SERVICOS = [
  { rotulo: 'Secretaria', href: '#' },
  { rotulo: 'SIGA', href: '#' },
  { rotulo: 'Biblioteca', href: '#' },
  { rotulo: 'Estágios', href: '#' },
  { rotulo: 'Centro Acadêmico', href: '#' },
]

export function BarraServicos() {
  return (
    <div className={css.barra}>
      <nav className={`pagina ${css.faixa}`} aria-label="Serviços da unidade">
        {SERVICOS.map((s) => (
          <a key={s.rotulo} href={s.href}>{s.rotulo}</a>
        ))}
        <a href="#" className={css.fim}>Acessibilidade</a>
        <a href="/entrar">Entrar para publicar</a>
      </nav>
    </div>
  )
}
```

```css
/* src/components/layout/BarraServicos.module.css */
.barra { background: var(--ardosia-escura); color: rgba(255, 255, 255, 0.78); }

.faixa {
  display: flex;
  gap: 19px;
  flex-wrap: wrap;
  align-items: center;
  padding-top: 9px;
  padding-bottom: 9px;
  font-size: 12.5px;
}

.faixa a:hover { color: var(--papel); text-decoration: underline; }

.fim { margin-left: auto; }
```

- [ ] **Step 4: Escrever o cabeçalho**

```tsx
// src/components/layout/Cabecalho.tsx
import css from './Cabecalho.module.css'

export function Cabecalho() {
  return (
    <div className={css.topo}>
      <div className={`pagina ${css.faixa}`}>
        <a className={css.lockup} href="/">
          <span className={css.marca}>
            <span className={css.fatec}>Fatec</span>
            <span className={css.unidade}>Campinas</span>
          </span>
          <span className={css.divisor} aria-hidden="true" />
          <span className={css.produto}>
            <span className={css.nome}>Mural</span>
            <span className={css.desc}>Avisos, eventos e prazos da unidade</span>
          </span>
        </a>

        <form className={css.busca} action="/buscar" method="get" role="search">
          <label className={css.rotuloOculto} htmlFor="busca-topo">Buscar no mural</label>
          <input
            id="busca-topo"
            name="q"
            type="search"
            placeholder="Buscar avisos, eventos e prazos"
          />
          <button type="submit">Buscar</button>
        </form>
      </div>
    </div>
  )
}
```

```css
/* src/components/layout/Cabecalho.module.css */
.topo { border-bottom: 3px solid var(--tijolo); }

.faixa {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  padding-top: 18px;
  padding-bottom: 16px;
}

.lockup { display: flex; align-items: center; gap: 16px; }

.marca { line-height: 0.9; }

.fatec {
  display: block;
  font-size: 30px;
  font-weight: 700;
  letter-spacing: -0.04em;
  color: var(--ardosia);
}

.unidade {
  display: block;
  font-size: 16.5px;
  font-weight: 700;
  letter-spacing: -0.025em;
  color: var(--tijolo);
  margin-top: 3px;
}

.divisor { width: 1px; align-self: stretch; background: var(--regra); }

.nome { display: block; font-size: 21px; font-weight: 600; letter-spacing: -0.025em; }

.desc {
  display: block;
  font-size: 12.5px;
  color: var(--cinza);
  margin-top: 4px;
}

.busca {
  display: flex;
  border: 1px solid var(--regra);
  border-radius: var(--raio-controle);
  overflow: hidden;
}

.busca input {
  border: 0;
  padding: 11px 14px;
  width: 236px;
  font: inherit;
  font-size: 14px;
  background: var(--papel);
  color: var(--tinta);
}

.busca button {
  border: 0;
  background: var(--ardosia);
  color: var(--papel);
  padding: 0 17px;
  cursor: pointer;
  font: inherit;
  font-size: 13.5px;
  font-weight: 500;
  transition: background 0.18s ease;
}

.busca button:hover { background: var(--ardosia-escura); }

.rotuloOculto { position: absolute; left: -9999px; }
```

- [ ] **Step 5: Escrever a navegação**

```tsx
// src/components/layout/Navegacao.tsx
import css from './Navegacao.module.css'

const SECOES = [
  { rotulo: 'Tudo', href: '/' },
  { rotulo: 'Avisos', href: '/avisos' },
  { rotulo: 'Eventos', href: '/eventos' },
  { rotulo: 'Prazos', href: '/prazos' },
  { rotulo: 'Comunidade', href: '/comunidade' },
]

export function Navegacao({ ativo }: { ativo: string }) {
  return (
    <nav className={css.nav} aria-label="Seções do mural">
      <div className={`pagina ${css.faixa}`}>
        {SECOES.map((s) => {
          const atual = s.href === ativo
          return (
            <a
              key={s.href}
              href={s.href}
              className={atual ? css.atual : undefined}
              aria-current={atual ? 'page' : undefined}
            >
              {s.rotulo}
            </a>
          )
        })}
      </div>
    </nav>
  )
}
```

```css
/* src/components/layout/Navegacao.module.css */
.nav { border-bottom: 1px solid var(--regra); }

.faixa { display: flex; gap: 27px; flex-wrap: wrap; }

.faixa a {
  padding: 14px 0;
  font-size: 14.5px;
  font-weight: 500;
  color: var(--ardosia);
  border-bottom: 3px solid transparent;
  margin-bottom: -1px;
  transition: color 0.15s ease;
}

.faixa a:hover { color: var(--tinta); border-bottom-color: var(--regra); }

.atual { color: var(--tinta); font-weight: 600; border-bottom-color: var(--tijolo); }
```

- [ ] **Step 6: Escrever o rodapé**

```tsx
// src/components/layout/Rodape.tsx
import css from './Rodape.module.css'

const COLUNAS = [
  {
    titulo: 'O mural',
    links: [
      { rotulo: 'Avisos e comunicados', href: '/avisos' },
      { rotulo: 'Eventos do campus', href: '/eventos' },
      { rotulo: 'Prazos acadêmicos', href: '/prazos' },
      { rotulo: 'Comunidade acadêmica', href: '/comunidade' },
    ],
  },
  {
    titulo: 'Por curso',
    links: [
      { rotulo: 'Análise e Desenvolvimento de Sistemas', href: '/buscar?curso=analise-e-desenvolvimento-de-sistemas' },
      { rotulo: 'Gestão Empresarial', href: '/buscar?curso=gestao-empresarial' },
      { rotulo: 'Segurança da Informação', href: '/buscar?curso=seguranca-da-informacao' },
    ],
  },
  {
    titulo: 'Serviços',
    links: [
      { rotulo: 'SIGA', href: '#' },
      { rotulo: 'Biblioteca', href: '#' },
      { rotulo: 'Estágios', href: '#' },
      { rotulo: 'Centro Acadêmico', href: '#' },
    ],
  },
  {
    titulo: 'Publicar no mural',
    links: [
      { rotulo: 'Entrar', href: '/entrar' },
      { rotulo: 'Quem pode publicar', href: '#' },
      { rotulo: 'Enviar uma pauta', href: '#' },
    ],
  },
]

export function Rodape() {
  return (
    <footer className={css.pe}>
      <div className="pagina">
        <div className={css.colunas}>
          {COLUNAS.map((coluna) => (
            <div key={coluna.titulo}>
              <h2 className={css.titulo}>{coluna.titulo}</h2>
              <ul>
                {coluna.links.map((l) => (
                  <li key={l.rotulo} className="narrow">
                    <a href={l.href}>{l.rotulo}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p className={`narrow ${css.fim}`}>
          Fatec Campinas — Faculdade de Tecnologia do Estado de São Paulo, Centro Paula Souza.
          <br />
          Este mural reúne comunicados oficiais publicados pelas unidades da faculdade.
        </p>
      </div>
    </footer>
  )
}
```

```css
/* src/components/layout/Rodape.module.css */
.pe {
  background: var(--ardosia-escura);
  color: rgba(255, 255, 255, 0.72);
  margin-top: 46px;
  padding-top: 38px;
  padding-bottom: 28px;
}

.colunas { display: grid; grid-template-columns: repeat(4, 1fr); gap: 26px; }

.titulo { font-size: 14px; font-weight: 600; color: var(--papel); margin: 0 0 13px; }

.pe ul { list-style: none; margin: 0; padding: 0; }

.pe li { margin-bottom: 8px; font-size: 14.5px; line-height: 1.45; }

.pe a:hover { color: var(--papel); text-decoration: underline; }

.fim {
  border-top: 1px solid rgba(255, 255, 255, 0.16);
  margin-top: 30px;
  padding-top: 19px;
  font-size: 14px;
  line-height: 1.6;
}
```

- [ ] **Step 7: Montar a casca no layout raiz**

Em `src/app/layout.tsx`, dentro do `<body>`, envolver `{children}`:

```tsx
<body>
  <a className="pular-para-conteudo" href="#conteudo">Pular para o conteúdo</a>
  <BarraServicos />
  <Cabecalho />
  {children}
  <Rodape />
</body>
```

Importar `BarraServicos`, `Cabecalho` e `Rodape` no topo. A `Navegacao` **não** entra aqui: ela precisa saber a seção atual, então cada página a renderiza passando `ativo`.

- [ ] **Step 8: Rodar e confirmar que passa**

Run: `npx vitest run tests/unidade/casca.test.tsx`
Expected: PASS — 8 testes.

- [ ] **Step 9: Conferir no navegador**

Run: `npm run dev`
Expected: barra escura no topo, marca com "Fatec" em ardósia e "Campinas" em tijolo, filete vermelho sob o cabeçalho, rodapé de quatro colunas. Navegar por Tab: o link "Pular para o conteúdo" aparece no primeiro toque.

- [ ] **Step 10: Commit**

```bash
git add src/components/layout src/app/layout.tsx tests/unidade/casca.test.tsx
git commit -m "feat: casca do portal com barra de servicos, marca e rodape

A busca e um form GET para /buscar, e nao um handler no cliente: assim o
resultado filtrado tem URL propria, pode ser compartilhado e o botao
voltar do navegador funciona.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 10: Componentes de conteúdo por tipo

Aqui vive a regra de dominante visual da seção 6 da spec: cada tipo tem um elemento que o olho pega primeiro, e por isso quatro componentes diferentes em vez de um card genérico com variações.

**Files:**
- Create: `src/components/mural/TituloSecao.tsx` + `.module.css`
- Create: `src/components/mural/LinhaAviso.tsx` + `.module.css`
- Create: `src/components/mural/CardEvento.tsx` + `.module.css`
- Create: `src/components/mural/LinhaPrazo.tsx` + `.module.css`
- Create: `src/components/mural/NotaComunidade.tsx` + `.module.css`
- Test: `tests/unidade/componentes-mural.test.tsx`, `tests/unidade/ajuda/publicacao.ts`

**Interfaces:**
- Consumes: `PublicacaoDoMural` de `@/lib/publicacoes/tipos`; formatadores de `@/lib/formato/datas`; `rotuloContagem` e `estadoDoPrazo` de `@/lib/publicacoes/exibicao`
- Produces:
  - `<TituloSecao titulo={string} verTodos={{ href, rotulo }} />`
  - `<LinhaAviso publicacao={PublicacaoDoMural} />`
  - `<CardEvento publicacao={PublicacaoDoMural} />`
  - `<LinhaPrazo publicacao={PublicacaoDoMural} agora={Date} />`
  - `<NotaComunidade publicacao={PublicacaoDoMural} variante={'destaque' | 'compacta'} />`
  - `criarPublicacao(campos)` na ajuda de teste

- [ ] **Step 1: Escrever a ajuda de teste**

```ts
// tests/unidade/ajuda/publicacao.ts
import type { PublicacaoDoMural } from '@/lib/publicacoes/tipos'

export function criarPublicacao(campos: Partial<PublicacaoDoMural> = {}): PublicacaoDoMural {
  return {
    id: '00000000-0000-4000-8000-000000000000',
    slug: 'publicacao-de-teste',
    tipo: 'aviso',
    titulo: 'Título de teste',
    resumo: 'Resumo de teste.',
    corpo: 'Corpo de teste.',
    setorId: '11111111-1111-4111-8111-111111111111',
    autorId: '22222222-2222-4222-8222-222222222222',
    imagemUrl: null,
    imagemAlt: null,
    creditoFoto: null,
    anexos: null,
    linkExterno: null,
    destaque: false,
    status: 'publicado',
    publicadoEm: new Date('2026-09-04T12:00:00Z'),
    expiraEm: new Date('2026-10-04T12:00:00Z'),
    urgencia: null,
    documentoNumero: null,
    inicioEm: null,
    fimEm: null,
    local: null,
    modalidade: null,
    linkInscricao: null,
    vagasRestantes: null,
    prazoFinal: null,
    abreEm: null,
    linkAcao: null,
    pessoasCitadas: null,
    buscaTsv: null,
    criadoEm: new Date('2026-09-04T12:00:00Z'),
    atualizadoEm: new Date('2026-09-04T12:00:00Z'),
    setor: { nome: 'Secretaria Acadêmica', slug: 'secretaria-academica' },
    cursos: [],
    ...campos,
  } as PublicacaoDoMural
}
```

- [ ] **Step 2: Escrever o teste que falha**

```tsx
// tests/unidade/componentes-mural.test.tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { criarPublicacao } from './ajuda/publicacao'
import { LinhaAviso } from '@/components/mural/LinhaAviso'
import { CardEvento } from '@/components/mural/CardEvento'
import { LinhaPrazo } from '@/components/mural/LinhaPrazo'
import { NotaComunidade } from '@/components/mural/NotaComunidade'

const agora = new Date('2026-09-08T12:00:00Z')

describe('LinhaAviso', () => {
  const aviso = criarPublicacao({
    tipo: 'aviso',
    titulo: 'Alteração no calendário acadêmico',
    resumo: 'Início antecipado em uma semana.',
    urgencia: 'urgente',
  })

  it('mostra o selo de urgente como texto, não só como cor', () => {
    render(<LinhaAviso publicacao={aviso} />)
    expect(screen.getByText('Urgente')).toBeInTheDocument()
  })

  it('não mostra selo em aviso informativo', () => {
    render(<LinhaAviso publicacao={criarPublicacao({ tipo: 'aviso', urgencia: 'informativo' })} />)
    expect(screen.queryByText('Urgente')).not.toBeInTheDocument()
  })

  it('escreve a data por extenso e no atributo datetime', () => {
    const { container } = render(<LinhaAviso publicacao={aviso} />)
    expect(screen.getByText('4 de setembro')).toBeInTheDocument()
    expect(container.querySelector('time')).toHaveAttribute('datetime', '2026-09-04')
  })

  it('mostra o setor emissor em repouso, sem depender de hover', () => {
    render(<LinhaAviso publicacao={aviso} />)
    expect(screen.getByText('Secretaria Acadêmica')).toBeInTheDocument()
  })

  it('leva para a página da publicação', () => {
    render(<LinhaAviso publicacao={aviso} />)
    expect(screen.getByRole('link')).toHaveAttribute('href', '/p/publicacao-de-teste')
  })
})

describe('CardEvento', () => {
  const evento = criarPublicacao({
    tipo: 'evento',
    titulo: 'Semana de Tecnologia',
    inicioEm: new Date('2026-09-23T22:30:00Z'),
    fimEm: new Date('2026-09-24T00:00:00Z'),
    local: 'Auditório do Bloco B',
    vagasRestantes: 23,
    imagemUrl: 'https://exemplo.org/auditorio.jpg',
    imagemAlt: 'Plateia no auditório do Bloco B',
  })

  it('escreve o dia da semana por extenso', () => {
    render(<CardEvento publicacao={evento} />)
    expect(screen.getByText('quarta-feira, 23 de setembro')).toBeInTheDocument()
  })

  it('mostra horário, local e vagas', () => {
    render(<CardEvento publicacao={evento} />)
    expect(screen.getByText('19h30 às 21h')).toBeInTheDocument()
    expect(screen.getByText('Auditório do Bloco B')).toBeInTheDocument()
    expect(screen.getByText('23 restantes')).toBeInTheDocument()
  })

  it('usa o texto alternativo da imagem', () => {
    render(<CardEvento publicacao={evento} />)
    expect(screen.getByAltText('Plateia no auditório do Bloco B')).toBeInTheDocument()
  })

  it('omite a linha de vagas quando o número não foi informado', () => {
    render(<CardEvento publicacao={criarPublicacao({ ...evento, vagasRestantes: null })} />)
    expect(screen.queryByText(/restantes/)).not.toBeInTheDocument()
  })

  it('funciona sem imagem', () => {
    const semFoto = criarPublicacao({ ...evento, imagemUrl: null, imagemAlt: null })
    const { container } = render(<CardEvento publicacao={semFoto} />)
    expect(container.querySelector('img')).toBeNull()
    expect(screen.getByText('Semana de Tecnologia')).toBeInTheDocument()
  })
})

describe('LinhaPrazo', () => {
  const perto = criarPublicacao({
    tipo: 'prazo',
    titulo: 'Inscrição em disciplinas',
    prazoFinal: new Date('2026-09-12T02:59:00Z'),
  })

  it('mostra a contagem como texto', () => {
    render(<LinhaPrazo publicacao={perto} agora={agora} />)
    expect(screen.getByText('Faltam 3 dias')).toBeInTheDocument()
  })

  it('marca o prazo apertado com atributo, não só com cor', () => {
    render(<LinhaPrazo publicacao={perto} agora={agora} />)
    expect(screen.getByText('Faltam 3 dias')).toHaveAttribute('data-estado', 'apertado')
  })

  it('não marca prazo distante como apertado', () => {
    const longe = criarPublicacao({
      tipo: 'prazo',
      prazoFinal: new Date('2026-10-10T12:00:00Z'),
    })
    render(<LinhaPrazo publicacao={longe} agora={agora} />)
    expect(screen.getByText(/Faltam \d+ dias/)).toHaveAttribute('data-estado', 'normal')
  })

  it('escreve a data-limite por extenso', () => {
    render(<LinhaPrazo publicacao={perto} agora={agora} />)
    expect(screen.getByText(/sexta-feira, 11 de setembro/)).toBeInTheDocument()
  })
})

describe('NotaComunidade', () => {
  const nota = criarPublicacao({
    tipo: 'noticia',
    titulo: 'Equipe de ADS fica em terceiro na Maratona',
    resumo: 'Vaga garantida na final nacional.',
    pessoasCitadas: 'Marcela Tsuchiya, Ithalo Bandeira e Renan Sposito',
    imagemUrl: 'https://exemplo.org/equipe.jpg',
    imagemAlt: 'Três estudantes com o certificado',
  })

  it('na variante destaque, mostra foto, resumo e pessoas citadas', () => {
    render(<NotaComunidade publicacao={nota} variante="destaque" />)
    expect(screen.getByAltText('Três estudantes com o certificado')).toBeInTheDocument()
    expect(screen.getByText('Vaga garantida na final nacional.')).toBeInTheDocument()
    expect(screen.getByText(/Marcela Tsuchiya/)).toBeInTheDocument()
  })

  it('na variante compacta, mostra só manchete e procedência', () => {
    const { container } = render(<NotaComunidade publicacao={nota} variante="compacta" />)
    expect(container.querySelector('img')).toBeNull()
    expect(screen.queryByText('Vaga garantida na final nacional.')).not.toBeInTheDocument()
    expect(screen.getByText(/Secretaria Acadêmica/)).toBeInTheDocument()
  })
})
```

- [ ] **Step 3: Rodar e confirmar que falha**

Run: `npx vitest run tests/unidade/componentes-mural.test.tsx`
Expected: FAIL — componentes não encontrados.

- [ ] **Step 4: Escrever o título de seção**

```tsx
// src/components/mural/TituloSecao.tsx
import css from './TituloSecao.module.css'

export function TituloSecao({
  titulo,
  verTodos,
}: {
  titulo: string
  verTodos?: { href: string; rotulo: string }
}) {
  return (
    <div className={css.cabeca}>
      <h2 className={css.titulo}>{titulo}</h2>
      {verTodos ? <a href={verTodos.href}>{verTodos.rotulo}</a> : null}
    </div>
  )
}
```

```css
/* src/components/mural/TituloSecao.module.css */
.cabeca {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 18px;
  border-top: 2px solid var(--ardosia);
  padding-top: 12px;
  margin-bottom: 20px;
}

.titulo {
  font-size: 23px;
  font-weight: 700;
  letter-spacing: -0.028em;
  color: var(--ardosia);
  margin: 0;
}

.cabeca a { font-size: 14px; font-weight: 500; color: var(--tijolo); }

.cabeca a:hover { text-decoration: underline; }
```

- [ ] **Step 5: Escrever a linha de aviso**

```tsx
// src/components/mural/LinhaAviso.tsx
import { formatarDataCurta, paraAtributoDatetime } from '@/lib/formato/datas'
import type { PublicacaoDoMural } from '@/lib/publicacoes/tipos'
import css from './LinhaAviso.module.css'

export function LinhaAviso({ publicacao }: { publicacao: PublicacaoDoMural }) {
  const data = publicacao.publicadoEm ?? publicacao.criadoEm
  return (
    <a className={css.linha} href={`/p/${publicacao.slug}`}>
      <time className="narrow" dateTime={paraAtributoDatetime(data)}>
        {formatarDataCurta(data)}
      </time>
      <div>
        <h3 className={css.titulo}>
          {publicacao.urgencia === 'urgente' ? <span className={css.selo}>Urgente</span> : null}
          {publicacao.titulo}
        </h3>
        <p className={`narrow ${css.resumo}`}>{publicacao.resumo}</p>
      </div>
      <span className={`narrow ${css.org}`}>{publicacao.setor.nome}</span>
    </a>
  )
}
```

```css
/* src/components/mural/LinhaAviso.module.css */
.linha {
  display: grid;
  grid-template-columns: 126px 1fr auto;
  gap: 22px;
  align-items: baseline;
  padding: 17px 0;
  border-bottom: 1px solid var(--regra);
}

.linha time { font-size: 14px; color: var(--cinza); }

.titulo {
  font-size: 18px;
  font-weight: 600;
  line-height: 1.32;
  letter-spacing: -0.012em;
  margin: 0 0 5px;
  transition: color 0.15s ease;
}

.linha:hover .titulo { color: var(--tijolo); }

.selo {
  display: inline-block;
  background: var(--tijolo);
  color: var(--papel);
  padding: 4px 8px;
  border-radius: var(--raio-selo);
  font-size: 11.5px;
  font-weight: 600;
  margin-right: 9px;
  vertical-align: 2px;
}

.resumo { font-size: 15px; line-height: 1.5; color: var(--cinza); margin: 0; max-width: var(--medida-texto); }

.org { font-size: 14px; color: var(--cinza); white-space: nowrap; }
```

- [ ] **Step 6: Escrever o card de evento**

```tsx
// src/components/mural/CardEvento.tsx
import {
  formatarDataExtenso,
  formatarHorario,
  paraAtributoDatetime,
} from '@/lib/formato/datas'
import type { PublicacaoDoMural } from '@/lib/publicacoes/tipos'
import css from './CardEvento.module.css'

export function CardEvento({ publicacao }: { publicacao: PublicacaoDoMural }) {
  const inicio = publicacao.inicioEm
  return (
    <a className={css.card} href={`/p/${publicacao.slug}`}>
      {publicacao.imagemUrl ? (
        <img className={css.foto} src={publicacao.imagemUrl} alt={publicacao.imagemAlt ?? ''} />
      ) : null}

      {inicio ? (
        <p className={css.dia}>
          <time dateTime={paraAtributoDatetime(inicio)}>{formatarDataExtenso(inicio)}</time>
        </p>
      ) : null}

      <h3 className={css.titulo}>{publicacao.titulo}</h3>
      <p className={`narrow ${css.resumo}`}>{publicacao.resumo}</p>

      <dl className={`narrow ${css.fatos}`}>
        {inicio ? (
          <>
            <dt>Horário</dt>
            <dd>{formatarHorario(inicio, publicacao.fimEm)}</dd>
          </>
        ) : null}
        {publicacao.local ? (
          <>
            <dt>Local</dt>
            <dd>{publicacao.local}</dd>
          </>
        ) : null}
        {publicacao.vagasRestantes !== null ? (
          <>
            <dt>Vagas</dt>
            <dd>{publicacao.vagasRestantes} restantes</dd>
          </>
        ) : null}
      </dl>
    </a>
  )
}
```

```css
/* src/components/mural/CardEvento.module.css */
.card { display: block; }

.foto {
  width: 100%;
  aspect-ratio: 3 / 2;
  object-fit: cover;
  border-radius: var(--raio-imagem);
}

.dia { font-size: 13px; font-weight: 600; color: var(--tijolo); margin: 15px 0 8px; }

.titulo {
  font-size: 21px;
  font-weight: 600;
  line-height: 1.26;
  letter-spacing: -0.025em;
  color: var(--ardosia);
  margin: 0 0 9px;
  transition: color 0.15s ease;
}

.card:hover .titulo { color: var(--tijolo); }

.resumo { font-size: 15.5px; line-height: 1.5; color: var(--cinza); margin: 0 0 13px; max-width: 48ch; }

.fatos {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 5px 14px;
  margin: 0;
  font-size: 15px;
  line-height: 1.45;
}

.fatos dt { color: var(--cinza); }

.fatos dd { margin: 0; }
```

- [ ] **Step 7: Escrever a linha de prazo**

```tsx
// src/components/mural/LinhaPrazo.tsx
import { formatarDataExtenso, paraAtributoDatetime } from '@/lib/formato/datas'
import { estadoDoPrazo, rotuloContagem } from '@/lib/publicacoes/exibicao'
import type { PublicacaoDoMural } from '@/lib/publicacoes/tipos'
import css from './LinhaPrazo.module.css'

export function LinhaPrazo({
  publicacao,
  agora,
}: {
  publicacao: PublicacaoDoMural
  agora: Date
}) {
  const prazo = publicacao.prazoFinal
  if (!prazo) return null

  return (
    <a className={css.linha} href={`/p/${publicacao.slug}`}>
      <div>
        <h3 className={css.titulo}>{publicacao.titulo}</h3>
        <span className={`narrow ${css.sub}`}>{publicacao.resumo}</span>
      </div>
      <span className={`narrow ${css.ate}`}>
        Até <time dateTime={paraAtributoDatetime(prazo)}>{formatarDataExtenso(prazo)}</time>
      </span>
      <span className={css.falta} data-estado={estadoDoPrazo(prazo, agora)}>
        {rotuloContagem(prazo, agora)}
      </span>
    </a>
  )
}
```

```css
/* src/components/mural/LinhaPrazo.module.css */
.linha {
  display: grid;
  grid-template-columns: 1fr auto auto;
  gap: 20px;
  align-items: center;
  padding: 15px 0;
  border-bottom: 1px solid var(--regra);
}

.titulo {
  font-size: 17px;
  font-weight: 600;
  line-height: 1.32;
  letter-spacing: -0.012em;
  margin: 0 0 4px;
  transition: color 0.15s ease;
}

.linha:hover .titulo { color: var(--tijolo); }

.sub { font-size: 14.5px; color: var(--cinza); }

.ate { font-size: 15px; color: var(--cinza); text-align: right; white-space: nowrap; }

.falta {
  font-size: 13px;
  font-weight: 600;
  padding: 7px 11px;
  border-radius: 6px;
  white-space: nowrap;
  background: var(--papel);
  border: 1px solid var(--regra);
  color: var(--cinza);
}

/* O texto já diz "Faltam N dias"; a cor apenas reforça. */
.falta[data-estado='apertado'] {
  background: var(--tijolo);
  border-color: var(--tijolo);
  color: var(--papel);
}

.falta[data-estado='vencido'] { opacity: 0.65; }
```

- [ ] **Step 8: Escrever a nota de comunidade**

```tsx
// src/components/mural/NotaComunidade.tsx
import { formatarDataCompleta, paraAtributoDatetime } from '@/lib/formato/datas'
import type { PublicacaoDoMural } from '@/lib/publicacoes/tipos'
import css from './NotaComunidade.module.css'

export function NotaComunidade({
  publicacao,
  variante,
}: {
  publicacao: PublicacaoDoMural
  variante: 'destaque' | 'compacta'
}) {
  const data = publicacao.publicadoEm ?? publicacao.criadoEm
  const href = `/p/${publicacao.slug}`

  if (variante === 'compacta') {
    return (
      <a className={css.compacta} href={href}>
        <span className={`narrow ${css.procedencia}`}>
          <time dateTime={paraAtributoDatetime(data)}>{formatarDataCompleta(data)}</time>
          {' — '}
          {publicacao.setor.nome}
        </span>
        <h3 className={css.manchete}>{publicacao.titulo}</h3>
      </a>
    )
  }

  return (
    <a className={css.destaque} href={href}>
      {publicacao.imagemUrl ? (
        <img className={css.foto} src={publicacao.imagemUrl} alt={publicacao.imagemAlt ?? ''} />
      ) : null}
      <h3 className={css.titulo}>{publicacao.titulo}</h3>
      <p className={`narrow ${css.resumo}`}>{publicacao.resumo}</p>
      <p className={`narrow ${css.credito}`}>
        {publicacao.pessoasCitadas ? <strong>{publicacao.pessoasCitadas}</strong> : null}
        {publicacao.pessoasCitadas ? <br /> : null}
        <time dateTime={paraAtributoDatetime(data)}>{formatarDataCompleta(data)}</time>
        {', publicado por '}
        {publicacao.setor.nome}
      </p>
    </a>
  )
}
```

```css
/* src/components/mural/NotaComunidade.module.css */
.destaque { display: block; }

.foto {
  width: 100%;
  aspect-ratio: 16 / 10;
  object-fit: cover;
  border-radius: var(--raio-imagem);
}

.titulo {
  font-size: 27px;
  font-weight: 600;
  line-height: 1.19;
  letter-spacing: -0.032em;
  color: var(--ardosia);
  margin: 16px 0 11px;
  max-width: 21ch;
  transition: color 0.15s ease;
}

.destaque:hover .titulo { color: var(--tijolo); }

.resumo { font-size: 16.5px; line-height: 1.55; color: var(--cinza); margin: 0 0 14px; max-width: 52ch; }

.credito {
  font-size: 14.5px;
  line-height: 1.5;
  color: var(--cinza);
  border-top: 1px solid var(--regra);
  padding-top: 12px;
  margin: 0;
}

.credito strong { color: var(--tinta); font-weight: 600; }

.compacta { display: block; padding: 14px 0; border-bottom: 1px solid var(--regra); }

.procedencia { display: block; font-size: 13.5px; color: var(--cinza); margin-bottom: 5px; }

.manchete {
  font-size: 16px;
  font-weight: 600;
  line-height: 1.34;
  letter-spacing: -0.012em;
  margin: 0;
  transition: color 0.15s ease;
}

.compacta:hover .manchete { color: var(--tijolo); }
```

- [ ] **Step 9: Rodar e confirmar que passa**

Run: `npx vitest run tests/unidade/componentes-mural.test.tsx`
Expected: PASS — 17 testes.

- [ ] **Step 10: Commit**

```bash
git add src/components/mural tests/unidade/componentes-mural.test.tsx tests/unidade/ajuda
git commit -m "feat: componentes de conteudo com dominante visual por tipo

Quatro componentes diferentes em vez de um card generico com variacoes:
aviso domina pela urgencia, evento pelo quando e onde, prazo pela
contagem, noticia pela imagem. Rolando a pagina da para identificar o
tipo pela silhueta antes de ler qualquer palavra.

O estado do prazo vai num data-estado, e nao so na cor, e o texto ja diz
'Faltam N dias' por extenso: cor nunca e o unico portador de informacao.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 11: Home do mural

O hero com o aviso mais importante do momento, seguido das quatro seções. É a primeira página que um aluno abre, e o objetivo da spec é que ele descubra o prazo mais próximo sem usar busca nem filtro.

**Files:**
- Create: `src/components/mural/Hero.tsx` + `.module.css`
- Create: `src/lib/publicacoes/destaque.ts`
- Modify: `src/app/page.tsx`
- Create: `src/app/pagina.module.css`
- Test: `tests/unidade/destaque.test.ts`, `tests/unidade/hero.test.tsx`

**Interfaces:**
- Consumes: `listarMural`, `contarVigentes` de `@/lib/publicacoes/consultas`; componentes da Task 10
- Produces:
  - `escolherDestaque(itens: PublicacaoDoMural[]): PublicacaoDoMural | null`
  - `<Hero publicacao={PublicacaoDoMural} />`

- [ ] **Step 1: Escrever o teste de escolha do destaque**

```ts
// tests/unidade/destaque.test.ts
import { describe, it, expect } from 'vitest'
import { escolherDestaque } from '@/lib/publicacoes/destaque'
import { criarPublicacao } from './ajuda/publicacao'

describe('escolherDestaque', () => {
  it('prefere o aviso marcado como destaque', () => {
    const itens = [
      criarPublicacao({ slug: 'urgente-sem-destaque', tipo: 'aviso', urgencia: 'urgente' }),
      criarPublicacao({ slug: 'fixado', tipo: 'aviso', destaque: true, urgencia: 'importante' }),
    ]
    expect(escolherDestaque(itens)?.slug).toBe('fixado')
  })

  it('cai para o aviso urgente quando não há destaque', () => {
    const itens = [
      criarPublicacao({ slug: 'noticia', tipo: 'noticia' }),
      criarPublicacao({ slug: 'urgente', tipo: 'aviso', urgencia: 'urgente' }),
    ]
    expect(escolherDestaque(itens)?.slug).toBe('urgente')
  })

  it('cai para o primeiro item quando não há aviso urgente', () => {
    const itens = [
      criarPublicacao({ slug: 'primeiro', tipo: 'evento' }),
      criarPublicacao({ slug: 'segundo', tipo: 'noticia' }),
    ]
    expect(escolherDestaque(itens)?.slug).toBe('primeiro')
  })

  it('devolve null com a lista vazia', () => {
    expect(escolherDestaque([])).toBeNull()
  })
})
```

- [ ] **Step 2: Implementar a escolha**

```ts
// src/lib/publicacoes/destaque.ts
import type { PublicacaoDoMural } from '@/lib/publicacoes/tipos'

/**
 * O que ocupa o topo da home. A lista já chega ordenada por
 * ordenarMural, então o primeiro item é o fallback natural.
 */
export function escolherDestaque(itens: PublicacaoDoMural[]): PublicacaoDoMural | null {
  if (itens.length === 0) return null

  const fixado = itens.find((i) => i.destaque && i.tipo === 'aviso')
  if (fixado) return fixado

  const urgente = itens.find((i) => i.tipo === 'aviso' && i.urgencia === 'urgente')
  if (urgente) return urgente

  return itens[0]
}
```

- [ ] **Step 3: Escrever o teste do hero**

```tsx
// tests/unidade/hero.test.tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { Hero } from '@/components/mural/Hero'
import { criarPublicacao } from './ajuda/publicacao'

const aviso = criarPublicacao({
  tipo: 'aviso',
  titulo: 'Calendário do 2º semestre tem início antecipado',
  resumo: 'As novas datas valem para todos os cursos.',
  urgencia: 'urgente',
  documentoNumero: '042/2026',
  imagemUrl: 'https://exemplo.org/patio.jpg',
  imagemAlt: 'Estudantes no pátio central da Fatec Campinas',
  anexos: [{ url: 'https://exemplo.org/edital.pdf', nome: 'Edital 042/2026', bytes: 389120, mime: 'application/pdf' }],
})

describe('Hero', () => {
  it('usa h1, porque é o título principal da página', () => {
    render(<Hero publicacao={aviso} />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Calendário do 2º semestre')
  })

  it('identifica documento, setor e data acima do título', () => {
    render(<Hero publicacao={aviso} />)
    expect(screen.getByText(/Comunicado 042\/2026/)).toBeInTheDocument()
    expect(screen.getByText(/Secretaria Acadêmica/)).toBeInTheDocument()
  })

  it('oferece leitura e o anexo, com o tamanho do arquivo', () => {
    render(<Hero publicacao={aviso} />)
    expect(screen.getByRole('link', { name: 'Ler o comunicado' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Baixar edital/ })).toHaveAttribute(
      'href',
      'https://exemplo.org/edital.pdf',
    )
    expect(screen.getByText(/380 KB/)).toBeInTheDocument()
  })

  it('não oferece anexo quando não há', () => {
    render(<Hero publicacao={criarPublicacao({ ...aviso, anexos: null })} />)
    expect(screen.queryByRole('link', { name: /Baixar/ })).not.toBeInTheDocument()
  })

  it('marca a foto de fundo como decorativa, já que o texto está por cima', () => {
    const { container } = render(<Hero publicacao={aviso} />)
    expect(container.querySelector('img')).toHaveAttribute('alt', 'Estudantes no pátio central da Fatec Campinas')
  })
})
```

- [ ] **Step 4: Rodar e confirmar que falha**

Run: `npx vitest run tests/unidade/destaque.test.ts tests/unidade/hero.test.tsx`
Expected: FAIL — `@/components/mural/Hero` não encontrado.

- [ ] **Step 5: Implementar o hero**

```tsx
// src/components/mural/Hero.tsx
import { formatarDataCompleta, paraAtributoDatetime } from '@/lib/formato/datas'
import type { PublicacaoDoMural } from '@/lib/publicacoes/tipos'
import css from './Hero.module.css'

function emKb(bytes: number): string {
  return `${Math.round(bytes / 1024)} KB`
}

export function Hero({ publicacao }: { publicacao: PublicacaoDoMural }) {
  const data = publicacao.publicadoEm ?? publicacao.criadoEm
  const anexo = publicacao.anexos?.[0] ?? null

  const identificacao = [
    publicacao.documentoNumero ? `Comunicado ${publicacao.documentoNumero}` : null,
    publicacao.setor.nome,
  ]
    .filter(Boolean)
    .join(' — ')

  return (
    <section className={css.hero}>
      {publicacao.imagemUrl ? (
        <img className={css.fundo} src={publicacao.imagemUrl} alt={publicacao.imagemAlt ?? ''} />
      ) : null}

      <div className={css.veu}>
        <div className="pagina">
          <div className={css.caixa}>
            <p className={css.identificacao}>
              {identificacao}
              {' — '}
              <time dateTime={paraAtributoDatetime(data)}>{formatarDataCompleta(data)}</time>
            </p>
            <h1 className={css.titulo}>{publicacao.titulo}</h1>
            <p className={`narrow ${css.resumo}`}>{publicacao.resumo}</p>
            <div className={css.acoes}>
              <a className={css.acao} href={`/p/${publicacao.slug}`}>Ler o comunicado</a>
              {anexo ? (
                <a className={`${css.acao} ${css.claro}`} href={anexo.url}>
                  Baixar edital ({emKb(anexo.bytes)})
                </a>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
```

```css
/* src/components/mural/Hero.module.css */
.hero { position: relative; background: var(--ardosia-escura); }

.fundo { width: 100%; height: 400px; object-fit: cover; opacity: 0.44; }

.veu {
  position: absolute;
  inset: auto 0 0 0;
  background: linear-gradient(to top, rgba(51, 69, 78, 0.94) 12%, rgba(51, 69, 78, 0));
  padding-top: 66px;
  padding-bottom: 34px;
}

.caixa { max-width: 614px; border-left: 4px solid var(--tijolo); padding-left: 22px; }

.identificacao { font-size: 12.5px; font-weight: 600; color: #f3b9ba; margin: 0 0 12px; }

.titulo {
  font-size: 38px;
  font-weight: 600;
  line-height: 1.15;
  letter-spacing: -0.033em;
  color: var(--papel);
  margin: 0 0 13px;
}

.resumo {
  font-size: 17.5px;
  line-height: 1.5;
  color: rgba(255, 255, 255, 0.88);
  margin: 0 0 21px;
  max-width: 56ch;
}

.acoes { display: flex; gap: 8px; flex-wrap: wrap; }

.acao {
  display: inline-block;
  background: var(--tijolo);
  color: var(--papel);
  padding: 12px 20px;
  border-radius: var(--raio-controle);
  font-size: 14.5px;
  font-weight: 600;
  transition: background 0.18s ease;
}

.acao:hover { background: var(--tijolo-escuro); }

.claro { background: var(--papel); color: var(--ardosia-escura); }

.claro:hover { background: #dfe5e8; }
```

- [ ] **Step 6: Escrever a home**

```tsx
// src/app/page.tsx
import { db } from '@/lib/db/client'
import { listarMural, contarVigentes } from '@/lib/publicacoes/consultas'
import { escolherDestaque } from '@/lib/publicacoes/destaque'
import { Navegacao } from '@/components/layout/Navegacao'
import { Hero } from '@/components/mural/Hero'
import { TituloSecao } from '@/components/mural/TituloSecao'
import { LinhaAviso } from '@/components/mural/LinhaAviso'
import { CardEvento } from '@/components/mural/CardEvento'
import { LinhaPrazo } from '@/components/mural/LinhaPrazo'
import { NotaComunidade } from '@/components/mural/NotaComunidade'
import css from './pagina.module.css'

export const revalidate = 300

export default async function Home() {
  const agora = new Date()
  const [itens, total] = await Promise.all([
    listarMural(db, agora),
    contarVigentes(db, agora),
  ])

  const destaque = escolherDestaque(itens)
  const restantes = itens.filter((i) => i.id !== destaque?.id)

  const avisos = restantes.filter((i) => i.tipo === 'aviso').slice(0, 4)
  const eventos = restantes.filter((i) => i.tipo === 'evento').slice(0, 2)
  const prazos = restantes.filter((i) => i.tipo === 'prazo').slice(0, 4)
  const noticias = restantes.filter((i) => i.tipo === 'noticia')

  return (
    <>
      <Navegacao ativo="/" />
      {destaque ? <Hero publicacao={destaque} /> : null}

      <main id="conteudo">
        <p className={`narrow pagina ${css.contagem}`}>
          <strong>{total}</strong> {total === 1 ? 'publicação' : 'publicações'} no mural agora
        </p>

        {avisos.length > 0 ? (
          <section className={`pagina ${css.secao}`}>
            <TituloSecao titulo="Avisos e comunicados" verTodos={{ href: '/avisos', rotulo: 'Ver todos os avisos' }} />
            <div className={css.lista}>
              {avisos.map((a) => <LinhaAviso key={a.id} publicacao={a} />)}
            </div>
          </section>
        ) : null}

        {eventos.length > 0 ? (
          <section className={css.lavada}>
            <div className="pagina">
              <TituloSecao titulo="Acontece no campus" verTodos={{ href: '/eventos', rotulo: 'Ver todos os eventos' }} />
              <div className={css.doisPorLinha}>
                {eventos.map((e) => <CardEvento key={e.id} publicacao={e} />)}
              </div>
            </div>
          </section>
        ) : null}

        {prazos.length > 0 ? (
          <section className={`pagina ${css.secao}`}>
            <TituloSecao titulo="Prazos abertos" verTodos={{ href: '/prazos', rotulo: 'Ver todos os prazos' }} />
            <div className={css.lista}>
              {prazos.map((p) => <LinhaPrazo key={p.id} publicacao={p} agora={agora} />)}
            </div>
          </section>
        ) : null}

        {noticias.length > 0 ? (
          <section className={css.lavada}>
            <div className="pagina">
              <TituloSecao titulo="Comunidade acadêmica" verTodos={{ href: '/comunidade', rotulo: 'Ver mais notícias' }} />
              <div className={css.comunidade}>
                <NotaComunidade publicacao={noticias[0]} variante="destaque" />
                <div>
                  {noticias.slice(1, 5).map((n) => (
                    <NotaComunidade key={n.id} publicacao={n} variante="compacta" />
                  ))}
                </div>
              </div>
            </div>
          </section>
        ) : null}
      </main>
    </>
  )
}
```

```css
/* src/app/pagina.module.css */
.contagem { font-size: 14px; color: var(--cinza); padding-top: 20px; margin: 0; }

.secao { padding: 30px 0 6px; }

.lavada { background: var(--lavado); padding: 44px 0; margin-top: 34px; }

.lista { border-top: 1px solid var(--regra); }

.doisPorLinha { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; }

.comunidade { display: grid; grid-template-columns: 1.4fr 1fr; gap: 34px; }
```

- [ ] **Step 7: Rodar os testes**

Run: `npm test`
Expected: PASS — toda a suíte.

- [ ] **Step 8: Conferir no navegador**

Run: `npm run dev`
Expected: hero com o aviso em destaque, contagem de publicações, e as quatro seções. O aviso vencido do seed **não** aparece.

- [ ] **Step 9: Commit**

```bash
git add src/app/page.tsx src/app/pagina.module.css src/components/mural/Hero.tsx src/components/mural/Hero.module.css src/lib/publicacoes/destaque.ts tests/unidade/destaque.test.ts tests/unidade/hero.test.tsx
git commit -m "feat: home do mural com hero e as quatro secoes

O hero carrega o aviso mais importante do momento em vez de uma frase
institucional: quem abre o mural precisa saber o que mudou hoje, nao
que a faculdade existe.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 12: Listagens por tipo e página da publicação

Quatro rotas de listagem que compartilham um componente, e a página individual — que continua acessível mesmo depois de a publicação sair do mural.

**Files:**
- Create: `src/components/mural/ListagemPorTipo.tsx`
- Create: `src/app/avisos/page.tsx`, `src/app/eventos/page.tsx`, `src/app/prazos/page.tsx`, `src/app/comunidade/page.tsx`
- Create: `src/app/p/[slug]/page.tsx` + `pagina.module.css`
- Test: `tests/integracao/rotas.test.ts`

**Interfaces:**
- Consumes: `listarPorTipo`, `buscarPorSlug` de `@/lib/publicacoes/consultas`; componentes da Task 10
- Produces: `<ListagemPorTipo tipo titulo descricao />` — Server Component assíncrono

- [ ] **Step 1: Escrever a listagem compartilhada**

```tsx
// src/components/mural/ListagemPorTipo.tsx
import { db } from '@/lib/db/client'
import { listarPorTipo } from '@/lib/publicacoes/consultas'
import type { TipoPublicacao } from '@/lib/publicacoes/tipos'
import { CAMINHO_TIPO } from '@/lib/publicacoes/tipos'
import { Navegacao } from '@/components/layout/Navegacao'
import { LinhaAviso } from './LinhaAviso'
import { CardEvento } from './CardEvento'
import { LinhaPrazo } from './LinhaPrazo'
import { NotaComunidade } from './NotaComunidade'
import css from '@/app/pagina.module.css'

export async function ListagemPorTipo({
  tipo,
  titulo,
  descricao,
}: {
  tipo: TipoPublicacao
  titulo: string
  descricao: string
}) {
  const agora = new Date()
  const itens = await listarPorTipo(db, tipo, agora)

  return (
    <>
      <Navegacao ativo={CAMINHO_TIPO[tipo]} />
      <main id="conteudo" className={`pagina ${css.secao}`}>
        <h1>{titulo}</h1>
        <p className="narrow">{descricao}</p>

        {itens.length === 0 ? (
          <p className="narrow">Nada publicado nesta seção no momento.</p>
        ) : tipo === 'evento' ? (
          <div className={css.doisPorLinha}>
            {itens.map((i) => <CardEvento key={i.id} publicacao={i} />)}
          </div>
        ) : (
          <div className={css.lista}>
            {itens.map((i) =>
              tipo === 'aviso' ? <LinhaAviso key={i.id} publicacao={i} />
              : tipo === 'prazo' ? <LinhaPrazo key={i.id} publicacao={i} agora={agora} />
              : <NotaComunidade key={i.id} publicacao={i} variante="compacta" />,
            )}
          </div>
        )}
      </main>
    </>
  )
}
```

- [ ] **Step 2: Escrever as quatro rotas**

```tsx
// src/app/avisos/page.tsx
import { ListagemPorTipo } from '@/components/mural/ListagemPorTipo'

export const revalidate = 300
export const metadata = { title: 'Avisos e comunicados — Mural da Fatec Campinas' }

export default function Pagina() {
  return (
    <ListagemPorTipo
      tipo="aviso"
      titulo="Avisos e comunicados"
      descricao="Comunicados oficiais das unidades da faculdade, do mais recente ao mais antigo."
    />
  )
}
```

```tsx
// src/app/eventos/page.tsx
import { ListagemPorTipo } from '@/components/mural/ListagemPorTipo'

export const revalidate = 300
export const metadata = { title: 'Eventos do campus — Mural da Fatec Campinas' }

export default function Pagina() {
  return (
    <ListagemPorTipo
      tipo="evento"
      titulo="Acontece no campus"
      descricao="Palestras, semanas acadêmicas, workshops e feiras da unidade."
    />
  )
}
```

```tsx
// src/app/prazos/page.tsx
import { ListagemPorTipo } from '@/components/mural/ListagemPorTipo'

export const revalidate = 300
export const metadata = { title: 'Prazos acadêmicos — Mural da Fatec Campinas' }

export default function Pagina() {
  return (
    <ListagemPorTipo
      tipo="prazo"
      titulo="Prazos abertos"
      descricao="Matrícula, trancamento, inscrições, bolsas e entregas, do que vence antes ao que vence depois."
    />
  )
}
```

```tsx
// src/app/comunidade/page.tsx
import { ListagemPorTipo } from '@/components/mural/ListagemPorTipo'

export const revalidate = 300
export const metadata = { title: 'Comunidade acadêmica — Mural da Fatec Campinas' }

export default function Pagina() {
  return (
    <ListagemPorTipo
      tipo="noticia"
      titulo="Comunidade acadêmica"
      descricao="Conquistas, publicações e resultados de alunos e professores da unidade."
    />
  )
}
```

- [ ] **Step 3: Escrever a página da publicação**

```tsx
// src/app/p/[slug]/page.tsx
import { notFound } from 'next/navigation'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { db } from '@/lib/db/client'
import { buscarPorSlug } from '@/lib/publicacoes/consultas'
import { estaVigente, estadoDoPrazo, rotuloContagem } from '@/lib/publicacoes/exibicao'
import {
  formatarDataCompleta,
  formatarDataExtenso,
  formatarHorario,
  paraAtributoDatetime,
} from '@/lib/formato/datas'
import { ROTULO_TIPO } from '@/lib/publicacoes/tipos'
import css from './pagina.module.css'

export const revalidate = 300

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const p = await buscarPorSlug(db, slug)
  if (!p) return { title: 'Publicação não encontrada — Mural da Fatec Campinas' }
  return { title: `${p.titulo} — Mural da Fatec Campinas`, description: p.resumo }
}

export default async function Pagina({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const p = await buscarPorSlug(db, slug)
  if (!p) notFound()

  const agora = new Date()
  const data = p.publicadoEm ?? p.criadoEm
  const vigente = estaVigente(p, agora)

  return (
    <main id="conteudo" className={`pagina ${css.pagina}`}>
      <article>
        <p className={`narrow ${css.procedencia}`}>
          {ROTULO_TIPO[p.tipo]} — {p.setor.nome} —{' '}
          <time dateTime={paraAtributoDatetime(data)}>{formatarDataCompleta(data)}</time>
          {p.documentoNumero ? ` — Comunicado ${p.documentoNumero}` : null}
        </p>

        <h1 className={css.titulo}>{p.titulo}</h1>
        <p className={`narrow ${css.resumo}`}>{p.resumo}</p>

        {!vigente ? (
          <p className={css.arquivada}>
            Esta publicação saiu do mural em{' '}
            <time dateTime={paraAtributoDatetime(p.expiraEm)}>
              {formatarDataCompleta(p.expiraEm)}
            </time>
            . O texto segue disponível para consulta.
          </p>
        ) : null}

        {p.imagemUrl ? (
          <figure className={css.figura}>
            <img src={p.imagemUrl} alt={p.imagemAlt ?? ''} />
            {p.creditoFoto ? <figcaption className="narrow">Foto: {p.creditoFoto}</figcaption> : null}
          </figure>
        ) : null}

        {p.tipo === 'evento' && p.inicioEm ? (
          <dl className={`narrow ${css.fatos}`}>
            <dt>Quando</dt>
            <dd>
              <time dateTime={paraAtributoDatetime(p.inicioEm)}>{formatarDataExtenso(p.inicioEm)}</time>
              , {formatarHorario(p.inicioEm, p.fimEm)}
            </dd>
            {p.local ? (<><dt>Onde</dt><dd>{p.local}</dd></>) : null}
            {p.vagasRestantes !== null ? (<><dt>Vagas</dt><dd>{p.vagasRestantes} restantes</dd></>) : null}
          </dl>
        ) : null}

        {p.tipo === 'prazo' && p.prazoFinal ? (
          <dl className={`narrow ${css.fatos}`}>
            <dt>Data-limite</dt>
            <dd>
              <time dateTime={paraAtributoDatetime(p.prazoFinal)}>
                {formatarDataExtenso(p.prazoFinal)}
              </time>
            </dd>
            <dt>Situação</dt>
            <dd data-estado={estadoDoPrazo(p.prazoFinal, agora)}>
              {rotuloContagem(p.prazoFinal, agora)}
            </dd>
          </dl>
        ) : null}

        <div className={css.corpo}>
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{p.corpo}</ReactMarkdown>
        </div>

        {p.pessoasCitadas ? (
          <p className={`narrow ${css.pessoas}`}>{p.pessoasCitadas}</p>
        ) : null}

        {p.anexos && p.anexos.length > 0 ? (
          <section className={css.anexos}>
            <h2>Anexos</h2>
            <ul>
              {p.anexos.map((a) => (
                <li key={a.url} className="narrow">
                  <a href={a.url}>{a.nome}</a> ({Math.round(a.bytes / 1024)} KB)
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {p.cursos.length > 0 ? (
          <p className={`narrow ${css.cursos}`}>
            Vale para: {p.cursos.map((c) => c.nome).join(', ')}.
          </p>
        ) : null}
      </article>
    </main>
  )
}
```

```css
/* src/app/p/[slug]/pagina.module.css */
.pagina { padding: 34px 0 20px; max-width: 820px; }

.procedencia { font-size: 14px; color: var(--cinza); margin: 0 0 12px; }

.titulo { font-size: 36px; font-weight: 700; line-height: 1.16; letter-spacing: -0.035em; margin: 0 0 14px; }

.resumo { font-size: 19px; line-height: 1.5; color: var(--cinza); margin: 0 0 24px; max-width: var(--medida-texto); }

.arquivada {
  border-left: 4px solid var(--ardosia);
  background: var(--lavado);
  padding: 14px 18px;
  margin: 0 0 24px;
  font-size: 15px;
}

.figura { margin: 0 0 24px; }

.figura img { width: 100%; border-radius: var(--raio-imagem); }

.figura figcaption { font-size: 13.5px; color: var(--cinza); margin-top: 8px; }

.fatos {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 8px 20px;
  border-top: 1px solid var(--regra);
  border-bottom: 1px solid var(--regra);
  padding: 16px 0;
  margin: 0 0 24px;
  font-size: 16px;
}

.fatos dt { color: var(--cinza); }

.fatos dd { margin: 0; }

.fatos dd[data-estado='apertado'] { color: var(--tijolo); font-weight: 600; }

.corpo { font-size: 17px; line-height: 1.65; max-width: var(--medida-texto); }

.corpo p { margin: 0 0 1em; }

.pessoas { border-top: 1px solid var(--regra); padding-top: 14px; margin-top: 26px; font-weight: 600; }

.anexos { margin-top: 30px; border-top: 2px solid var(--ardosia); padding-top: 14px; }

.anexos h2 { font-size: 17px; font-weight: 700; color: var(--ardosia); margin: 0 0 10px; }

.anexos ul { margin: 0; padding-left: 20px; }

.anexos a { color: var(--tijolo); text-decoration: underline; }

.cursos { margin-top: 22px; font-size: 14.5px; color: var(--cinza); }
```

- [ ] **Step 4: Escrever o teste de integração das rotas**

```ts
// tests/integracao/rotas.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { criarBancoDeTeste } from './ajuda/banco'
import { semear } from '@/lib/db/seed'
import { buscarPorSlug, listarPorTipo } from '@/lib/publicacoes/consultas'
import { estaVigente } from '@/lib/publicacoes/exibicao'

const agora = new Date('2026-09-08T12:00:00Z')
let ctx: Awaited<ReturnType<typeof criarBancoDeTeste>>

beforeAll(async () => {
  ctx = await criarBancoDeTeste()
  await semear(ctx.db, agora)
})
afterAll(async () => { await ctx.encerrar() })

describe('dados das rotas de listagem', () => {
  it.each(['aviso', 'evento', 'prazo', 'noticia'] as const)(
    'a listagem de %s traz só itens vigentes desse tipo',
    async (tipo) => {
      const itens = await listarPorTipo(ctx.db, tipo, agora)
      expect(itens.length).toBeGreaterThan(0)
      expect(itens.every((i) => i.tipo === tipo)).toBe(true)
      expect(itens.every((i) => estaVigente(i, agora))).toBe(true)
    },
  )
})

describe('dados da página da publicação', () => {
  it('a publicação vencida é encontrada e reconhecida como fora do mural', async () => {
    const p = await buscarPorSlug(ctx.db, 'manutencao-eletrica-no-bloco-c')
    expect(p).not.toBeNull()
    expect(estaVigente(p!, agora)).toBe(false)
  })

  it('a publicação vigente traz o corpo em markdown', async () => {
    const p = await buscarPorSlug(ctx.db, 'alteracao-no-calendario-academico-do-2-semestre')
    expect(p!.corpo).toContain('edital anexo')
  })
})
```

- [ ] **Step 5: Rodar toda a suíte**

Run: `npm test`
Expected: PASS.

- [ ] **Step 6: Conferir as rotas no navegador**

Run: `npm run dev`

Abrir, uma a uma: `/avisos`, `/eventos`, `/prazos`, `/comunidade`, e depois `/p/manutencao-eletrica-no-bloco-c`.

Expected: a última abre normalmente e mostra o aviso de que saiu do mural, com a data. Ela **não** aparece em `/avisos`.

- [ ] **Step 7: Commit**

```bash
git add src/app src/components/mural/ListagemPorTipo.tsx tests/integracao/rotas.test.ts
git commit -m "feat: listagens por tipo e pagina da publicacao

A pagina individual nao filtra por validade e avisa, em texto, quando a
publicacao ja saiu do mural. Um edital citado num documento oficial
continua abrindo meses depois, em vez de virar 404.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 13: Filtros na URL

O estado dos filtros vive na query string, não em estado de componente. Assim uma busca filtrada tem URL própria, pode ser colada num grupo de WhatsApp, e o botão voltar do navegador funciona.

**Files:**
- Create: `src/lib/busca/filtros.ts`
- Test: `tests/unidade/filtros.test.ts`

**Interfaces:**
- Consumes: `TipoPublicacao` de `@/lib/publicacoes/tipos`
- Produces:
  - `type Periodo = 'semana' | 'trinta' | 'qualquer'`
  - `type Ordem = 'recentes' | 'prazo'`
  - `type Filtros = { q: string; curso: string | null; tipo: TipoPublicacao | null; periodo: Periodo; ordem: Ordem }`
  - `FILTROS_PADRAO: Filtros`
  - `lerFiltros(params: Record<string, string | string[] | undefined>): Filtros`
  - `escreverFiltros(f: Filtros): string` — query string sem `?`, omitindo o que é padrão
  - `semFiltro(f: Filtros, chave: 'curso' | 'tipo' | 'periodo'): Filtros`
  - `descreverAtivos(f: Filtros, nomesDeCurso: Record<string, string>): { chave, rotulo, href }[]`

- [ ] **Step 1: Escrever o teste que falha**

```ts
// tests/unidade/filtros.test.ts
import { describe, it, expect } from 'vitest'
import {
  lerFiltros, escreverFiltros, semFiltro, descreverAtivos, FILTROS_PADRAO,
} from '@/lib/busca/filtros'

describe('lerFiltros', () => {
  it('usa os padrões com a query vazia', () => {
    expect(lerFiltros({})).toEqual(FILTROS_PADRAO)
  })

  it('lê os valores da query', () => {
    expect(lerFiltros({ q: 'monitoria', curso: 'ads', tipo: 'aviso', periodo: 'semana', ordem: 'prazo' }))
      .toEqual({ q: 'monitoria', curso: 'ads', tipo: 'aviso', periodo: 'semana', ordem: 'prazo' })
  })

  it('ignora tipo desconhecido em vez de quebrar', () => {
    expect(lerFiltros({ tipo: 'recado' }).tipo).toBeNull()
  })

  it('ignora período desconhecido', () => {
    expect(lerFiltros({ periodo: 'ontem' }).periodo).toBe('trinta')
  })

  it('usa o primeiro valor quando o parâmetro vem repetido', () => {
    expect(lerFiltros({ q: ['monitoria', 'tcc'] }).q).toBe('monitoria')
  })

  it('remove espaços em volta do termo', () => {
    expect(lerFiltros({ q: '  tcc  ' }).q).toBe('tcc')
  })
})

describe('escreverFiltros', () => {
  it('omite o que está no padrão', () => {
    expect(escreverFiltros(FILTROS_PADRAO)).toBe('')
  })

  it('escreve só o que difere do padrão', () => {
    expect(escreverFiltros({ ...FILTROS_PADRAO, q: 'monitoria', curso: 'ads' }))
      .toBe('q=monitoria&curso=ads')
  })

  it('codifica o termo', () => {
    expect(escreverFiltros({ ...FILTROS_PADRAO, q: 'segurança da informação' }))
      .toBe('q=seguran%C3%A7a+da+informa%C3%A7%C3%A3o')
  })
})

describe('semFiltro', () => {
  it('devolve os filtros sem o curso', () => {
    const f = { ...FILTROS_PADRAO, q: 'tcc', curso: 'ads' }
    expect(semFiltro(f, 'curso')).toEqual({ ...FILTROS_PADRAO, q: 'tcc', curso: null })
  })

  it('devolve o período ao padrão', () => {
    const f = { ...FILTROS_PADRAO, periodo: 'semana' as const }
    expect(semFiltro(f, 'periodo').periodo).toBe('trinta')
  })

  it('não muta a entrada', () => {
    const f = { ...FILTROS_PADRAO, curso: 'ads' }
    semFiltro(f, 'curso')
    expect(f.curso).toBe('ads')
  })
})

describe('descreverAtivos', () => {
  const nomes = { ads: 'Análise e Desenvolvimento de Sistemas' }

  it('não lista nada quando tudo está no padrão', () => {
    expect(descreverAtivos(FILTROS_PADRAO, nomes)).toEqual([])
  })

  it('usa o nome do curso, não o slug', () => {
    const ativos = descreverAtivos({ ...FILTROS_PADRAO, curso: 'ads' }, nomes)
    expect(ativos[0].rotulo).toBe('Curso: Análise e Desenvolvimento de Sistemas')
  })

  it('o link de cada ficha remove só aquele filtro', () => {
    const ativos = descreverAtivos({ ...FILTROS_PADRAO, curso: 'ads', tipo: 'evento' }, nomes)
    const doCurso = ativos.find((a) => a.chave === 'curso')
    expect(doCurso?.href).toBe('/buscar?tipo=evento')
  })

  it('descreve o período por extenso', () => {
    const ativos = descreverAtivos({ ...FILTROS_PADRAO, periodo: 'semana' }, nomes)
    expect(ativos[0].rotulo).toBe('Esta semana')
  })
})
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `npx vitest run tests/unidade/filtros.test.ts`
Expected: FAIL — módulo não encontrado.

- [ ] **Step 3: Implementar**

```ts
// src/lib/busca/filtros.ts
import type { TipoPublicacao } from '@/lib/publicacoes/tipos'

export type Periodo = 'semana' | 'trinta' | 'qualquer'
export type Ordem = 'recentes' | 'prazo'

export type Filtros = {
  q: string
  curso: string | null
  tipo: TipoPublicacao | null
  periodo: Periodo
  ordem: Ordem
}

export const FILTROS_PADRAO: Filtros = {
  q: '',
  curso: null,
  tipo: null,
  periodo: 'trinta',
  ordem: 'recentes',
}

const TIPOS: TipoPublicacao[] = ['aviso', 'evento', 'prazo', 'noticia']
const PERIODOS: Periodo[] = ['semana', 'trinta', 'qualquer']
const ORDENS: Ordem[] = ['recentes', 'prazo']

export const ROTULO_PERIODO: Record<Periodo, string> = {
  semana: 'Esta semana',
  trinta: 'Próximos 30 dias',
  qualquer: 'Qualquer data',
}

function primeiro(valor: string | string[] | undefined): string {
  if (Array.isArray(valor)) return valor[0] ?? ''
  return valor ?? ''
}

export function lerFiltros(params: Record<string, string | string[] | undefined>): Filtros {
  const tipo = primeiro(params.tipo) as TipoPublicacao
  const periodo = primeiro(params.periodo) as Periodo
  const ordem = primeiro(params.ordem) as Ordem
  const curso = primeiro(params.curso).trim()

  return {
    q: primeiro(params.q).trim(),
    curso: curso === '' ? null : curso,
    tipo: TIPOS.includes(tipo) ? tipo : null,
    periodo: PERIODOS.includes(periodo) ? periodo : FILTROS_PADRAO.periodo,
    ordem: ORDENS.includes(ordem) ? ordem : FILTROS_PADRAO.ordem,
  }
}

export function escreverFiltros(f: Filtros): string {
  const p = new URLSearchParams()
  if (f.q) p.set('q', f.q)
  if (f.curso) p.set('curso', f.curso)
  if (f.tipo) p.set('tipo', f.tipo)
  if (f.periodo !== FILTROS_PADRAO.periodo) p.set('periodo', f.periodo)
  if (f.ordem !== FILTROS_PADRAO.ordem) p.set('ordem', f.ordem)
  return p.toString()
}

export function semFiltro(f: Filtros, chave: 'curso' | 'tipo' | 'periodo'): Filtros {
  if (chave === 'periodo') return { ...f, periodo: FILTROS_PADRAO.periodo }
  return { ...f, [chave]: null }
}

function comQuery(f: Filtros): string {
  const qs = escreverFiltros(f)
  return qs ? `/buscar?${qs}` : '/buscar'
}

export function descreverAtivos(
  f: Filtros,
  nomesDeCurso: Record<string, string>,
): { chave: 'curso' | 'tipo' | 'periodo'; rotulo: string; href: string }[] {
  const rotuloTipo: Record<TipoPublicacao, string> = {
    aviso: 'Avisos',
    evento: 'Eventos',
    prazo: 'Prazos',
    noticia: 'Comunidade',
  }

  const fichas: { chave: 'curso' | 'tipo' | 'periodo'; rotulo: string; href: string }[] = []

  if (f.curso) {
    fichas.push({
      chave: 'curso',
      rotulo: `Curso: ${nomesDeCurso[f.curso] ?? f.curso}`,
      href: comQuery(semFiltro(f, 'curso')),
    })
  }
  if (f.tipo) {
    fichas.push({
      chave: 'tipo',
      rotulo: `Tipo: ${rotuloTipo[f.tipo]}`,
      href: comQuery(semFiltro(f, 'tipo')),
    })
  }
  if (f.periodo !== FILTROS_PADRAO.periodo) {
    fichas.push({
      chave: 'periodo',
      rotulo: ROTULO_PERIODO[f.periodo],
      href: comQuery(semFiltro(f, 'periodo')),
    })
  }

  return fichas
}
```

- [ ] **Step 4: Rodar e confirmar que passa**

Run: `npx vitest run tests/unidade/filtros.test.ts`
Expected: PASS — 15 testes.

- [ ] **Step 5: Commit**

```bash
git add src/lib/busca/filtros.ts tests/unidade/filtros.test.ts
git commit -m "feat: filtros de busca representados na URL

O estado vive na query string, e nao em estado de componente: uma busca
filtrada tem endereco proprio, pode ser colada num grupo de turma, e o
botao voltar do navegador funciona.

Valor invalido na URL e ignorado em vez de derrubar a pagina. Query
string e entrada de usuario, e alguem sempre edita a mao.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 14: Consulta de busca

A busca full-text em português, os filtros combinados, e as contagens que alimentam a tela vazia.

**Files:**
- Create: `src/lib/busca/consulta.ts`
- Test: `tests/integracao/busca.test.ts`

**Interfaces:**
- Consumes: `Filtros` de `@/lib/busca/filtros`; `Db`; `PublicacaoDoMural`
- Produces:
  - `buscar(db: Db, f: Filtros, agora: Date): Promise<{ itens: PublicacaoDoMural[]; total: number }>`
  - `sugerirSaidas(db: Db, f: Filtros, agora: Date): Promise<{ semPeriodo: number; semTipo: number; semCurso: number }>`
  - `listarCursos(db: Db): Promise<{ nome: string; sigla: string; slug: string }[]>`

- [ ] **Step 1: Escrever o teste que falha**

```ts
// tests/integracao/busca.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { criarBancoDeTeste } from './ajuda/banco'
import { semear } from '@/lib/db/seed'
import { buscar, sugerirSaidas, listarCursos } from '@/lib/busca/consulta'
import { FILTROS_PADRAO, type Filtros } from '@/lib/busca/filtros'

const agora = new Date('2026-09-08T12:00:00Z')
let ctx: Awaited<ReturnType<typeof criarBancoDeTeste>>

function filtros(extra: Partial<Filtros> = {}): Filtros {
  return { ...FILTROS_PADRAO, periodo: 'qualquer', ...extra }
}

beforeAll(async () => {
  ctx = await criarBancoDeTeste()
  await semear(ctx.db, agora)
})
afterAll(async () => { await ctx.encerrar() })

describe('busca textual', () => {
  it('encontra por palavra do título', async () => {
    const { itens } = await buscar(ctx.db, filtros({ q: 'monitoria' }), agora)
    expect(itens.length).toBeGreaterThan(0)
    expect(itens.some((i) => i.titulo.toLowerCase().includes('monitoria'))).toBe(true)
  })

  it('ignora acento no termo procurado', async () => {
    const { itens } = await buscar(ctx.db, filtros({ q: 'calendario' }), agora)
    expect(itens.some((i) => i.titulo.includes('calendário'))).toBe(true)
  })

  it('reduz ao radical: "disciplinas" acha "disciplina"', async () => {
    const { itens } = await buscar(ctx.db, filtros({ q: 'disciplinas' }), agora)
    expect(itens.length).toBeGreaterThan(0)
  })

  it('acha também o termo digitado COM acento, porque os dois lados dobram', async () => {
    const { itens } = await buscar(ctx.db, filtros({ q: 'calendário' }), agora)
    expect(itens.some((i) => i.titulo.includes('calendário'))).toBe(true)
  })

  it('não traz publicação vencida', async () => {
    const { itens } = await buscar(ctx.db, filtros({ q: 'manutenção' }), agora)
    expect(itens).toHaveLength(0)
  })

  it('devolve tipos misturados numa lista só', async () => {
    const { itens } = await buscar(ctx.db, filtros(), agora)
    const tipos = new Set(itens.map((i) => i.tipo))
    expect(tipos.size).toBeGreaterThan(1)
  })
})

describe('filtros combinados', () => {
  it('filtra por tipo', async () => {
    const { itens } = await buscar(ctx.db, filtros({ tipo: 'evento' }), agora)
    expect(itens.every((i) => i.tipo === 'evento')).toBe(true)
  })

  it('filtra por curso, incluindo o que não tem curso marcado', async () => {
    const { itens } = await buscar(ctx.db, filtros({ curso: 'gestao-empresarial' }), agora)
    const semCurso = itens.filter((i) => i.cursos.length === 0)
    const comGE = itens.filter((i) => i.cursos.some((c) => c.slug === 'gestao-empresarial'))
    expect(comGE.length).toBeGreaterThan(0)
    expect(semCurso.length).toBeGreaterThan(0)
  })

  it('devolve vazio quando a combinação não existe', async () => {
    const { itens, total } = await buscar(
      ctx.db,
      filtros({ q: 'maratona', tipo: 'prazo' }),
      agora,
    )
    expect(itens).toHaveLength(0)
    expect(total).toBe(0)
  })

  it('ordena por prazo quando pedido', async () => {
    const { itens } = await buscar(ctx.db, filtros({ tipo: 'prazo', ordem: 'prazo' }), agora)
    const datas = itens.map((i) => i.prazoFinal!.getTime())
    expect(datas).toEqual([...datas].sort((a, b) => a - b))
  })
})

describe('sugerirSaidas', () => {
  it('conta quantos itens apareceriam se cada filtro caísse', async () => {
    const f = filtros({ tipo: 'prazo', curso: 'seguranca-da-informacao', periodo: 'semana' })
    const s = await sugerirSaidas(ctx.db, f, agora)
    expect(s.semPeriodo).toBeGreaterThanOrEqual(0)
    expect(s.semTipo).toBeGreaterThanOrEqual(s.semPeriodo === 0 ? 0 : 0)
    expect(typeof s.semCurso).toBe('number')
  })
})

describe('listarCursos', () => {
  it('traz os cursos ativos', async () => {
    const cursos = await listarCursos(ctx.db)
    expect(cursos.map((c) => c.sigla).sort()).toEqual(['ADS', 'GE', 'SI'])
  })
})
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `npx vitest run tests/integracao/busca.test.ts`
Expected: FAIL — módulo não encontrado.

- [ ] **Step 3: Implementar**

```ts
// src/lib/busca/consulta.ts
import { and, asc, desc, eq, gt, inArray, lte, or, isNull, sql, type SQL } from 'drizzle-orm'
import { addDays } from 'date-fns'
import type { Db } from '@/lib/db/client'
import { cursos, publicacoes, publicacoesCursos } from '@/lib/db/schema'
import type { PublicacaoDoMural } from '@/lib/publicacoes/tipos'
import { ordenarMural } from '@/lib/publicacoes/ordenacao'
import { semFiltro, type Filtros } from '@/lib/busca/filtros'
import { semAcento } from '@/lib/publicacoes/slug'

const COM_RELACOES = {
  setor: { columns: { nome: true, slug: true } },
  cursos: { with: { curso: { columns: { nome: true, sigla: true, slug: true } } } },
} as const

function achatar(linha: Record<string, unknown>): PublicacaoDoMural {
  const { cursos: vinculos, ...resto } = linha as {
    cursos: { curso: { nome: string; sigla: string; slug: string } }[]
  } & PublicacaoDoMural
  return { ...resto, cursos: vinculos.map((v) => v.curso) }
}

function limiteDoPeriodo(periodo: Filtros['periodo'], agora: Date): Date | null {
  if (periodo === 'semana') return addDays(agora, 7)
  if (periodo === 'trinta') return addDays(agora, 30)
  return null
}

/**
 * Monta a condição da consulta. O filtro de curso inclui de propósito as
 * publicações sem curso marcado: pela spec, curso vazio significa "todos
 * os cursos", então um aviso geral precisa aparecer para quem filtra por
 * ADS.
 */
async function condicao(db: Db, f: Filtros, agora: Date): Promise<SQL | undefined> {
  const partes: (SQL | undefined)[] = [
    eq(publicacoes.status, 'publicado'),
    gt(publicacoes.expiraEm, agora),
  ]

  if (f.tipo) partes.push(eq(publicacoes.tipo, f.tipo))

  if (f.q) {
    partes.push(
      sql`${publicacoes.buscaTsv} @@ websearch_to_tsquery('portuguese', ${semAcento(f.q)})`,
    )
  }

  const limite = limiteDoPeriodo(f.periodo, agora)
  if (limite) {
    // Evento e prazo entram pela data em que acontecem; os demais, pela
    // data de publicação, que já é passada — então só o teto importa.
    partes.push(
      or(
        and(eq(publicacoes.tipo, 'evento'), lte(publicacoes.inicioEm, limite)),
        and(eq(publicacoes.tipo, 'prazo'), lte(publicacoes.prazoFinal, limite)),
        inArray(publicacoes.tipo, ['aviso', 'noticia']),
      ),
    )
  }

  if (f.curso) {
    const [curso] = await db.select({ id: cursos.id }).from(cursos).where(eq(cursos.slug, f.curso))
    if (curso) {
      const comEsseCurso = db
        .select({ id: publicacoesCursos.publicacaoId })
        .from(publicacoesCursos)
        .where(eq(publicacoesCursos.cursoId, curso.id))

      const semNenhumCurso = db
        .select({ id: publicacoesCursos.publicacaoId })
        .from(publicacoesCursos)

      partes.push(
        or(
          inArray(publicacoes.id, comEsseCurso),
          sql`${publicacoes.id} not in ${semNenhumCurso}`,
        ),
      )
    }
  }

  return and(...partes.filter(Boolean))
}

export async function buscar(
  db: Db,
  f: Filtros,
  agora: Date,
): Promise<{ itens: PublicacaoDoMural[]; total: number }> {
  const where = await condicao(db, f, agora)

  const linhas = await db.query.publicacoes.findMany({
    where,
    with: COM_RELACOES,
    orderBy:
      f.ordem === 'prazo'
        ? [asc(publicacoes.prazoFinal), desc(publicacoes.publicadoEm)]
        : [desc(publicacoes.publicadoEm)],
  })

  const itens = linhas.map(achatar)

  // Sem termo e sem ordem explícita, vale a relevância temporal do mural.
  const ordenados = f.q === '' && f.ordem === 'recentes' ? ordenarMural(itens, agora) : itens

  return { itens: ordenados, total: ordenados.length }
}

export async function sugerirSaidas(
  db: Db,
  f: Filtros,
  agora: Date,
): Promise<{ semPeriodo: number; semTipo: number; semCurso: number }> {
  const [semPeriodo, semTipo, semCurso] = await Promise.all([
    buscar(db, semFiltro(f, 'periodo'), agora),
    buscar(db, semFiltro(f, 'tipo'), agora),
    buscar(db, semFiltro(f, 'curso'), agora),
  ])
  return {
    semPeriodo: semPeriodo.total,
    semTipo: semTipo.total,
    semCurso: semCurso.total,
  }
}

export async function listarCursos(db: Db) {
  return db
    .select({ nome: cursos.nome, sigla: cursos.sigla, slug: cursos.slug })
    .from(cursos)
    .where(eq(cursos.ativo, true))
    .orderBy(asc(cursos.nome))
}
```

Se o `not in` com subconsulta der problema no PGlite, trocar por `notExists` do drizzle sobre `publicacoesCursos` correlacionado por `publicacaoId`.

Nota: `isNull` fica importado para essa alternativa; se não for usado, remover da lista de imports para o lint não reclamar.

- [ ] **Step 4: Rodar e confirmar que passa**

Run: `npx vitest run tests/integracao/busca.test.ts`
Expected: PASS — 11 testes.

- [ ] **Step 5: Commit**

```bash
git add src/lib/busca/consulta.ts tests/integracao/busca.test.ts
git commit -m "feat: busca full-text em portugues com filtros combinados

websearch_to_tsquery com dicionario portugues: 'calendario' acha
'calendario' com acento e 'inscricoes' acha 'inscricao', porque a
reducao ao radical e do proprio Postgres.

Filtrar por curso inclui as publicacoes sem curso marcado. Pela spec,
curso vazio significa 'todos os cursos', entao um aviso geral da
secretaria precisa aparecer para quem filtrou por ADS.

sugerirSaidas conta o que apareceria se cada filtro caisse, para que a
tela vazia possa oferecer a saida em vez de so dizer 'nada encontrado'.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 15: Página de busca

A barra de filtros, as fichas do que está ativo, a contagem e a tela vazia que oferece saída.

**Decisão de arquitetura:** a barra de filtros é um `<form method="get">` com um botão, e **não** um componente cliente que submete sozinho a cada mudança. Consequências: nenhum JavaScript é enviado ao navegador nesta página, ela funciona com JS desativado, e cada resultado tem URL própria. O custo é um clique a mais em "Filtrar".

**Files:**
- Create: `src/components/busca/BarraFiltros.tsx` + `.module.css`
- Create: `src/components/busca/FichasAtivas.tsx` + `.module.css`
- Create: `src/components/busca/EstadoVazio.tsx` + `.module.css`
- Create: `src/app/buscar/page.tsx` + `pagina.module.css`
- Test: `tests/unidade/busca-componentes.test.tsx`

**Interfaces:**
- Consumes: `buscar`, `sugerirSaidas`, `listarCursos` de `@/lib/busca/consulta`; `lerFiltros`, `descreverAtivos`, `escreverFiltros` de `@/lib/busca/filtros`
- Produces: `<BarraFiltros filtros cursos />`, `<FichasAtivas filtros nomesDeCurso />`, `<EstadoVazio filtros nomesDeCurso saidas />`

- [ ] **Step 1: Escrever o teste que falha**

```tsx
// tests/unidade/busca-componentes.test.tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { BarraFiltros } from '@/components/busca/BarraFiltros'
import { FichasAtivas } from '@/components/busca/FichasAtivas'
import { EstadoVazio } from '@/components/busca/EstadoVazio'
import { FILTROS_PADRAO } from '@/lib/busca/filtros'

const CURSOS = [
  { nome: 'Análise e Desenvolvimento de Sistemas', sigla: 'ADS', slug: 'ads' },
  { nome: 'Segurança da Informação', sigla: 'SI', slug: 'si' },
]
const NOMES = { ads: 'Análise e Desenvolvimento de Sistemas', si: 'Segurança da Informação' }

describe('BarraFiltros', () => {
  it('envia por GET para /buscar', () => {
    const { container } = render(<BarraFiltros filtros={FILTROS_PADRAO} cursos={CURSOS} />)
    const form = container.querySelector('form')
    expect(form).toHaveAttribute('method', 'get')
    expect(form).toHaveAttribute('action', '/buscar')
  })

  it('rotula todos os campos', () => {
    render(<BarraFiltros filtros={FILTROS_PADRAO} cursos={CURSOS} />)
    expect(screen.getByLabelText('Buscar')).toBeInTheDocument()
    expect(screen.getByLabelText('Curso')).toBeInTheDocument()
    expect(screen.getByLabelText('Tipo')).toBeInTheDocument()
    expect(screen.getByLabelText('Período')).toBeInTheDocument()
    expect(screen.getByLabelText('Ordenar por')).toBeInTheDocument()
  })

  it('preserva o que já estava selecionado', () => {
    render(<BarraFiltros filtros={{ ...FILTROS_PADRAO, q: 'monitoria', curso: 'ads' }} cursos={CURSOS} />)
    expect(screen.getByLabelText('Buscar')).toHaveValue('monitoria')
    expect(screen.getByLabelText('Curso')).toHaveValue('ads')
  })

  it('lista os cursos vindos do banco', () => {
    render(<BarraFiltros filtros={FILTROS_PADRAO} cursos={CURSOS} />)
    expect(screen.getByRole('option', { name: 'Segurança da Informação' })).toBeInTheDocument()
  })
})

describe('FichasAtivas', () => {
  it('não aparece quando não há filtro ativo', () => {
    const { container } = render(<FichasAtivas filtros={FILTROS_PADRAO} nomesDeCurso={NOMES} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('mostra uma ficha por filtro, com link que remove aquele filtro', () => {
    render(<FichasAtivas filtros={{ ...FILTROS_PADRAO, curso: 'ads', tipo: 'evento' }} nomesDeCurso={NOMES} />)
    expect(screen.getByRole('link', { name: /Remover.*Análise e Desenvolvimento/ })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Limpar todos os filtros' })).toHaveAttribute('href', '/buscar')
  })
})

describe('EstadoVazio', () => {
  const filtros = { ...FILTROS_PADRAO, tipo: 'evento' as const, curso: 'si', periodo: 'semana' as const }

  it('nomeia o recorte que esvaziou a lista', () => {
    render(<EstadoVazio filtros={filtros} nomesDeCurso={NOMES} saidas={{ semPeriodo: 6, semTipo: 3, semCurso: 9 }} />)
    expect(screen.getByRole('heading', { level: 2 }))
      .toHaveTextContent('Nenhum evento de Segurança da Informação nesta semana')
  })

  it('conta o que existe fora do recorte', () => {
    render(<EstadoVazio filtros={filtros} nomesDeCurso={NOMES} saidas={{ semPeriodo: 6, semTipo: 3, semCurso: 9 }} />)
    expect(screen.getByText(/6 eventos desse curso mais adiante/)).toBeInTheDocument()
  })

  it('oferece só as saídas que levam a algum resultado', () => {
    render(<EstadoVazio filtros={filtros} nomesDeCurso={NOMES} saidas={{ semPeriodo: 6, semTipo: 0, semCurso: 9 }} />)
    expect(screen.getByRole('link', { name: /Ver qualquer data/ })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /Incluir outros tipos/ })).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Ver todos os cursos/ })).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `npx vitest run tests/unidade/busca-componentes.test.tsx`
Expected: FAIL — componentes não encontrados.

- [ ] **Step 3: Escrever a barra de filtros**

```tsx
// src/components/busca/BarraFiltros.tsx
import type { Filtros } from '@/lib/busca/filtros'
import css from './BarraFiltros.module.css'

export function BarraFiltros({
  filtros,
  cursos,
}: {
  filtros: Filtros
  cursos: { nome: string; sigla: string; slug: string }[]
}) {
  return (
    <form className={css.barra} action="/buscar" method="get" role="search">
      <div className="pagina">
        <div className={css.campos}>
          <p className={css.campo}>
            <label htmlFor="f-q">Buscar</label>
            <input id="f-q" name="q" type="search" defaultValue={filtros.q} className={css.termo} />
          </p>

          <p className={css.campo}>
            <label htmlFor="f-curso">Curso</label>
            <select id="f-curso" name="curso" defaultValue={filtros.curso ?? ''}>
              <option value="">Todos os cursos</option>
              {cursos.map((c) => (
                <option key={c.slug} value={c.slug}>{c.nome}</option>
              ))}
            </select>
          </p>

          <p className={css.campo}>
            <label htmlFor="f-tipo">Tipo</label>
            <select id="f-tipo" name="tipo" defaultValue={filtros.tipo ?? ''}>
              <option value="">Todos os tipos</option>
              <option value="aviso">Avisos</option>
              <option value="evento">Eventos</option>
              <option value="prazo">Prazos</option>
              <option value="noticia">Comunidade</option>
            </select>
          </p>

          <p className={css.campo}>
            <label htmlFor="f-periodo">Período</label>
            <select id="f-periodo" name="periodo" defaultValue={filtros.periodo}>
              <option value="semana">Esta semana</option>
              <option value="trinta">Próximos 30 dias</option>
              <option value="qualquer">Qualquer data</option>
            </select>
          </p>

          <p className={css.campo}>
            <label htmlFor="f-ordem">Ordenar por</label>
            <select id="f-ordem" name="ordem" defaultValue={filtros.ordem}>
              <option value="recentes">Mais recentes</option>
              <option value="prazo">Prazo mais próximo</option>
            </select>
          </p>

          <button className={css.enviar} type="submit">Filtrar</button>
        </div>
      </div>
    </form>
  )
}
```

```css
/* src/components/busca/BarraFiltros.module.css */
.barra { background: var(--lavado); border-bottom: 1px solid var(--regra); padding: 16px 0; }

.campos { display: flex; gap: 12px; flex-wrap: wrap; align-items: flex-end; }

.campo { display: flex; flex-direction: column; gap: 5px; margin: 0; }

.campo label { font-size: 12px; font-weight: 500; color: var(--cinza); }

.campo input,
.campo select {
  font: inherit;
  font-size: 14px;
  padding: 9px 11px;
  border: 1px solid var(--regra);
  border-radius: var(--raio-controle);
  background: var(--papel);
  color: var(--tinta);
  min-width: 184px;
}

.termo { min-width: 290px; }

.enviar {
  font: inherit;
  font-size: 14px;
  font-weight: 600;
  padding: 11px 18px;
  border: 0;
  border-radius: var(--raio-controle);
  background: var(--ardosia);
  color: var(--papel);
  cursor: pointer;
  transition: background 0.18s ease;
}

.enviar:hover { background: var(--ardosia-escura); }
```

- [ ] **Step 4: Escrever as fichas ativas**

```tsx
// src/components/busca/FichasAtivas.tsx
import { descreverAtivos, type Filtros } from '@/lib/busca/filtros'
import css from './FichasAtivas.module.css'

export function FichasAtivas({
  filtros,
  nomesDeCurso,
}: {
  filtros: Filtros
  nomesDeCurso: Record<string, string>
}) {
  const fichas = descreverAtivos(filtros, nomesDeCurso)
  if (fichas.length === 0) return null

  return (
    <div className={css.faixa}>
      <span className={`narrow ${css.rotulo}`}>Filtros ativos:</span>
      {fichas.map((f) => (
        <a key={f.chave} className={css.ficha} href={f.href} aria-label={`Remover filtro ${f.rotulo}`}>
          <span>{f.rotulo}</span>
          <span className={css.x} aria-hidden="true">✕</span>
        </a>
      ))}
      <a className={css.limpar} href="/buscar">Limpar todos os filtros</a>
    </div>
  )
}
```

```css
/* src/components/busca/FichasAtivas.module.css */
.faixa { display: flex; gap: 9px; flex-wrap: wrap; align-items: center; padding: 14px 0 0; }

.rotulo { font-size: 13px; color: var(--cinza); }

.ficha {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 500;
  background: var(--papel);
  border: 1px solid var(--ardosia);
  color: var(--ardosia);
  padding: 6px 9px;
  border-radius: 6px;
}

.ficha:hover { background: var(--ardosia); color: var(--papel); }

.x { font-size: 11px; }

.limpar { font-size: 13.5px; font-weight: 500; color: var(--tijolo); text-decoration: underline; }
```

- [ ] **Step 5: Escrever a tela vazia**

```tsx
// src/components/busca/EstadoVazio.tsx
import { escreverFiltros, semFiltro, ROTULO_PERIODO, type Filtros } from '@/lib/busca/filtros'
import { ROTULO_TIPO } from '@/lib/publicacoes/tipos'
import css from './EstadoVazio.module.css'

function href(f: Filtros): string {
  const qs = escreverFiltros(f)
  return qs ? `/buscar?${qs}` : '/buscar'
}

export function EstadoVazio({
  filtros,
  nomesDeCurso,
  saidas,
}: {
  filtros: Filtros
  nomesDeCurso: Record<string, string>
  saidas: { semPeriodo: number; semTipo: number; semCurso: number }
}) {
  const nomeTipo = filtros.tipo ? ROTULO_TIPO[filtros.tipo].toLowerCase() : 'publicação'
  const nomeCurso = filtros.curso ? nomesDeCurso[filtros.curso] ?? filtros.curso : null
  const periodo = ROTULO_PERIODO[filtros.periodo].toLowerCase()

  const titulo = [
    `Nenhum ${nomeTipo}`,
    nomeCurso ? `de ${nomeCurso}` : null,
    filtros.q ? `para “${filtros.q}”` : null,
    filtros.periodo !== 'qualquer' ? `${periodo}` : null,
  ]
    .filter(Boolean)
    .join(' ')

  const partes = [
    saidas.semPeriodo > 0
      ? `Há ${saidas.semPeriodo} ${nomeTipo}s desse curso mais adiante no calendário`
      : null,
    saidas.semTipo > 0 ? `${saidas.semTipo} publicações de outros tipos no mesmo recorte` : null,
  ].filter(Boolean)

  return (
    <div className={css.vazio}>
      <h2 className={css.titulo}>{titulo}</h2>
      {partes.length > 0 ? <p className={`narrow ${css.linha}`}>{partes.join(', e ')}.</p> : null}

      <div className={css.saidas}>
        {saidas.semPeriodo > 0 ? (
          <a href={href({ ...semFiltro(filtros, 'periodo'), periodo: 'qualquer' })}>
            Ver qualquer data ({saidas.semPeriodo})
          </a>
        ) : null}
        {saidas.semTipo > 0 ? (
          <a href={href(semFiltro(filtros, 'tipo'))}>Incluir outros tipos ({saidas.semTipo})</a>
        ) : null}
        {saidas.semCurso > 0 && filtros.curso ? (
          <a href={href(semFiltro(filtros, 'curso'))}>Ver todos os cursos ({saidas.semCurso})</a>
        ) : null}
        <a href="/buscar">Limpar tudo</a>
      </div>
    </div>
  )
}
```

```css
/* src/components/busca/EstadoVazio.module.css */
.vazio { padding: 46px 0 50px; text-align: center; }

.titulo { font-size: 21px; font-weight: 600; color: var(--ardosia); margin: 0 0 9px; }

.linha { font-size: 15px; line-height: 1.6; color: var(--cinza); margin: 0 auto 20px; max-width: 52ch; }

.saidas { display: flex; gap: 9px; justify-content: center; flex-wrap: wrap; }

.saidas a {
  font-size: 13.5px;
  font-weight: 500;
  padding: 9px 13px;
  border-radius: var(--raio-controle);
  border: 1px solid var(--regra);
  color: var(--ardosia);
  background: var(--papel);
}

.saidas a:hover { border-color: var(--ardosia); }
```

- [ ] **Step 6: Escrever a página**

```tsx
// src/app/buscar/page.tsx
import { db } from '@/lib/db/client'
import { buscar, sugerirSaidas, listarCursos } from '@/lib/busca/consulta'
import { lerFiltros } from '@/lib/busca/filtros'
import { Navegacao } from '@/components/layout/Navegacao'
import { BarraFiltros } from '@/components/busca/BarraFiltros'
import { FichasAtivas } from '@/components/busca/FichasAtivas'
import { EstadoVazio } from '@/components/busca/EstadoVazio'
import { LinhaAviso } from '@/components/mural/LinhaAviso'
import { CardEvento } from '@/components/mural/CardEvento'
import { LinhaPrazo } from '@/components/mural/LinhaPrazo'
import { NotaComunidade } from '@/components/mural/NotaComunidade'
import css from '@/app/pagina.module.css'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Buscar no mural — Mural da Fatec Campinas' }

export default async function Buscar({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const filtros = lerFiltros(await searchParams)
  const agora = new Date()

  const [cursos, resultado] = await Promise.all([listarCursos(db), buscar(db, filtros, agora)])
  const nomesDeCurso = Object.fromEntries(cursos.map((c) => [c.slug, c.nome]))
  const saidas = resultado.total === 0 ? await sugerirSaidas(db, filtros, agora) : null

  return (
    <>
      <Navegacao ativo="/buscar" />
      <BarraFiltros filtros={filtros} cursos={cursos} />

      <main id="conteudo" className={`pagina ${css.secao}`}>
        <FichasAtivas filtros={filtros} nomesDeCurso={nomesDeCurso} />

        <h1 className="narrow" style={{ fontSize: 16, fontWeight: 400, color: 'var(--cinza)' }}>
          <strong style={{ color: 'var(--tinta)' }}>
            {resultado.total} {resultado.total === 1 ? 'publicação' : 'publicações'}
          </strong>
          {filtros.q ? ` para “${filtros.q}”` : ' no mural'}
        </h1>

        {resultado.total === 0 && saidas ? (
          <EstadoVazio filtros={filtros} nomesDeCurso={nomesDeCurso} saidas={saidas} />
        ) : (
          <div className={css.lista}>
            {resultado.itens.map((i) =>
              i.tipo === 'evento' ? <CardEvento key={i.id} publicacao={i} />
              : i.tipo === 'prazo' ? <LinhaPrazo key={i.id} publicacao={i} agora={agora} />
              : i.tipo === 'noticia' ? <NotaComunidade key={i.id} publicacao={i} variante="compacta" />
              : <LinhaAviso key={i.id} publicacao={i} />,
            )}
          </div>
        )}
      </main>
    </>
  )
}
```

- [ ] **Step 7: Rodar toda a suíte**

Run: `npm test`
Expected: PASS — 10 novos testes, mais os anteriores.

- [ ] **Step 8: Conferir no navegador**

Run: `npm run dev`

Abrir `/buscar?tipo=evento&curso=seguranca-da-informacao&periodo=semana`.

Expected: a tela vazia nomeia o recorte, conta o que existe fora dele e oferece as saídas. Clicar numa ficha remove só aquele filtro e a URL muda.

- [ ] **Step 9: Commit**

```bash
git add src/components/busca src/app/buscar tests/unidade/busca-componentes.test.tsx
git commit -m "feat: pagina de busca com filtros e tela vazia que oferece saida

A barra e um form GET com botao, e nao um componente cliente que submete
sozinho: a pagina inteira vai ao navegador sem um byte de JavaScript,
funciona com JS desativado e cada resultado tem endereco proprio.

A tela vazia nomeia o recorte que esvaziou a lista e conta o que existe
fora dele. No mural, resultado zero quase nunca e ausencia de conteudo;
e excesso de filtro, e a interface deve dizer isso.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

### Task 16: Testes de ponta a ponta

Os percursos de leitura, num navegador de verdade, contra o banco semeado.

**Files:**
- Create: `playwright.config.ts`
- Create: `tests/e2e/leitura.spec.ts`
- Modify: `package.json` (script `test:e2e`)

**Interfaces:**
- Consumes: a aplicação rodando com o banco semeado
- Produces: `npm run test:e2e`

- [ ] **Step 1: Instalar o Playwright**

```bash
npm install -D @playwright/test
npx playwright install chromium
```

- [ ] **Step 2: Configurar**

```ts
// playwright.config.ts
import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  use: { baseURL: 'http://localhost:3000' },
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
    timeout: 120_000,
  },
})
```

Acrescentar ao `package.json`: `"test:e2e": "playwright test"`.

Excluir `tests/e2e` do Vitest, para as duas suítes não colidirem: em `vitest.config.ts`, o `include` já lista apenas `tests/unidade` e `tests/integracao`, então nada muda.

- [ ] **Step 3: Escrever os testes**

```ts
// tests/e2e/leitura.spec.ts
import { test, expect } from '@playwright/test'

test('a home abre com o aviso mais importante no topo', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Calendário do 2º semestre')
  await expect(page.getByRole('link', { name: 'Ler o comunicado' })).toBeVisible()
})

test('o aluno chega ao prazo mais próximo sem buscar nem filtrar', async ({ page }) => {
  await page.goto('/')
  const prazos = page.getByRole('heading', { name: 'Prazos abertos' })
  await expect(prazos).toBeVisible()
  await expect(page.getByText(/Faltam \d+ dias|Termina hoje|Falta 1 dia/).first()).toBeVisible()
})

test('a publicação vencida sai da listagem e continua abrindo pela URL', async ({ page }) => {
  await page.goto('/avisos')
  await expect(page.getByText('Manutenção elétrica no Bloco C')).toHaveCount(0)

  await page.goto('/p/manutencao-eletrica-no-bloco-c')
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Manutenção elétrica')
  await expect(page.getByText(/saiu do mural em/)).toBeVisible()
})

test('a busca do cabeçalho leva a um resultado com URL própria', async ({ page }) => {
  await page.goto('/')
  await page.getByLabel('Buscar no mural').fill('monitoria')
  await page.getByRole('button', { name: 'Buscar' }).click()

  await expect(page).toHaveURL(/\/buscar\?q=monitoria/)
  await expect(page.getByText(/publicaç(ão|ões) para/)).toBeVisible()
})

test('filtro combinado sem resultado oferece a saída, e a ficha remove só um filtro', async ({ page }) => {
  await page.goto('/buscar?tipo=evento&curso=seguranca-da-informacao&periodo=semana')

  await expect(page.getByRole('heading', { level: 2 })).toContainText('Nenhum evento')

  const limpar = page.getByRole('link', { name: /Ver todos os cursos/ })
  if (await limpar.count()) {
    await limpar.click()
    await expect(page).not.toHaveURL(/curso=/)
    await expect(page).toHaveURL(/tipo=evento/)
  }
})

test('nenhuma informação depende de hover', async ({ page }) => {
  await page.goto('/')
  // Sem mover o mouse: título, data, resumo e setor já estão visíveis.
  const primeiraLinha = page.locator('article, a').filter({ hasText: 'Edital de monitoria' }).first()
  await expect(primeiraLinha).toContainText('Edital de monitoria')
  await expect(primeiraLinha).toContainText('Coordenação de ADS')
})

test('a navegação por teclado alcança o conteúdo principal', async ({ page }) => {
  await page.goto('/')
  await page.keyboard.press('Tab')
  await expect(page.getByRole('link', { name: 'Pular para o conteúdo' })).toBeFocused()
})
```

- [ ] **Step 4: Rodar**

```bash
npm run db:seed
npm run test:e2e
```

Expected: PASS — 7 testes. Se a home falhar por não achar o título, conferir se o seed rodou contra o mesmo `DATABASE_URL` que o `npm run dev` usa.

- [ ] **Step 5: Commit**

```bash
git add playwright.config.ts tests/e2e package.json
git commit -m "feat: testes de ponta a ponta dos percursos de leitura

Cobrem os criterios de sucesso da secao 1 da spec: o aluno acha o prazo
mais proximo sem buscar, e a publicacao vencida sai da listagem sem que
a URL quebre.

Um dos testes verifica que titulo, data, resumo e setor estao visiveis
sem nenhum movimento de mouse, travando a regra de que nenhuma
informacao pode existir so no hover.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>"
```

---

## Pronto quando

Este plano está concluído quando tudo abaixo for verdade:

- `npm test` passa, com os testes de unidade e de integração.
- `npm run test:e2e` passa.
- `npm run build` termina sem erro de tipo.
- `npm run dev` mostra a home com hero, quatro seções e a contagem de publicações.
- `/avisos`, `/eventos`, `/prazos`, `/comunidade` e `/buscar` abrem.
- A publicação vencida do seed não aparece em nenhuma listagem e abre por `/p/manutencao-eletrica-no-bloco-c`.
- Nenhum JavaScript é enviado nas páginas públicas, exceto o que o próprio Next.js injeta.

---

## Autorrevisão

**Cobertura da spec.** Cada requisito das seções 5 a 10 e 12 tem tarefa:

| Requisito da spec | Tarefa |
|---|---|
| §5 modelo de conteúdo e campos por tipo | 5, 6 |
| §5 três datas diferentes | 3, 5 |
| §6 expiração como condição de consulta | 8 |
| §6 urgência e contagem em dois estados | 3, 10 |
| §6 ordenação por relevância temporal | 4 |
| §6 dominante visual por tipo | 10 |
| §7 lista única com os quatro tipos | 14, 15 |
| §7 filtros curso, tipo, período, ordem | 13, 14, 15 |
| §7 estado na URL | 13 |
| §7 fichas removíveis e contagem | 15 |
| §7 tela vazia que oferece saída | 14, 15 |
| §7 full-text em português | 5, 14 |
| §9 paleta, tipografia, forma | 1 |
| §9 regra do hover | 10, 16 |
| §10 rotas públicas | 11, 12, 15 |
| §12 alt obrigatório | 6 |
| §12 semântica, foco, pular para conteúdo | 1, 9, 16 |
| §12 cor não é o único portador | 10 |

**Lacunas conhecidas, deliberadas.** A rota `/calendario` da seção 10 da spec **não** entra neste plano: ela é uma visão cronológica de eventos e prazos que já existem em `/eventos` e `/prazos`, e adiá-la não bloqueia nada. Fica registrada para o Plano 3. A rota `/entrar` é do Plano 2; os links do rodapé e da barra de serviços apontam para ela desde já e darão 404 até lá — comportamento aceitável durante a construção.

**Consistência de tipos.** `PublicacaoDoMural` é definido na Task 8 e usado nas 10, 11, 12, 14 e 15 com o mesmo formato. `Filtros` é definido na 13 e consumido na 14 e 15. `criarBancoDeTeste` vem da Task 5 e é usado nas 7, 8, 12 e 14. `criarPublicacao` vem da Task 10 e é usado na 11. `escreverFiltros`, `semFiltro` e `ROTULO_PERIODO` são exportados na 13 e usados na 15.

**Ponto de atenção para quem executar.** A função `achatar` aparece na Task 8 e de novo na Task 14, porque as duas montam o mesmo formato a partir das relações do Drizzle. Ao chegar na Task 14, extrair essa função para um módulo compartilhado em vez de duplicá-la — a duplicação está no plano só para que cada tarefa seja legível sozinha.
