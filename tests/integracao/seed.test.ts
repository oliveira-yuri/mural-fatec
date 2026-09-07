import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { criarBancoDeTeste } from './ajuda/banco'
import { semear } from '@/lib/db/seed'
import { publicacoes } from '@/lib/db/schema'

const agora = new Date('2026-09-08T12:00:00Z')
let ctx: Awaited<ReturnType<typeof criarBancoDeTeste>>

beforeAll(async () => {
  ctx = await criarBancoDeTeste()
  await semear(ctx.db, agora)
})
afterAll(async () => { await ctx.encerrar() })

describe('seed', () => {
  it('cria publicações dos quatro tipos', async () => {
    const linhas = await ctx.db.select().from(publicacoes)
    const tipos = new Set(linhas.map((l) => l.tipo))
    expect(tipos).toEqual(new Set(['aviso', 'evento', 'prazo', 'noticia']))
  })

  it('inclui uma publicação já vencida, para exercitar a expiração', async () => {
    const linhas = await ctx.db.select().from(publicacoes)
    const vencidas = linhas.filter((l) => l.expiraEm.getTime() <= agora.getTime())
    expect(vencidas).toHaveLength(1)
  })

  it('usa datas relativas, mantendo um prazo apertado', async () => {
    const linhas = await ctx.db.select().from(publicacoes)
    const prazos = linhas.filter((l) => l.tipo === 'prazo' && l.prazoFinal)
    const apertados = prazos.filter((p) => {
      const dias = (p.prazoFinal!.getTime() - agora.getTime()) / 86_400_000
      return dias >= 0 && dias <= 7
    })
    expect(apertados.length).toBeGreaterThan(0)
  })
})
