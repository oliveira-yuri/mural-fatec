import { describe, it, expect } from 'vitest'
import { criarSchemaPublicacao } from '@/lib/publicacoes/validacao'

const agora = new Date('2026-09-08T12:00:00Z')
const schema = criarSchemaPublicacao(agora)

const SETOR = '11111111-1111-4111-8111-111111111111'

function aviso(extra: Record<string, unknown> = {}) {
  return {
    tipo: 'aviso',
    titulo: 'Alteração no calendário acadêmico do 2º semestre',
    resumo: 'Início das aulas antecipado em uma semana.',
    corpo: 'As novas datas estão no edital anexo.',
    setorId: SETOR,
    expiraEm: new Date('2026-10-08T12:00:00Z'),
    urgencia: 'urgente',
    ...extra,
  }
}

function evento(extra: Record<string, unknown> = {}) {
  return {
    tipo: 'evento',
    titulo: 'Semana de Tecnologia',
    resumo: 'Abertura da programação.',
    corpo: 'Mesa sobre inferência em dispositivos de borda.',
    setorId: SETOR,
    expiraEm: new Date('2026-10-08T12:00:00Z'),
    inicioEm: new Date('2026-09-23T22:30:00Z'),
    local: 'Auditório do Bloco B',
    modalidade: 'presencial',
    ...extra,
  }
}

describe('campos comuns', () => {
  it('aceita um aviso completo', () => {
    expect(schema.safeParse(aviso()).success).toBe(true)
  })

  it('recusa título acima de 140 caracteres', () => {
    const r = schema.safeParse(aviso({ titulo: 'a'.repeat(141) }))
    expect(r.success).toBe(false)
  })

  it('recusa resumo acima de 220 caracteres', () => {
    const r = schema.safeParse(aviso({ resumo: 'a'.repeat(221) }))
    expect(r.success).toBe(false)
  })

  it('recusa data de saída no passado', () => {
    const r = schema.safeParse(aviso({ expiraEm: new Date('2026-09-01T12:00:00Z') }))
    expect(r.success).toBe(false)
  })
})

describe('texto alternativo', () => {
  it('recusa imagem sem descrição', () => {
    const r = schema.safeParse(aviso({ imagemUrl: 'https://exemplo.org/foto.jpg' }))
    expect(r.success).toBe(false)
    if (!r.success) {
      expect(r.error.issues.some((i) => i.path.includes('imagemAlt'))).toBe(true)
    }
  })

  it('recusa descrição em branco', () => {
    const r = schema.safeParse(
      aviso({ imagemUrl: 'https://exemplo.org/foto.jpg', imagemAlt: '   ' }),
    )
    expect(r.success).toBe(false)
  })

  it('aceita imagem com descrição', () => {
    const r = schema.safeParse(
      aviso({
        imagemUrl: 'https://exemplo.org/foto.jpg',
        imagemAlt: 'Estudantes no pátio central da Fatec Campinas',
      }),
    )
    expect(r.success).toBe(true)
  })

  it('aceita publicação sem imagem nenhuma', () => {
    expect(schema.safeParse(aviso()).success).toBe(true)
  })
})

describe('campos por tipo', () => {
  it('aceita evento completo', () => {
    expect(schema.safeParse(evento()).success).toBe(true)
  })

  it('recusa evento sem local', () => {
    const semLocal = evento()
    delete (semLocal as Record<string, unknown>).local
    expect(schema.safeParse(semLocal).success).toBe(false)
  })

  it('recusa evento sem data de início', () => {
    const semInicio = evento()
    delete (semInicio as Record<string, unknown>).inicioEm
    expect(schema.safeParse(semInicio).success).toBe(false)
  })

  it('recusa evento que termina antes de começar', () => {
    const r = schema.safeParse(evento({ fimEm: new Date('2026-09-23T20:00:00Z') }))
    expect(r.success).toBe(false)
  })

  it('recusa prazo sem data-limite', () => {
    const r = schema.safeParse({
      tipo: 'prazo',
      titulo: 'Inscrição em disciplinas',
      resumo: 'Pelo SIGA.',
      corpo: 'Detalhes no edital.',
      setorId: SETOR,
      expiraEm: new Date('2026-10-08T12:00:00Z'),
    })
    expect(r.success).toBe(false)
  })

  it('aceita notícia sem campo específico', () => {
    const r = schema.safeParse({
      tipo: 'noticia',
      titulo: 'Equipe de ADS fica em terceiro na Maratona',
      resumo: 'Vaga garantida na final nacional.',
      corpo: 'Os três alunos disputaram a etapa regional.',
      setorId: SETOR,
      expiraEm: new Date('2026-12-08T12:00:00Z'),
    })
    expect(r.success).toBe(true)
  })

  it('recusa tipo desconhecido', () => {
    expect(schema.safeParse(aviso({ tipo: 'recado' })).success).toBe(false)
  })
})
