import type { PGlite } from '@electric-sql/pglite'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

/**
 * Aplica todas as migrações de `drizzle/` (em ordem alfabética) num cliente
 * PGlite: lê cada `.sql`, separa por `--> statement-breakpoint` e executa
 * cada comando não vazio.
 *
 * Usado tanto pelo banco de testes de integração (`tests/integracao/ajuda/banco.ts`)
 * quanto pelo banco de desenvolvimento em memória (`src/lib/db/client.ts`), para
 * não duplicar a rotina entre os dois.
 */
export async function migrar(cliente: PGlite): Promise<void> {
  const pasta = 'drizzle'
  const migracoes = readdirSync(pasta).filter((f) => f.endsWith('.sql')).sort()

  for (const arquivo of migracoes) {
    const conteudo = readFileSync(join(pasta, arquivo), 'utf8')
    for (const comando of conteudo.split('--> statement-breakpoint')) {
      const limpo = comando.trim()
      if (limpo) await cliente.exec(limpo)
    }
  }
}
