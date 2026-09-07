import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { criarBancoDeTeste } from './ajuda/banco'
import { semear } from '@/lib/db/seed'
import { buscarPorSlug, listarPorTipo } from '@/lib/publicacoes/consultas'
import { estaVigente } from '@/lib/publicacoes/exibicao'

const agora = new Date('2026-09-08T12:00:00Z')
let ctx: Awaited<ReturnType<typeof criarBancoDeTeste>>

beforeAll(async () => {
  ctx = await criarBancoDeTeste()
  await semear(ctx.db, agora)
})
afterAll(async () => { await ctx.encerrar() })

describe('dados das rotas de listagem', () => {
  it.each(['aviso', 'evento', 'prazo', 'noticia'] as const)(
    'a listagem de %s traz só itens vigentes desse tipo',
    async (tipo) => {
      const itens = await listarPorTipo(ctx.db, tipo, agora)
      expect(itens.length).toBeGreaterThan(0)
      expect(itens.every((i) => i.tipo === tipo)).toBe(true)
      expect(itens.every((i) => estaVigente(i, agora))).toBe(true)
    },
  )
})

describe('dados da página da publicação', () => {
  it('a publicação vencida é encontrada e reconhecida como fora do mural', async () => {
    const p = await buscarPorSlug(ctx.db, 'manutencao-eletrica-no-bloco-c')
    expect(p).not.toBeNull()
    expect(estaVigente(p!, agora)).toBe(false)
  })

  it('a publicação vigente traz o corpo em markdown', async () => {
    const p = await buscarPorSlug(ctx.db, 'alteracao-no-calendario-academico-do-2-semestre')
    expect(p!.corpo).toContain('edital anexo')
  })
})
