import { and, asc, desc, eq, inArray, lte, or, sql, type SQL } from 'drizzle-orm'
import { addDays } from 'date-fns'
import type { Db } from '@/lib/db/client'
import { cursos, publicacoes, publicacoesCursos } from '@/lib/db/schema'
import type { PublicacaoDoMural } from '@/lib/publicacoes/tipos'
import { achatar, COM_RELACOES } from '@/lib/publicacoes/achatar'
import { ordenarMural, paraOrdenacao } from '@/lib/publicacoes/ordenacao'
import { vigente } from '@/lib/publicacoes/consultas'
import { semFiltro, type Filtros } from '@/lib/busca/filtros'
import { semAcento } from '@/lib/publicacoes/slug'

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
  // `vigente()` é a condição única de "está no mural agora" (Tarefa 8, em
  // `consultas.ts`): status publicado, `publicadoEm` presente e não expirado.
  // Reusar em vez de reescrever garante que o mural e a busca nunca discordem
  // sobre o que está publicado.
  const partes: (SQL | undefined)[] = [vigente(agora)]

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
    // 'qualquer', e não semFiltro: o link da tela vazia leva para "qualquer
    // data", enquanto semFiltro devolve o período ao padrão de 30 dias. Com o
    // padrão já ativo, semFiltro vira no-op, a contagem repete o zero da busca
    // atual, e a saída some da tela mesmo havendo resultado mais adiante.
    buscar(db, { ...f, periodo: 'qualquer' }, agora),
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
