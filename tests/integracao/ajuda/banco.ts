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
