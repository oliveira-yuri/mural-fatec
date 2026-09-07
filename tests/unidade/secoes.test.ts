import { describe, it, expect } from 'vitest'
import { montarSecoesDaHome, ordenarSecao } from '@/lib/publicacoes/secoes'
import type { PublicacaoDoMural } from '@/lib/publicacoes/tipos'
import { criarPublicacao } from './ajuda/publicacao'

const AGORA = new Date('2026-06-01T12:00:00Z')

function diasDepois(base: Date, dias: number): Date {
  return new Date(base.getTime() + dias * 24 * 60 * 60 * 1000)
}

function diasAntes(base: Date, dias: number): Date {
  return diasDepois(base, -dias)
}

describe('montarSecoesDaHome', () => {
  it('inclui o prazo que fecha antes entre os quatro devolvidos, em primeiro lugar, mesmo publicado há mais tempo que os outros', () => {
    // Cenário que motivou a correção: seis prazos abertos, nenhum dentro da
    // janela de 7 dias. O que fecha primeiro (10 dias) foi publicado há
    // muito mais tempo que os outros cinco — se a seção só preservasse a
    // ordem de chegada (por recência de publicação), ele ficaria na sexta
    // posição e o slice(0, 4) o cortaria. A home nunca mostraria o prazo
    // mais próximo, quebrando o critério central da spec §1.
    const itens: PublicacaoDoMural[] = [
      // Item de outro tipo na frente da lista, só para que o fallback de
      // `escolherDestaque` (que recai sobre o primeiro item quando não há
      // aviso) não consuma um dos seis prazos do cenário.
      criarPublicacao({ id: 'noticia-qualquer', slug: 'noticia-qualquer', tipo: 'noticia' }),
      // Publicados recentemente, mas com vencimento distante — viriam
      // primeiro numa ordenação por recência de publicação.
      criarPublicacao({
        id: 'prazo-90d',
        slug: 'prazo-90d',
        tipo: 'prazo',
        prazoFinal: diasDepois(AGORA, 90),
        publicadoEm: diasAntes(AGORA, 1),
      }),
      criarPublicacao({
        id: 'prazo-80d',
        slug: 'prazo-80d',
        tipo: 'prazo',
        prazoFinal: diasDepois(AGORA, 80),
        publicadoEm: diasAntes(AGORA, 2),
      }),
      criarPublicacao({
        id: 'prazo-60d',
        slug: 'prazo-60d',
        tipo: 'prazo',
        prazoFinal: diasDepois(AGORA, 60),
        publicadoEm: diasAntes(AGORA, 3),
      }),
      criarPublicacao({
        id: 'prazo-45d',
        slug: 'prazo-45d',
        tipo: 'prazo',
        prazoFinal: diasDepois(AGORA, 45),
        publicadoEm: diasAntes(AGORA, 4),
      }),
      criarPublicacao({
        id: 'prazo-30d',
        slug: 'prazo-30d',
        tipo: 'prazo',
        prazoFinal: diasDepois(AGORA, 30),
        publicadoEm: diasAntes(AGORA, 5),
      }),
      // Publicado há muito tempo, mas é o que vence primeiro — nenhum dos
      // seis está dentro da janela de 7 dias considerada "apertada".
      criarPublicacao({
        id: 'prazo-10d',
        slug: 'prazo-10d',
        tipo: 'prazo',
        prazoFinal: diasDepois(AGORA, 10),
        publicadoEm: diasAntes(AGORA, 400),
      }),
    ]

    const { prazos } = montarSecoesDaHome(itens)

    expect(prazos).toHaveLength(4)
    expect(prazos[0].slug).toBe('prazo-10d')
    expect(prazos.map((p) => p.slug)).toContain('prazo-10d')
  })

  it('ordena eventos do que acontece antes para o que acontece depois', () => {
    const itens: PublicacaoDoMural[] = [
      // Decoy de outro tipo à frente, para que o fallback de destaque não
      // consuma um dos eventos sendo testados.
      criarPublicacao({ id: 'decoy', slug: 'decoy', tipo: 'noticia' }),
      criarPublicacao({ id: '1', slug: 'evento-depois', tipo: 'evento', inicioEm: diasDepois(AGORA, 20) }),
      criarPublicacao({ id: '2', slug: 'evento-logo', tipo: 'evento', inicioEm: diasDepois(AGORA, 2) }),
      criarPublicacao({ id: '3', slug: 'evento-meio', tipo: 'evento', inicioEm: diasDepois(AGORA, 8) }),
    ]

    const { eventos } = montarSecoesDaHome(itens)

    expect(eventos.map((e) => e.slug)).toEqual(['evento-logo', 'evento-meio'])
  })

  it('ordena avisos do mais recente ao mais antigo', () => {
    const itens: PublicacaoDoMural[] = [
      // Decoy de outro tipo à frente, para que o fallback de destaque não
      // consuma um dos avisos sendo testados.
      criarPublicacao({ id: 'decoy', slug: 'decoy', tipo: 'evento' }),
      criarPublicacao({ id: '1', slug: 'aviso-antigo', tipo: 'aviso', publicadoEm: diasAntes(AGORA, 30) }),
      criarPublicacao({ id: '2', slug: 'aviso-novo', tipo: 'aviso', publicadoEm: diasAntes(AGORA, 1) }),
      criarPublicacao({ id: '3', slug: 'aviso-meio', tipo: 'aviso', publicadoEm: diasAntes(AGORA, 10) }),
    ]

    const { avisos } = montarSecoesDaHome(itens)

    expect(avisos.map((a) => a.slug)).toEqual(['aviso-novo', 'aviso-meio', 'aviso-antigo'])
  })

  it('ordena notícias do mais recente ao mais antigo', () => {
    const itens: PublicacaoDoMural[] = [
      // Decoy de outro tipo à frente, para que o fallback de destaque não
      // consuma uma das notícias sendo testadas.
      criarPublicacao({ id: 'decoy', slug: 'decoy', tipo: 'evento' }),
      criarPublicacao({ id: '1', slug: 'noticia-antiga', tipo: 'noticia', publicadoEm: diasAntes(AGORA, 30) }),
      criarPublicacao({ id: '2', slug: 'noticia-nova', tipo: 'noticia', publicadoEm: diasAntes(AGORA, 1) }),
    ]

    const { noticias } = montarSecoesDaHome(itens)

    expect(noticias.map((n) => n.slug)).toEqual(['noticia-nova', 'noticia-antiga'])
  })

  it('não repete o destaque em nenhuma seção', () => {
    const destaque = criarPublicacao({
      id: 'aviso-destaque',
      slug: 'aviso-destaque',
      tipo: 'aviso',
      destaque: true,
    })
    const outroAviso = criarPublicacao({ id: 'aviso-2', slug: 'aviso-2', tipo: 'aviso' })

    const resultado = montarSecoesDaHome([destaque, outroAviso])

    expect(resultado.destaque?.slug).toBe('aviso-destaque')
    expect(resultado.avisos.map((a) => a.slug)).not.toContain('aviso-destaque')
    expect(resultado.avisos.map((a) => a.slug)).toEqual(['aviso-2'])
  })

  it('manda para o fim quem não tem a data do seu tipo, sem embaralhar os demais', () => {
    const semData = criarPublicacao({ id: 'prazo-sem-data', slug: 'prazo-sem-data', tipo: 'prazo', prazoFinal: null })
    const cedo = criarPublicacao({ id: 'prazo-cedo', slug: 'prazo-cedo', tipo: 'prazo', prazoFinal: diasDepois(AGORA, 5) })
    const tarde = criarPublicacao({ id: 'prazo-tarde', slug: 'prazo-tarde', tipo: 'prazo', prazoFinal: diasDepois(AGORA, 50) })

    const ordenado = ordenarSecao([semData, tarde, cedo], 'prazo')

    expect(ordenado.map((p) => p.slug)).toEqual(['prazo-cedo', 'prazo-tarde', 'prazo-sem-data'])
  })

  it('corta em 4 avisos, 2 eventos e 4 prazos, mas não corta notícias', () => {
    const criar = (tipo: PublicacaoDoMural['tipo'], n: number) =>
      Array.from({ length: n }, (_, i) =>
        criarPublicacao({ id: `${tipo}-${i}`, slug: `${tipo}-${i}`, tipo, publicadoEm: diasAntes(AGORA, i) }),
      )

    const itens: PublicacaoDoMural[] = [
      ...criar('aviso', 6),
      ...criar('evento', 5).map((p, i) => ({ ...p, inicioEm: diasDepois(AGORA, i + 1) })),
      ...criar('prazo', 7).map((p, i) => ({ ...p, prazoFinal: diasDepois(AGORA, 30 + i) })),
      ...criar('noticia', 6),
    ]

    const { avisos, eventos, prazos, noticias } = montarSecoesDaHome(itens)

    expect(avisos).toHaveLength(4)
    expect(eventos).toHaveLength(2)
    expect(prazos).toHaveLength(4)
    expect(noticias).toHaveLength(6)
  })
})
