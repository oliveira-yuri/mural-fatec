import { and, asc, desc, eq, gt, inArray, isNotNull, lte, or, sql, type SQL } from 'drizzle-orm'
import { addDays } from 'date-fns'
import type { Db } from '@/lib/db/client'
import { cursos, publicacoes, publicacoesCursos } from '@/lib/db/schema'
import type { PublicacaoDoMural } from '@/lib/publicacoes/tipos'
import { achatar } from '@/lib/publicacoes/achatar'
import { ordenarMural } from '@/lib/publicacoes/ordenacao'
import { semFiltro, type Filtros } from '@/lib/busca/filtros'
import { semAcento } from '@/lib/publicacoes/slug'

const COM_RELACOES = {
  setor: { columns: { nome: true, slug: true } },
  cursos: { with: { curso: { columns: { nome: true, sigla: true, slug: true } } } },
} as const

/**
 * `publicadoEm` é opcional no schema, então `PublicacaoDoMural.publicadoEm`
 * é `Date | null` no tipo. Mas `condicao()`, acima, já exige
 * `isNotNull(publicacoes.publicadoEm)` — o Drizzle não propaga essa garantia
 * da cláusula WHERE para o tipo da linha devolvida, então esta função só
 * declara, no tipo, o que a consulta já garante em tempo de execução.
 * `ordenarMural` depende de `publicadoEm: Date` não nulo para desempatar por
 * recência. Mesmo padrão de `src/lib/publicacoes/consultas.ts` (Tarefa 8).
 */
function paraOrdenacao(itens: PublicacaoDoMural[]): (PublicacaoDoMural & { publicadoEm: Date })[] {
  return itens as (PublicacaoDoMural & { publicadoEm: Date })[]
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
    // Garante em tempo de execução o que `paraOrdenacao`, abaixo, declara em
    // tipo: uma publicação com status 'publicado' e sem `publicadoEm` é dado
    // malformado (mesma decisão de `consultas.ts`, Tarefa 8).
    isNotNull(publicacoes.publicadoEm),
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
  const ordenados =
    f.q === '' && f.ordem === 'recentes' ? ordenarMural(paraOrdenacao(itens), agora) : itens

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
