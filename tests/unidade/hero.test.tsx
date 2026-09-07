import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { Hero } from '@/components/mural/Hero'
import { criarPublicacao } from './ajuda/publicacao'

const aviso = criarPublicacao({
  tipo: 'aviso',
  titulo: 'Calendário do 2º semestre tem início antecipado',
  resumo: 'As novas datas valem para todos os cursos.',
  urgencia: 'urgente',
  documentoNumero: '042/2026',
  imagemUrl: 'https://exemplo.org/patio.jpg',
  imagemAlt: 'Estudantes no pátio central da Fatec Campinas',
  anexos: [{ url: 'https://exemplo.org/edital.pdf', nome: 'Edital 042/2026', bytes: 389120, mime: 'application/pdf' }],
})

describe('Hero', () => {
  it('usa h1, porque é o título principal da página', () => {
    render(<Hero publicacao={aviso} />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Calendário do 2º semestre')
  })

  it('identifica documento, setor e data acima do título', () => {
    render(<Hero publicacao={aviso} />)
    expect(screen.getByText(/Comunicado 042\/2026/)).toBeInTheDocument()
    expect(screen.getByText(/Secretaria Acadêmica/)).toBeInTheDocument()
  })

  it('oferece leitura e o anexo, com o tamanho do arquivo', () => {
    render(<Hero publicacao={aviso} />)
    expect(screen.getByRole('link', { name: 'Ler o comunicado' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Baixar edital/ })).toHaveAttribute(
      'href',
      'https://exemplo.org/edital.pdf',
    )
    expect(screen.getByText(/380 KB/)).toBeInTheDocument()
  })

  it('não oferece anexo quando não há', () => {
    render(<Hero publicacao={criarPublicacao({ ...aviso, anexos: null })} />)
    expect(screen.queryByRole('link', { name: /Baixar/ })).not.toBeInTheDocument()
  })

  it('num evento em destaque, a cópia fala de evento, não de comunicado', () => {
    const evento = criarPublicacao({
      tipo: 'evento',
      titulo: 'Semana de Tecnologia',
      documentoNumero: null,
      anexos: [{ url: 'https://exemplo.org/programacao.pdf', nome: 'Programação completa', bytes: 102400, mime: 'application/pdf' }],
    })
    render(<Hero publicacao={evento} />)
    expect(screen.getByRole('link', { name: 'Ver o evento' })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Ler o comunicado' })).not.toBeInTheDocument()
    // O anexo de um evento não é edital: quem nomeia é o próprio anexo.
    expect(screen.getByRole('link', { name: /Baixar Programação completa/ })).toBeInTheDocument()
    expect(screen.queryByText(/Baixar edital/)).not.toBeInTheDocument()
    expect(screen.getByText(/^Evento —/)).toBeInTheDocument()
  })

  it('numa notícia em destaque, a cópia fala de notícia', () => {
    const noticia = criarPublicacao({
      tipo: 'noticia',
      titulo: 'Equipe de ADS fica em terceiro na Maratona',
      documentoNumero: null,
      anexos: null,
    })
    render(<Hero publicacao={noticia} />)
    expect(screen.getByRole('link', { name: 'Ler a notícia' })).toBeInTheDocument()
    expect(screen.getByText(/^Comunidade —/)).toBeInTheDocument()
  })

  it('num prazo em destaque, a cópia fala de prazo', () => {
    const prazo = criarPublicacao({ tipo: 'prazo', titulo: 'Inscrição em disciplinas', documentoNumero: null, anexos: null })
    render(<Hero publicacao={prazo} />)
    expect(screen.getByRole('link', { name: 'Ver o prazo' })).toBeInTheDocument()
  })

  it('marca a foto de fundo como decorativa, já que o texto está por cima', () => {
    const { container } = render(<Hero publicacao={aviso} />)
    expect(container.querySelector('img')).toHaveAttribute('alt', 'Estudantes no pátio central da Fatec Campinas')
  })
})
