import { addDays } from 'date-fns'
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { criarBancoDeTeste } from './ajuda/banco'
import { semear } from '@/lib/db/seed'
import { publicacoes, setores, usuarios } from '@/lib/db/schema'
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

  it('devolve lista vazia quando o limite é zero', async () => {
    expect(await listarMural(ctx.db, agora, 0)).toHaveLength(0)
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

describe('buscarPorSlug — status', () => {
  // Só rascunho, em revisão e arquivado precisam ser inseridos: nenhum deles
  // entra em `vigente()`, então as contagens dos outros testes não mudam.
  // O caso `publicado` usa uma peça do próprio seed.
  beforeAll(async () => {
    const [setor] = await ctx.db.select().from(setores).limit(1)
    const [autor] = await ctx.db.select().from(usuarios).limit(1)

    const comum = {
      tipo: 'aviso' as const,
      resumo: 'Peça de teste dos status.',
      corpo: 'Corpo de teste.',
      setorId: setor.id,
      autorId: autor.id,
      publicadoEm: agora,
      expiraEm: addDays(agora, 30),
    }

    await ctx.db.insert(publicacoes).values([
      { ...comum, slug: 'peca-em-rascunho', titulo: 'Peça em rascunho', status: 'rascunho' },
      { ...comum, slug: 'peca-em-revisao', titulo: 'Peça em revisão', status: 'em_revisao' },
      { ...comum, slug: 'peca-arquivada', titulo: 'Peça arquivada', status: 'arquivado' },
    ])
  })

  it('serve uma publicação publicada', async () => {
    const p = await buscarPorSlug(ctx.db, 'feira-de-estagios-e-primeiro-emprego')
    expect(p?.status).toBe('publicado')
  })

  it('serve uma publicação arquivada, porque a URL citada em edital não pode quebrar', async () => {
    const p = await buscarPorSlug(ctx.db, 'peca-arquivada')
    expect(p?.status).toBe('arquivado')
  })

  it('não serve rascunho, mesmo com o slug adivinhado pelo título', async () => {
    expect(await buscarPorSlug(ctx.db, 'peca-em-rascunho')).toBeNull()
  })

  it('não serve publicação em revisão, para não furar a fila de aprovação', async () => {
    expect(await buscarPorSlug(ctx.db, 'peca-em-revisao')).toBeNull()
  })
})

describe('contarVigentes', () => {
  it('conta só o que está no mural agora', async () => {
    expect(await contarVigentes(ctx.db, agora)).toBe(8)
  })
})

describe('listarMural — dado malformado', () => {
  it('não devolve, e não lança, uma publicação "publicado" sem publicadoEm', async () => {
    const [setor] = await ctx.db.select().from(setores).limit(1)
    const [autor] = await ctx.db.select().from(usuarios).limit(1)

    await ctx.db.insert(publicacoes).values({
      slug: 'publicacao-malformada-sem-data-de-publicacao',
      tipo: 'aviso',
      titulo: 'Publicação malformada',
      resumo: 'Status publicado mas sem publicadoEm — não deve derrubar a home.',
      corpo: 'Linha inserida direto para simular dado malformado.',
      setorId: setor.id,
      autorId: autor.id,
      status: 'publicado',
      publicadoEm: null,
      expiraEm: addDays(agora, 10),
    })

    await expect(listarMural(ctx.db, agora)).resolves.not.toThrow()
    const itens = await listarMural(ctx.db, agora)
    expect(itens.some((i) => i.slug === 'publicacao-malformada-sem-data-de-publicacao')).toBe(false)
  })
})
