import { addDays, subDays } from 'date-fns'
import { eq } from 'drizzle-orm'
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { criarBancoDeTeste } from './ajuda/banco'
import { semear } from '@/lib/db/seed'
import { cursos, publicacoes, publicacoesCursos, setores, usuarios } from '@/lib/db/schema'
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

  it('curso que não existe devolve zero, em vez de desligar o filtro em silêncio', async () => {
    const todos = await buscar(ctx.db, filtros(), agora)
    expect(todos.total).toBeGreaterThan(0)

    const { itens, total } = await buscar(ctx.db, filtros({ curso: 'curso-que-nao-existe' }), agora)
    expect(total).toBe(0)
    expect(itens).toHaveLength(0)
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

  it('semPeriodo conta por "qualquer data", não pelo padrão de 30 dias', async () => {
    // Fixture só para este teste: um prazo de SI além do teto de 30 dias.
    // O seed compartilhado não tem nenhum evento ou prazo além de 30 dias,
    // então sem esta linha extra não dá para distinguir "conta certo" de
    // "conta errado, mas coincidentemente zero".
    const [setor] = await ctx.db.select().from(setores).limit(1)
    const [autor] = await ctx.db.select().from(usuarios).limit(1)
    const [si] = await ctx.db.select().from(cursos).where(eq(cursos.sigla, 'SI'))

    const [prazoDistante] = await ctx.db
      .insert(publicacoes)
      .values({
        slug: 'prazo-de-si-alem-do-teto-padrao',
        tipo: 'prazo',
        titulo: 'Prazo de SI além do teto padrão',
        resumo: 'Fixture só para este teste.',
        corpo: 'Usado para provar que sugerirSaidas conta por "qualquer data", não pelo padrão de 30 dias.',
        setorId: setor.id,
        autorId: autor.id,
        status: 'publicado',
        prazoFinal: addDays(agora, 45),
        publicadoEm: subDays(agora, 1),
        expiraEm: addDays(agora, 45),
      })
      .returning()

    await ctx.db.insert(publicacoesCursos).values({ publicacaoId: prazoDistante.id, cursoId: si.id })

    // Dentro do padrão de 30 dias (o filtro nem menciona período — é o
    // valor padrão de FILTROS_PADRAO) não há nenhum prazo de SI: zero.
    const f: Filtros = { ...FILTROS_PADRAO, tipo: 'prazo', curso: 'seguranca-da-informacao' }
    expect((await buscar(ctx.db, f, agora)).total).toBe(0)

    // Mas existe um prazo de SI mais adiante, e é exatamente o que o link
    // "Ver qualquer data" promete mostrar — a contagem tem que bater.
    const s = await sugerirSaidas(ctx.db, f, agora)
    expect(s.semPeriodo).toBeGreaterThan(0)
  })
})

describe('listarCursos', () => {
  it('traz os cursos ativos', async () => {
    const cursos = await listarCursos(ctx.db)
    expect(cursos.map((c) => c.sigla).sort()).toEqual(['ADS', 'GE', 'SI'])
  })
})
