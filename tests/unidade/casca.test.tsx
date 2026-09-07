import { describe, it, expect } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { Cabecalho } from '@/components/layout/Cabecalho'
import { Navegacao } from '@/components/layout/Navegacao'
import { Rodape } from '@/components/layout/Rodape'

describe('Cabecalho', () => {
  it('mostra a marca com a unidade', () => {
    render(<Cabecalho />)
    expect(screen.getByText('Fatec')).toBeInTheDocument()
    expect(screen.getByText('Campinas')).toBeInTheDocument()
  })

  it('tem campo de busca com rótulo acessível', () => {
    render(<Cabecalho />)
    expect(screen.getByLabelText('Buscar no mural')).toBeInTheDocument()
  })

  it('envia a busca por GET para /buscar, para que o resultado seja compartilhável', () => {
    const { container } = render(<Cabecalho />)
    const form = container.querySelector('form')
    expect(form).toHaveAttribute('action', '/buscar')
    expect(form).toHaveAttribute('method', 'get')
  })
})

describe('Navegacao', () => {
  it('lista as seções do mural', () => {
    render(<Navegacao ativo="/" />)
    const nav = screen.getByRole('navigation', { name: 'Seções do mural' })
    for (const rotulo of ['Tudo', 'Avisos', 'Eventos', 'Prazos', 'Comunidade']) {
      expect(within(nav).getByRole('link', { name: rotulo })).toBeInTheDocument()
    }
  })

  it('marca a seção atual com aria-current', () => {
    render(<Navegacao ativo="/eventos" />)
    expect(screen.getByRole('link', { name: 'Eventos' })).toHaveAttribute('aria-current', 'page')
  })

  it('não marca as demais', () => {
    render(<Navegacao ativo="/eventos" />)
    expect(screen.getByRole('link', { name: 'Avisos' })).not.toHaveAttribute('aria-current')
  })
})

describe('Rodape', () => {
  const CURSOS = [
    { nome: 'Análise e Desenvolvimento de Sistemas', slug: 'analise-e-desenvolvimento-de-sistemas' },
    { nome: 'Gestão Empresarial', slug: 'gestao-empresarial' },
  ]

  it('agrupa links em colunas com título', () => {
    render(<Rodape cursos={CURSOS} />)
    expect(screen.getByRole('heading', { name: 'O mural' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Por curso' })).toBeInTheDocument()
  })

  it('identifica a instituição', () => {
    render(<Rodape cursos={CURSOS} />)
    expect(screen.getByText(/Centro Paula Souza/)).toBeInTheDocument()
  })

  it('monta os links de curso a partir dos cursos recebidos, não de slugs fixos', () => {
    render(<Rodape cursos={[{ nome: 'Segurança da Informação', slug: 'si-noturno' }]} />)
    expect(screen.getByRole('link', { name: 'Segurança da Informação' }))
      .toHaveAttribute('href', '/buscar?curso=si-noturno')
    expect(screen.queryByRole('link', { name: 'Gestão Empresarial' })).not.toBeInTheDocument()
  })

  it('sem cursos cadastrados, não mostra uma coluna "Por curso" vazia', () => {
    render(<Rodape cursos={[]} />)
    expect(screen.queryByRole('heading', { name: 'Por curso' })).not.toBeInTheDocument()
  })
})
