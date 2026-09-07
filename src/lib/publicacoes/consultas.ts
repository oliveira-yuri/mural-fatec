import { and, count, eq, gt } from 'drizzle-orm'
import type { Db } from '@/lib/db/client'
import { publicacoes } from '@/lib/db/schema'
import { achatar } from '@/lib/publicacoes/achatar'
import { ordenarMural } from '@/lib/publicacoes/ordenacao'
import type { PublicacaoDoMural, TipoPublicacao } from '@/lib/publicacoes/tipos'

const COM_RELACOES = {
  setor: { columns: { nome: true, slug: true } },
  cursos: { with: { curso: { columns: { nome: true, sigla: true, slug: true } } } },
} as const

/** Condição única de "está no mural agora". Usada por toda listagem. */
function vigente(agora: Date) {
  return and(eq(publicacoes.status, 'publicado'), gt(publicacoes.expiraEm, agora))
}

/**
 * `publicadoEm` é opcional no schema só para acomodar rascunhos, que nunca
 * chegam até aqui: `vigente()` já exige `status = 'publicado'`, e toda
 * publicação publicada tem `publicadoEm` preenchido no momento da
 * publicação. `ordenarMural` (Tarefa 4) depende de `publicadoEm: Date` não
 * nulo para desempatar por recência; esta função só declara, no tipo, o que
 * a query já garante em tempo de execução.
 */
function paraOrdenacao(itens: PublicacaoDoMural[]): (PublicacaoDoMural & { publicadoEm: Date })[] {
  return itens as (PublicacaoDoMural & { publicadoEm: Date })[]
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
  const ordenadas = ordenarMural(paraOrdenacao(linhas.map(achatar)), agora)
  return limite ? ordenadas.slice(0, limite) : ordenadas
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
  return ordenarMural(paraOrdenacao(linhas.map(achatar)), agora)
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
