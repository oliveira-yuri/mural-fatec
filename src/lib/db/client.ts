import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

const url = process.env.DATABASE_URL
if (!url) throw new Error('DATABASE_URL não definida. Copie .env.example para .env.local.')

const conexao = postgres(url, { prepare: false })

export const db = drizzle(conexao, { schema })
export type Db = typeof db
