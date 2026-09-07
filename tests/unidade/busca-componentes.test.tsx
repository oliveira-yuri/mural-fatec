import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { BarraFiltros } from '@/components/busca/BarraFiltros'
import { FichasAtivas } from '@/components/busca/FichasAtivas'
import { EstadoVazio } from '@/components/busca/EstadoVazio'
import { FILTROS_PADRAO } from '@/lib/busca/filtros'

const CURSOS = [
  { nome: 'Análise e Desenvolvimento de Sistemas', sigla: 'ADS', slug: 'ads' },
  { nome: 'Segurança da Informação', sigla: 'SI', slug: 'si' },
]
const NOMES = { ads: 'Análise e Desenvolvimento de Sistemas', si: 'Segurança da Informação' }

describe('BarraFiltros', () => {
  it('envia por GET para /buscar', () => {
    const { container } = render(<BarraFiltros filtros={FILTROS_PADRAO} cursos={CURSOS} />)
    const form = container.querySelector('form')
    expect(form).toHaveAttribute('method', 'get')
    expect(form).toHaveAttribute('action', '/buscar')
  })

  it('rotula todos os campos', () => {
    render(<BarraFiltros filtros={FILTROS_PADRAO} cursos={CURSOS} />)
    expect(screen.getByLabelText('Buscar')).toBeInTheDocument()
    expect(screen.getByLabelText('Curso')).toBeInTheDocument()
    expect(screen.getByLabelText('Tipo')).toBeInTheDocument()
    expect(screen.getByLabelText('Período')).toBeInTheDocument()
    expect(screen.getByLabelText('Ordenar por')).toBeInTheDocument()
  })

  it('preserva o que já estava selecionado', () => {
    render(<BarraFiltros filtros={{ ...FILTROS_PADRAO, q: 'monitoria', curso: 'ads' }} cursos={CURSOS} />)
    expect(screen.getByLabelText('Buscar')).toHaveValue('monitoria')
    expect(screen.getByLabelText('Curso')).toHaveValue('ads')
  })

  it('lista os cursos vindos do banco', () => {
    render(<BarraFiltros filtros={FILTROS_PADRAO} cursos={CURSOS} />)
    expect(screen.getByRole('option', { name: 'Segurança da Informação' })).toBeInTheDocument()
  })
})

describe('FichasAtivas', () => {
  it('não aparece quando não há filtro ativo', () => {
    const { container } = render(<FichasAtivas filtros={FILTROS_PADRAO} nomesDeCurso={NOMES} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('mostra uma ficha por filtro, com link que remove aquele filtro', () => {
    render(<FichasAtivas filtros={{ ...FILTROS_PADRAO, curso: 'ads', tipo: 'evento' }} nomesDeCurso={NOMES} />)
    expect(screen.getByRole('link', { name: /Remover.*Análise e Desenvolvimento/ })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Limpar todos os filtros' })).toHaveAttribute('href', '/buscar')
  })
})

describe('EstadoVazio', () => {
  const filtros = { ...FILTROS_PADRAO, tipo: 'evento' as const, curso: 'si', periodo: 'semana' as const }

  it('nomeia o recorte que esvaziou a lista', () => {
    render(<EstadoVazio filtros={filtros} nomesDeCurso={NOMES} saidas={{ semPeriodo: 6, semTipo: 3, semCurso: 9 }} />)
    expect(screen.getByRole('heading', { level: 2 }))
      .toHaveTextContent('Nenhum evento de Segurança da Informação nesta semana')
  })

  it('conta o que existe fora do recorte', () => {
    render(<EstadoVazio filtros={filtros} nomesDeCurso={NOMES} saidas={{ semPeriodo: 6, semTipo: 3, semCurso: 9 }} />)
    expect(screen.getByText(/6 eventos desse curso mais adiante/)).toBeInTheDocument()
  })

  it('oferece só as saídas que levam a algum resultado', () => {
    render(<EstadoVazio filtros={filtros} nomesDeCurso={NOMES} saidas={{ semPeriodo: 6, semTipo: 0, semCurso: 9 }} />)
    expect(screen.getByRole('link', { name: /Ver qualquer data/ })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /Incluir outros tipos/ })).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Ver todos os cursos/ })).toBeInTheDocument()
  })

  it('usa artigo e substantivo certos quando não há filtro de tipo', () => {
    render(
      <EstadoVazio
        filtros={{ ...FILTROS_PADRAO, curso: 'si', periodo: 'semana' }}
        nomesDeCurso={NOMES}
        saidas={{ semPeriodo: 1, semTipo: 0, semCurso: 1 }}
      />,
    )
    expect(screen.getByRole('heading', { level: 2 }))
      .toHaveTextContent('Nenhuma publicação de Segurança da Informação nesta semana')
  })

  it('usa o gênero certo para notícia', () => {
    render(
      <EstadoVazio
        filtros={{ ...FILTROS_PADRAO, tipo: 'noticia', curso: 'si', periodo: 'semana' }}
        nomesDeCurso={NOMES}
        saidas={{ semPeriodo: 1, semTipo: 0, semCurso: 1 }}
      />,
    )
    expect(screen.getByRole('heading', { level: 2 }))
      .toHaveTextContent('Nenhuma notícia de Segurança da Informação nesta semana')
  })
})
