import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { criarPublicacao } from './ajuda/publicacao'
import { LinhaAviso } from '@/components/mural/LinhaAviso'
import { CardEvento } from '@/components/mural/CardEvento'
import { LinhaPrazo } from '@/components/mural/LinhaPrazo'
import { NotaComunidade } from '@/components/mural/NotaComunidade'

const agora = new Date('2026-09-08T12:00:00Z')

describe('LinhaAviso', () => {
  const aviso = criarPublicacao({
    tipo: 'aviso',
    titulo: 'Alteração no calendário acadêmico',
    resumo: 'Início antecipado em uma semana.',
    urgencia: 'urgente',
  })

  it('mostra o selo de urgente como texto, não só como cor', () => {
    render(<LinhaAviso publicacao={aviso} />)
    expect(screen.getByText('Urgente')).toBeInTheDocument()
  })

  it('não mostra selo em aviso informativo', () => {
    render(<LinhaAviso publicacao={criarPublicacao({ tipo: 'aviso', urgencia: 'informativo' })} />)
    expect(screen.queryByText('Urgente')).not.toBeInTheDocument()
  })

  it('escreve a data por extenso e no atributo datetime', () => {
    const { container } = render(<LinhaAviso publicacao={aviso} />)
    expect(screen.getByText('4 de setembro')).toBeInTheDocument()
    expect(container.querySelector('time')).toHaveAttribute('datetime', '2026-09-04')
  })

  it('mostra o setor emissor em repouso, sem depender de hover', () => {
    render(<LinhaAviso publicacao={aviso} />)
    expect(screen.getByText('Secretaria Acadêmica')).toBeInTheDocument()
  })

  it('leva para a página da publicação', () => {
    render(<LinhaAviso publicacao={aviso} />)
    expect(screen.getByRole('link')).toHaveAttribute('href', '/p/publicacao-de-teste')
  })
})

describe('CardEvento', () => {
  const evento = criarPublicacao({
    tipo: 'evento',
    titulo: 'Semana de Tecnologia',
    inicioEm: new Date('2026-09-23T22:30:00Z'),
    fimEm: new Date('2026-09-24T00:00:00Z'),
    local: 'Auditório do Bloco B',
    vagasRestantes: 23,
    imagemUrl: 'https://exemplo.org/auditorio.jpg',
    imagemAlt: 'Plateia no auditório do Bloco B',
  })

  it('escreve o dia da semana por extenso', () => {
    render(<CardEvento publicacao={evento} />)
    expect(screen.getByText('quarta-feira, 23 de setembro')).toBeInTheDocument()
  })

  it('mostra horário, local e vagas', () => {
    render(<CardEvento publicacao={evento} />)
    expect(screen.getByText('19h30 às 21h')).toBeInTheDocument()
    expect(screen.getByText('Auditório do Bloco B')).toBeInTheDocument()
    expect(screen.getByText('23 restantes')).toBeInTheDocument()
  })

  it('usa o texto alternativo da imagem', () => {
    render(<CardEvento publicacao={evento} />)
    expect(screen.getByAltText('Plateia no auditório do Bloco B')).toBeInTheDocument()
  })

  it('omite a linha de vagas quando o número não foi informado', () => {
    render(<CardEvento publicacao={criarPublicacao({ ...evento, vagasRestantes: null })} />)
    expect(screen.queryByText(/restantes/)).not.toBeInTheDocument()
  })

  it('funciona sem imagem', () => {
    const semFoto = criarPublicacao({ ...evento, imagemUrl: null, imagemAlt: null })
    const { container } = render(<CardEvento publicacao={semFoto} />)
    expect(container.querySelector('img')).toBeNull()
    expect(screen.getByText('Semana de Tecnologia')).toBeInTheDocument()
  })

  it('mostra "0 restantes" quando o evento lotou, em vez de omitir', () => {
    render(<CardEvento publicacao={criarPublicacao({ ...evento, vagasRestantes: 0 })} />)
    expect(screen.getByText('0 restantes')).toBeInTheDocument()
  })
})

describe('LinhaPrazo', () => {
  const perto = criarPublicacao({
    tipo: 'prazo',
    titulo: 'Inscrição em disciplinas',
    prazoFinal: new Date('2026-09-12T02:59:00Z'),
  })

  it('mostra a contagem como texto', () => {
    render(<LinhaPrazo publicacao={perto} agora={agora} />)
    expect(screen.getByText('Faltam 3 dias')).toBeInTheDocument()
  })

  it('marca o prazo apertado com atributo, não só com cor', () => {
    render(<LinhaPrazo publicacao={perto} agora={agora} />)
    expect(screen.getByText('Faltam 3 dias')).toHaveAttribute('data-estado', 'apertado')
  })

  it('não marca prazo distante como apertado', () => {
    const longe = criarPublicacao({
      tipo: 'prazo',
      prazoFinal: new Date('2026-10-10T12:00:00Z'),
    })
    render(<LinhaPrazo publicacao={longe} agora={agora} />)
    expect(screen.getByText(/Faltam \d+ dias/)).toHaveAttribute('data-estado', 'normal')
  })

  it('escreve a data-limite por extenso', () => {
    render(<LinhaPrazo publicacao={perto} agora={agora} />)
    expect(screen.getByText(/sexta-feira, 11 de setembro/)).toBeInTheDocument()
  })
})

describe('NotaComunidade', () => {
  const nota = criarPublicacao({
    tipo: 'noticia',
    titulo: 'Equipe de ADS fica em terceiro na Maratona',
    resumo: 'Vaga garantida na final nacional.',
    pessoasCitadas: 'Marcela Tsuchiya, Ithalo Bandeira e Renan Sposito',
    imagemUrl: 'https://exemplo.org/equipe.jpg',
    imagemAlt: 'Três estudantes com o certificado',
    creditoFoto: 'Assessoria de Comunicação',
  })

  it('na variante destaque, mostra foto, resumo e pessoas citadas', () => {
    render(<NotaComunidade publicacao={nota} variante="destaque" />)
    expect(screen.getByAltText('Três estudantes com o certificado')).toBeInTheDocument()
    expect(screen.getByText('Vaga garantida na final nacional.')).toBeInTheDocument()
    expect(screen.getByText(/Marcela Tsuchiya/)).toBeInTheDocument()
  })

  it('na variante destaque, mostra o crédito da fotografia', () => {
    render(<NotaComunidade publicacao={nota} variante="destaque" />)
    expect(screen.getByText('Foto: Assessoria de Comunicação')).toBeInTheDocument()
  })

  it('omite o crédito quando a foto não tem um', () => {
    const semCredito = criarPublicacao({ ...nota, creditoFoto: null })
    render(<NotaComunidade publicacao={semCredito} variante="destaque" />)
    expect(screen.queryByText(/^Foto:/)).not.toBeInTheDocument()
  })

  it('na variante compacta, mostra só manchete e procedência', () => {
    const { container } = render(<NotaComunidade publicacao={nota} variante="compacta" />)
    expect(container.querySelector('img')).toBeNull()
    expect(screen.queryByText('Vaga garantida na final nacional.')).not.toBeInTheDocument()
    expect(screen.getByText(/Secretaria Acadêmica/)).toBeInTheDocument()
  })
})
