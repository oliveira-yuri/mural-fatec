import { drizzle } from 'drizzle-orm/postgres-js'
import type { PgDatabase, PgQueryResultHKT } from 'drizzle-orm/pg-core'
import postgres from 'postgres'
import * as schema from './schema'

/**
 * Tipo do banco independente de driver. Toda consulta recebe este tipo para
 * que os testes passem uma instância PGlite e a aplicação passe a conexão
 * postgres-js (ou, sem `DATABASE_URL`, uma instância PGlite em memória), sem
 * duas assinaturas paralelas.
 */
export type Db = PgDatabase<PgQueryResultHKT, typeof schema>

// Placeholder literal do .env.example: sem isto, quem nunca preencheu o
// .env.local cai direto no banco em memória, e é exatamente o comportamento
// que queremos — mas o valor também não pode ser confundido com uma
// DATABASE_URL real. Exportado para que o teste desta checagem compare com
// o mesmo literal, em vez de repeti-lo — se um mudar sem o outro, o teste
// continua passando enquanto a proteção real quebra.
export const URL_PLACEHOLDER = 'postgresql://usuario:senha@host:5432/postgres'

/**
 * Verdadeiro quando `url` não dá para conectar a um banco de verdade:
 * ausente, ou igual ao placeholder de `.env.example`. Exportada para que
 * `npm run db:seed` (em `seed.ts`) recuse rodar nesse caso, em vez de
 * duplicar a checagem.
 */
export function precisaDeBancoEmMemoria(url: string | undefined): boolean {
  return !url || url === URL_PLACEHOLDER
}

function avisarBancoEmMemoria(): void {
  const linhas = [
    'BANCO DE DESENVOLVIMENTO EM MEMÓRIA',
    'DATABASE_URL não está definida, ou ainda está com o valor de',
    'exemplo, então o mural subiu com um Postgres em memória, já',
    'migrado e semeado.',
    'Os dados somem quando o servidor reiniciar.',
    'Para usar um banco de verdade, copie .env.example para',
    '.env.local e preencha a DATABASE_URL.',
  ]
  const largura = Math.max(...linhas.map((l) => l.length))
  const linha = (esq: string, meio: string, dir: string) => `${esq}${meio.repeat(largura + 2)}${dir}`

  const bloco = [
    linha('┌', '─', '┐'),
    ...linhas.map((l) => `│ ${l.padEnd(largura)} │`),
    linha('└', '─', '┘'),
  ].join('\n')

  // Aviso alto de propósito: se ninguém o vir, alguém pode achar que está
  // olhando dados de produção.
  console.warn(`\n${bloco}\n`)
}

async function montarBancoEmMemoria(): Promise<Db> {
  avisarBancoEmMemoria()

  // Import dinâmico: o PGlite é pesado e só existe neste ramo, que só roda no
  // servidor. Mantê-lo fora do topo do módulo evita que ele seja arrastado
  // para qualquer coisa que não precise dele.
  const [{ PGlite }, { drizzle: drizzlePglite }, { migrar }, { semear }] = await Promise.all([
    import('@electric-sql/pglite'),
    import('drizzle-orm/pglite'),
    import('./migrar'),
    import('./seed'),
  ])

  const cliente = new PGlite()
  const dbMemoria = drizzlePglite(cliente, { schema })

  await migrar(cliente)
  await semear(dbMemoria)

  return dbMemoria
}

async function montarDb(): Promise<Db> {
  const url = process.env.DATABASE_URL

  // Condição inline (não `!precisaDeBancoEmMemoria(url)`) para que o
  // TypeScript estreite `url` a `string` sozinho, sem cast: essa função
  // devolve `boolean`, não é um type guard, então usá-la aqui obrigaria um
  // `as string` na linha de baixo.
  if (url && url !== URL_PLACEHOLDER) {
    const conexao = postgres(url, { prepare: false })
    return drizzle(conexao, { schema })
  }

  return montarBancoEmMemoria()
}

// Guardado em globalThis, com uma chave do registro global de símbolos, para
// que a instância sobreviva ao hot reload do Next em desenvolvimento: sem
// isto, cada recarga do módulo recriaria o banco em memória e semearia de
// novo. Guarda-se a Promise (não o valor resolvido) para que chamadas
// concorrentes durante a primeira montagem também compartilhem a mesma
// instância, em vez de cada uma subir e semear o próprio banco.
// Efeito colateral aceito: se montarDb() rejeitar (ex.: banco em memória
// falhando ao migrar), a promessa rejeitada fica em cache aqui pelo resto
// do processo — sem nova tentativa até reiniciar o servidor de
// desenvolvimento. Caminho só de dev, custo baixo, mas vale saber na hora
// de depurar.
const CHAVE_DB_GLOBAL = Symbol.for('mural-fatec.db')

interface GlobalComDb {
  [CHAVE_DB_GLOBAL]?: Promise<Db>
}

/**
 * Devolve a instância única do banco, montando-a na primeira chamada.
 *
 * Com `DATABASE_URL` definida (e diferente do placeholder de .env.example),
 * devolve a conexão postgres-js de sempre. Caso contrário, sobe um Postgres
 * PGlite em memória, aplica as migrações e semeia — com um aviso obrigatório
 * no console, para nunca ser confundido com um banco de verdade.
 */
export async function obterDb(): Promise<Db> {
  const g = globalThis as GlobalComDb
  if (!g[CHAVE_DB_GLOBAL]) {
    g[CHAVE_DB_GLOBAL] = montarDb()
  }
  return g[CHAVE_DB_GLOBAL]
}
