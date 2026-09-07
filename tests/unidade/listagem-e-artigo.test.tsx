import { describe, it, expect } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { criarPublicacao } from './ajuda/publicacao'
import { ArtigoPublicacao } from '@/components/mural/ArtigoPublicacao'
import { ListaDeSecao } from '@/components/mural/ListaDeSecao'

const agora = new Date('2026-09-08T12:00:00Z')

describe('ArtigoPublicacao', () => {
  it('publicação vencida mostra o aviso de que saiu do mural, com a data', () => {
    const vencida = criarPublicacao({
      slug: 'manutencao-eletrica-no-bloco-c',
      expiraEm: new Date('2026-08-01T12:00:00Z'),
    })
    render(<ArtigoPublicacao publicacao={vencida} agora={agora} />)
    expect(screen.getByText(/saiu do mural em/)).toBeInTheDocument()
    expect(screen.getByText('1 de agosto de 2026')).toBeInTheDocument()
  })

  it('publicação vigente não mostra o aviso de saída do mural', () => {
    const vigente = criarPublicacao({
      slug: 'alteracao-no-calendario-academico-do-2-semestre',
      expiraEm: new Date('2026-10-04T12:00:00Z'),
    })
    render(<ArtigoPublicacao publicacao={vigente} agora={agora} />)
    expect(screen.queryByText(/saiu do mural em/)).not.toBeInTheDocument()
  })

  it('evento mostra os fatos de quando e onde', () => {
    const evento = criarPublicacao({
      tipo: 'evento',
      inicioEm: new Date('2026-09-23T22:30:00Z'),
      fimEm: new Date('2026-09-24T00:00:00Z'),
      local: 'Auditório do Bloco B',
    })
    render(<ArtigoPublicacao publicacao={evento} agora={agora} />)
    expect(screen.getByText('Quando')).toBeInTheDocument()
    expect(screen.getByText(/quarta-feira, 23 de setembro/)).toBeInTheDocument()
    expect(screen.getByText('Onde')).toBeInTheDocument()
    expect(screen.getByText('Auditório do Bloco B')).toBeInTheDocument()
  })

  it('prazo mostra a data-limite e a situação', () => {
    const prazo = criarPublicacao({
      tipo: 'prazo',
      prazoFinal: new Date('2026-09-12T02:59:00Z'),
    })
    render(<ArtigoPublicacao publicacao={prazo} agora={agora} />)
    expect(screen.getByText('Data-limite')).toBeInTheDocument()
    expect(screen.getByText(/sexta-feira, 11 de setembro/)).toBeInTheDocument()
    expect(screen.getByText('Situação')).toBeInTheDocument()
    expect(screen.getByText('Faltam 3 dias')).toBeInTheDocument()
  })

  it('anexo aparece com nome e tamanho', () => {
    const comAnexo = criarPublicacao({
      anexos: [{ url: 'https://exemplo.org/edital.pdf', nome: 'Edital completo', bytes: 204800, mime: 'application/pdf' }],
    })
    render(<ArtigoPublicacao publicacao={comAnexo} agora={agora} />)
    expect(screen.getByRole('heading', { name: 'Anexos' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Edital completo/ })).toHaveAttribute(
      'href',
      'https://exemplo.org/edital.pdf',
    )
    expect(screen.getByText(/200 KB/)).toBeInTheDocument()
  })

  it('sem anexos, a seção de anexos não aparece', () => {
    const semAnexo = criarPublicacao({ anexos: null })
    render(<ArtigoPublicacao publicacao={semAnexo} agora={agora} />)
    expect(screen.queryByRole('heading', { name: 'Anexos' })).not.toBeInTheDocument()
  })

  it('notícia com creditoFoto mostra o crédito', () => {
    const noticia = criarPublicacao({
      tipo: 'noticia',
      imagemUrl: 'https://exemplo.org/equipe.jpg',
      imagemAlt: 'Equipe no evento',
      creditoFoto: 'Assessoria de Comunicação',
    })
    render(<ArtigoPublicacao publicacao={noticia} agora={agora} />)
    expect(screen.getByText('Foto: Assessoria de Comunicação')).toBeInTheDocument()
  })
})

