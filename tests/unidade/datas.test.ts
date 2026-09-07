import { describe, it, expect } from 'vitest'
import {
  formatarDataExtenso,
  formatarDataCurta,
  formatarDataCompleta,
  formatarHorario,
  paraAtributoDatetime,
} from '@/lib/formato/datas'

// 23/09/2026 19h30 em São Paulo (UTC-3) = 22h30 UTC
const evento = new Date('2026-09-23T22:30:00Z')
const fimEvento = new Date('2026-09-24T00:00:00Z') // 21h00 em São Paulo

describe('formatarDataExtenso', () => {
  it('escreve dia da semana, dia e mês', () => {
    expect(formatarDataExtenso(evento)).toBe('quarta-feira, 23 de setembro')
  })
})

describe('formatarDataCurta', () => {
  it('escreve dia e mês', () => {
    expect(formatarDataCurta(new Date('2026-09-04T15:00:00Z'))).toBe('4 de setembro')
  })
})

describe('formatarDataCompleta', () => {
  it('inclui o ano', () => {
    expect(formatarDataCompleta(new Date('2026-09-02T15:00:00Z'))).toBe('2 de setembro de 2026')
  })
})

describe('formatarHorario', () => {
  it('usa "às" quando há fim', () => {
    expect(formatarHorario(evento, fimEvento)).toBe('19h30 às 21h')
  })

  it('omite minutos redondos', () => {
    expect(formatarHorario(fimEvento)).toBe('21h')
  })

  it('funciona sem hora de fim', () => {
    expect(formatarHorario(evento)).toBe('19h30')
  })
})

describe('paraAtributoDatetime', () => {
  it('devolve a data no fuso de São Paulo, não em UTC', () => {
    // 00h30 UTC do dia 24 ainda é dia 23 em São Paulo
    expect(paraAtributoDatetime(new Date('2026-09-24T00:30:00Z'))).toBe('2026-09-23')
  })
})
