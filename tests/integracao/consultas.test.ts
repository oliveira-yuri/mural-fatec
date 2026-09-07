import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { criarBancoDeTeste } from './ajuda/banco'
import { semear } from '@/lib/db/seed'
import { listarMural, listarPorTipo, buscarPorSlug, contarVigentes } from '@/lib/publicacoes/consultas'

const agora = new Date('2026-09-08T12:00:00Z')
let ctx: Awaited<ReturnType<typeof criarBancoDeTeste>>

beforeAll(async () => {
  ctx = await criarBancoDeTeste()
  await semear(ctx.db, agora)
})
afterAll(async () => { await ctx.encerrar() })

describe('listarMural', () => {
  it('não traz a publicação vencida', async () => {
    const itens = await listarMural(ctx.db, agora)
    expect(itens.some((i) => i.slug === 'manutencao-eletrica-no-bloco-c')).toBe(false)
  })

  it('traz oito publicações vigentes', async () => {
    const itens = await listarMural(ctx.db, agora)
    expect(itens).toHaveLength(8)
  })

  it('põe a publicação em destaque em primeiro lugar', async () => {
    const itens = await listarMural(ctx.db, agora)
    expect(itens[0].destaque).toBe(true)
  })

  it('inclui o nome do setor emissor', async () => {
    const itens = await listarMural(ctx.db, agora)
    expect(itens[0].setor.nome).toBe('Secretaria Acadêmica')
  })

  it('inclui os cursos relacionados', async () => {
    const itens = await listarMural(ctx.db, agora)
    const inscricao = itens.find((i) => i.slug === 'inscricao-em-disciplinas-do-2-semestre')
    expect(inscricao?.cursos.map((c) => c.sigla).sort()).toEqual(['ADS', 'GE'])
  })

  it('respeita o limite', async () => {
    const itens = await listarMural(ctx.db, agora, 3)
    expect(itens).toHaveLength(3)
  })
})

describe('listarPorTipo', () => {
  it('traz só eventos vigentes', async () => {
    const itens = await listarPorTipo(ctx.db, 'evento', agora)
    expect(itens).toHaveLength(2)
    expect(itens.every((i) => i.tipo === 'evento')).toBe(true)
  })

  it('não traz o aviso vencido na listagem de avisos', async () => {
    const itens = await listarPorTipo(ctx.db, 'aviso', agora)
    expect(itens.every((i) => i.expiraEm.getTime() > agora.getTime())).toBe(true)
  })
})

describe('buscarPorSlug', () => {
  it('encontra uma publicação vigente', async () => {
    const p = await buscarPorSlug(ctx.db, 'feira-de-estagios-e-primeiro-emprego')
    expect(p?.titulo).toBe('Feira de estágios e primeiro emprego')
  })

  it('encontra uma publicação vencida, porque a URL não pode quebrar', async () => {
    const p = await buscarPorSlug(ctx.db, 'manutencao-eletrica-no-bloco-c')
    expect(p).not.toBeNull()
    expect(p!.expiraEm.getTime()).toBeLessThan(agora.getTime())
  })

  it('devolve null para slug inexistente', async () => {
    expect(await buscarPorSlug(ctx.db, 'nao-existe')).toBeNull()
  })
})

describe('contarVigentes', () => {
  it('conta só o que está no mural agora', async () => {
    expect(await contarVigentes(ctx.db, agora)).toBe(8)
  })
})
