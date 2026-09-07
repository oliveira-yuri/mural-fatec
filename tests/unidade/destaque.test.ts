import { describe, it, expect } from 'vitest'
import { escolherDestaque } from '@/lib/publicacoes/destaque'
import { criarPublicacao } from './ajuda/publicacao'

describe('escolherDestaque', () => {
  it('prefere o aviso marcado como destaque', () => {
    const itens = [
      criarPublicacao({ slug: 'urgente-sem-destaque', tipo: 'aviso', urgencia: 'urgente' }),
      criarPublicacao({ slug: 'fixado', tipo: 'aviso', destaque: true, urgencia: 'importante' }),
    ]
    expect(escolherDestaque(itens)?.slug).toBe('fixado')
  })

  it('cai para o aviso urgente quando não há destaque', () => {
    const itens = [
      criarPublicacao({ slug: 'noticia', tipo: 'noticia' }),
      criarPublicacao({ slug: 'urgente', tipo: 'aviso', urgencia: 'urgente' }),
    ]
    expect(escolherDestaque(itens)?.slug).toBe('urgente')
  })

  it('cai para o primeiro item quando não há aviso urgente', () => {
    const itens = [
      criarPublicacao({ slug: 'primeiro', tipo: 'evento' }),
      criarPublicacao({ slug: 'segundo', tipo: 'noticia' }),
    ]
    expect(escolherDestaque(itens)?.slug).toBe('primeiro')
  })

  it('devolve null com a lista vazia', () => {
    expect(escolherDestaque([])).toBeNull()
  })
})
