import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { criarBancoDeTeste } from './ajuda/banco'
import { setores, usuarios, publicacoes } from '@/lib/db/schema'

let ctx: Awaited<ReturnType<typeof criarBancoDeTeste>>

beforeAll(async () => { ctx = await criarBancoDeTeste() })
afterAll(async () => { await ctx.encerrar() })

async function semear() {
  const [setor] = await ctx.db.insert(setores)
    .values({ nome: 'Secretaria Acadêmica', slug: `secretaria-academica-${Date.now()}` })
    .returning()
  const [autor] = await ctx.db.insert(usuarios)
    .values({
      nome: 'Helena Vasconcelos',
      email: `helena-${Date.now()}@fatec.sp.gov.br`,
      senhaHash: 'nao-usado-neste-plano',
      papel: 'editor',
      setorId: setor.id,
    })
    .returning()
  return { setor, autor }
}

describe('schema', () => {
  it('grava e lê uma publicação com os padrões corretos', async () => {
    const { setor, autor } = await semear()
    await ctx.db.insert(publicacoes).values({
      slug: 'calendario-2o-semestre',
      tipo: 'aviso',
      titulo: 'Alteração no calendário acadêmico do 2º semestre',
      resumo: 'Início das aulas antecipado em uma semana.',
      corpo: 'As novas datas de provas estão no edital anexo.',
      setorId: setor.id,
      autorId: autor.id,
      status: 'publicado',
      urgencia: 'urgente',
      publicadoEm: new Date('2026-09-04T12:00:00Z'),
      expiraEm: new Date('2026-10-04T12:00:00Z'),
    })

    const linhas = await ctx.db.select().from(publicacoes)
    expect(linhas).toHaveLength(1)
    expect(linhas[0].titulo).toContain('calendário acadêmico')
    expect(linhas[0].destaque).toBe(false)
  })

  it('gera o vetor de busca em português, com o título em peso A', async () => {
    const resultado = await ctx.cliente.query<{ v: string }>(
      "select busca_tsv::text as v from publicacoes limit 1",
    )
    const vetor = resultado.rows[0].v
    // "acadêmico" entra reduzido ao radical pelo stemmer 'portuguese' do Postgres
    // (o acento é preservado: a config 'portuguese' não remove acentos, isso
    // exigiria a extensão 'unaccent', que não está em uso aqui), marcado com peso A
    expect(vetor).toMatch(/acadêm/)
    expect(vetor).toMatch(/A/)
  })

  it('recusa slug duplicado', async () => {
    const { setor, autor } = await semear()
    await expect(
      ctx.db.insert(publicacoes).values({
        slug: 'calendario-2o-semestre',
        tipo: 'aviso',
        titulo: 'Outro aviso',
        resumo: 'Outro resumo',
        corpo: 'Outro corpo',
        setorId: setor.id,
        autorId: autor.id,
        expiraEm: new Date('2026-10-04T12:00:00Z'),
      }),
    ).rejects.toThrow()
  })
})
