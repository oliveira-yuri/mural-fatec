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
 * Importe sempre como `import type { Db }`. Um import de tipo é apagado na
 * compilação e não executa este módulo, que lança se DATABASE_URL faltar.
 */
export type Db = PgDatabase<PgQueryResultHKT, typeof schema>