describe('ListaDeSecao', () => {
  it('lista vazia mostra a frase de seção sem publicações, em vez de nada', () => {
    render(<ListaDeSecao itens={[]} tipo="aviso" titulo="Avisos" descricao="Descrição." agora={agora} />)
    expect(screen.getByText('Nada publicado nesta seção no momento.')).toBeInTheDocument()
  })

  it('listagem de prazos renderiza a contagem de dias de cada item', () => {
    const itens = [
      criarPublicacao({ id: '1', slug: 'prazo-1', tipo: 'prazo', prazoFinal: new Date('2026-09-12T02:59:00Z') }),
    ]
    render(<ListaDeSecao itens={itens} tipo="prazo" titulo="Prazos" descricao="Descrição." agora={agora} />)
    expect(screen.getByText('Faltam 3 dias')).toBeInTheDocument()
  })

  it('listagem de eventos renderiza a data por extenso de cada item', () => {
    const itens = [
      criarPublicacao({ id: '1', slug: 'evento-1', tipo: 'evento', inicioEm: new Date('2026-09-23T22:30:00Z') }),
    ]
    render(<ListaDeSecao itens={itens} tipo="evento" titulo="Eventos" descricao="Descrição." agora={agora} />)
    expect(screen.getByText(/quarta-feira, 23 de setembro/)).toBeInTheDocument()
  })

  it('mantém a ordem recebida, sem reordenar', () => {
    const itens = [
      criarPublicacao({ id: '1', slug: 'aviso-c', tipo: 'aviso', titulo: 'Terceiro aviso' }),
      criarPublicacao({ id: '2', slug: 'aviso-a', tipo: 'aviso', titulo: 'Primeiro aviso' }),
      criarPublicacao({ id: '3', slug: 'aviso-b', tipo: 'aviso', titulo: 'Segundo aviso' }),
    ]
    render(<ListaDeSecao itens={itens} tipo="aviso" titulo="Avisos" descricao="Descrição." agora={agora} />)
    // Nível 2, e não 3: nesta página o <h1> é o título da seção e não há
    // TituloSecao no meio, então os itens são <h2>. Ver ListaDeSecao.
    const titulos = screen.getAllByRole('heading', { level: 2 }).map((el) => el.textContent)
    expect(titulos).toEqual(['Terceiro aviso', 'Primeiro aviso', 'Segundo aviso'])
  })

  it('não pula nível de título: h1 da página e h2 nos itens, sem h3', () => {
    const itens = [criarPublicacao({ id: '1', slug: 'aviso-a', tipo: 'aviso', titulo: 'Um aviso' })]
    render(<ListaDeSecao itens={itens} tipo="aviso" titulo="Avisos" descricao="Descrição." agora={agora} />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Avisos')
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Um aviso')
    expect(screen.queryByRole('heading', { level: 3 })).not.toBeInTheDocument()
  })

  it('despacha cada tipo para o componente certo, inclusive aviso e notícia', () => {
    const aviso = criarPublicacao({ id: '1', slug: 'a', tipo: 'aviso', titulo: 'Aviso', urgencia: 'urgente' })
    render(<ListaDeSecao itens={[aviso]} tipo="aviso" titulo="Avisos" descricao="Descrição." agora={agora} />)
    expect(screen.getByText('Urgente')).toBeInTheDocument()
  })

  it('notícia na listagem sai na variante compacta, sem resumo nem foto', () => {
    const noticia = criarPublicacao({
      id: '1',
      slug: 'n',
      tipo: 'noticia',
      titulo: 'Equipe de ADS fica em terceiro',
      resumo: 'Vaga garantida na final nacional.',
      imagemUrl: 'https://exemplo.org/equipe.jpg',
      imagemAlt: 'Equipe',
    })
    const { container } = render(
      <ListaDeSecao itens={[noticia]} tipo="noticia" titulo="Comunidade" descricao="Descrição." agora={agora} />,
    )
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Equipe de ADS')
    expect(screen.queryByText('Vaga garantida na final nacional.')).not.toBeInTheDocument()
    expect(container.querySelector('img')).toBeNull()
  })
})
