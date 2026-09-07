import { PGlite } from '@electric-sql/pglite'
import { drizzle } from 'drizzle-orm/pglite'
import * as schema from '@/lib/db/schema'
import { migrar } from '@/lib/db/migrar'

export async function criarBancoDeTeste() {
  const cliente = new PGlite()
  const db = drizzle(cliente, { schema })

  await migrar(cliente)

  return { db, cliente, encerrar: () => cliente.close() }
}
