import { describe, it, expect } from 'vitest'
import { gerarSlug, semAcento } from '@/lib/publicacoes/slug'

describe('semAcento', () => {
  it('remove acento preservando a letra', () => {
    expect(semAcento('Alteração no calendário acadêmico'))
      .toBe('Alteracao no calendario academico')
  })

  it('não mexe em texto sem acento', () => {
    expect(semAcento('monitoria remunerada')).toBe('monitoria remunerada')
  })
})

describe('gerarSlug', () => {
  it('remove acentos e deixa em minúsculas', () => {
    expect(gerarSlug('Alteração no calendário acadêmico'))
      .toBe('alteracao-no-calendario-academico')
  })

  it('troca cedilha e pontuação por hífen', () => {
    expect(gerarSlug('Inscrição: monitoria 2026/2!')).toBe('inscricao-monitoria-2026-2')
  })

  it('não deixa hífen no começo nem no fim', () => {
    expect(gerarSlug('  — Feira de estágios —  ')).toBe('feira-de-estagios')
  })

  it('colapsa hifens repetidos', () => {
    expect(gerarSlug('TCC --- entrega final')).toBe('tcc-entrega-final')
  })

  it('preserva o ordinal como número', () => {
    expect(gerarSlug('Calendário do 2º semestre')).toBe('calendario-do-2-semestre')
  })
})
