import { describe, it, expect } from 'vitest'
import { diasAte, estadoDoPrazo, rotuloContagem, estaVigente } from '@/lib/publicacoes/exibicao'

const agora = new Date('2026-09-08T12:00:00Z') // 8 de setembro, 9h em São Paulo

describe('diasAte', () => {
  it('conta dias de calendário, não períodos de 24 horas', () => {
    // 12/09 às 23h59 em São Paulo = 13/09 02h59 UTC
    expect(diasAte(new Date('2026-09-13T02:59:00Z'), agora)).toBe(4)
  })

  it('devolve 0 no mesmo dia, mesmo faltando poucas horas', () => {
    expect(diasAte(new Date('2026-09-08T23:00:00Z'), agora)).toBe(0)
  })

  it('devolve negativo para data passada', () => {
    expect(diasAte(new Date('2026-09-05T12:00:00Z'), agora)).toBe(-3)
  })
})

describe('estadoDoPrazo', () => {
  it('marca como apertado quando faltam 7 dias ou menos', () => {
    expect(estadoDoPrazo(new Date('2026-09-15T12:00:00Z'), agora)).toBe('apertado')
  })

  it('marca como normal quando faltam mais de 7 dias', () => {
    expect(estadoDoPrazo(new Date('2026-09-16T12:00:00Z'), agora)).toBe('normal')
  })

  it('marca como vencido depois da data', () => {
    expect(estadoDoPrazo(new Date('2026-09-07T12:00:00Z'), agora)).toBe('vencido')
  })
})

describe('rotuloContagem', () => {
  it('usa plural', () => {
    expect(rotuloContagem(new Date('2026-09-12T12:00:00Z'), agora)).toBe('Faltam 4 dias')
  })

  it('usa singular com um dia', () => {
    expect(rotuloContagem(new Date('2026-09-09T12:00:00Z'), agora)).toBe('Falta 1 dia')
  })

  it('avisa quando termina hoje', () => {
    expect(rotuloContagem(new Date('2026-09-08T23:00:00Z'), agora)).toBe('Termina hoje')
  })

  it('avisa quando encerrou', () => {
    expect(rotuloContagem(new Date('2026-09-01T12:00:00Z'), agora)).toBe('Encerrado')
  })
})

describe('estaVigente', () => {
  it('aceita publicada e dentro da validade', () => {
    const p = { status: 'publicado', expiraEm: new Date('2026-10-01T12:00:00Z') }
    expect(estaVigente(p, agora)).toBe(true)
  })

  it('recusa publicada e vencida', () => {
    const p = { status: 'publicado', expiraEm: new Date('2026-09-01T12:00:00Z') }
    expect(estaVigente(p, agora)).toBe(false)
  })

  it('recusa rascunho dentro da validade', () => {
    const p = { status: 'rascunho', expiraEm: new Date('2026-10-01T12:00:00Z') }
    expect(estaVigente(p, agora)).toBe(false)
  })
})
