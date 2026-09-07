import { describe, it, expect } from 'vitest'
import { ordenarMural, type ItemOrdenavel } from '@/lib/publicacoes/ordenacao'

const agora = new Date('2026-09-08T12:00:00Z')

function item(id: string, campos: Partial<ItemOrdenavel> = {}): ItemOrdenavel & { id: string } {
  return {
    id,
    tipo: 'noticia',
    destaque: false,
    publicadoEm: new Date('2026-09-01T12:00:00Z'),
    prazoFinal: null,
    urgencia: null,
    ...campos,
  }
}

function ids(itens: { id: string }[]): string[] {
  return itens.map((i) => i.id)
}

describe('ordenarMural', () => {
  it('põe destaque acima de tudo', () => {
    const lista = [
      item('noticia-nova', { publicadoEm: new Date('2026-09-08T10:00:00Z') }),
      item('fixada', { destaque: true }),
    ]
    expect(ids(ordenarMural(lista, agora))).toEqual(['fixada', 'noticia-nova'])
  })

  it('põe prazo apertado acima de notícia recente', () => {
    const lista = [
      item('noticia-de-hoje', { publicadoEm: new Date('2026-09-08T10:00:00Z') }),
      item('prazo-perto', { tipo: 'prazo', prazoFinal: new Date('2026-09-12T12:00:00Z') }),
    ]
    expect(ids(ordenarMural(lista, agora))).toEqual(['prazo-perto', 'noticia-de-hoje'])
  })

  it('não privilegia prazo distante', () => {
    const lista = [
      item('noticia-de-hoje', { publicadoEm: new Date('2026-09-08T10:00:00Z') }),
      item('prazo-longe', { tipo: 'prazo', prazoFinal: new Date('2026-11-01T12:00:00Z') }),
    ]
    expect(ids(ordenarMural(lista, agora))).toEqual(['noticia-de-hoje', 'prazo-longe'])
  })

  it('põe aviso urgente recente acima do restante', () => {
    const lista = [
      item('noticia-de-hoje', { publicadoEm: new Date('2026-09-08T10:00:00Z') }),
      item('urgente', {
        tipo: 'aviso',
        urgencia: 'urgente',
        publicadoEm: new Date('2026-09-06T12:00:00Z'),
      }),
    ]
    expect(ids(ordenarMural(lista, agora))).toEqual(['urgente', 'noticia-de-hoje'])
  })

  it('deixa de privilegiar aviso urgente depois de 3 dias', () => {
    const lista = [
      item('noticia-de-hoje', { publicadoEm: new Date('2026-09-08T10:00:00Z') }),
      item('urgente-velho', {
        tipo: 'aviso',
        urgencia: 'urgente',
        publicadoEm: new Date('2026-09-01T12:00:00Z'),
      }),
    ]
    expect(ids(ordenarMural(lista, agora))).toEqual(['noticia-de-hoje', 'urgente-velho'])
  })

  it('desempata por data de publicação decrescente', () => {
    const lista = [
      item('antiga', { publicadoEm: new Date('2026-09-02T12:00:00Z') }),
      item('recente', { publicadoEm: new Date('2026-09-07T12:00:00Z') }),
    ]
    expect(ids(ordenarMural(lista, agora))).toEqual(['recente', 'antiga'])
  })

  it('desempata prazos apertados pelo que vence primeiro', () => {
    const lista = [
      item('vence-depois', { tipo: 'prazo', prazoFinal: new Date('2026-09-14T12:00:00Z') }),
      item('vence-antes', { tipo: 'prazo', prazoFinal: new Date('2026-09-10T12:00:00Z') }),
    ]
    expect(ids(ordenarMural(lista, agora))).toEqual(['vence-antes', 'vence-depois'])
  })

  it('não muta o array recebido', () => {
    const lista = [item('a'), item('b', { destaque: true })]
    const copia = [...lista]
    ordenarMural(lista, agora)
    expect(lista).toEqual(copia)
  })
})
