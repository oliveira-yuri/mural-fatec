import { describe, it, expect } from 'vitest'
import {
  lerFiltros, escreverFiltros, semFiltro, descreverAtivos, FILTROS_PADRAO,
} from '@/lib/busca/filtros'

describe('lerFiltros', () => {
  it('usa os padrões com a query vazia', () => {
    expect(lerFiltros({})).toEqual(FILTROS_PADRAO)
  })

  it('lê os valores da query', () => {
    expect(lerFiltros({ q: 'monitoria', curso: 'ads', tipo: 'aviso', periodo: 'semana', ordem: 'prazo' }))
      .toEqual({ q: 'monitoria', curso: 'ads', tipo: 'aviso', periodo: 'semana', ordem: 'prazo' })
  })

  it('ignora tipo desconhecido em vez de quebrar', () => {
    expect(lerFiltros({ tipo: 'recado' }).tipo).toBeNull()
  })

  it('ignora período desconhecido', () => {
    expect(lerFiltros({ periodo: 'ontem' }).periodo).toBe('trinta')
  })

  it('usa o primeiro valor quando o parâmetro vem repetido', () => {
    expect(lerFiltros({ q: ['monitoria', 'tcc'] }).q).toBe('monitoria')
  })

  it('remove espaços em volta do termo', () => {
    expect(lerFiltros({ q: '  tcc  ' }).q).toBe('tcc')
  })
})

describe('escreverFiltros', () => {
  it('omite o que está no padrão', () => {
    expect(escreverFiltros(FILTROS_PADRAO)).toBe('')
  })

  it('escreve só o que difere do padrão', () => {
    expect(escreverFiltros({ ...FILTROS_PADRAO, q: 'monitoria', curso: 'ads' }))
      .toBe('q=monitoria&curso=ads')
  })

  it('codifica o termo', () => {
    expect(escreverFiltros({ ...FILTROS_PADRAO, q: 'segurança da informação' }))
      .toBe('q=seguran%C3%A7a+da+informa%C3%A7%C3%A3o')
  })
})

describe('semFiltro', () => {
  it('devolve os filtros sem o curso', () => {
    const f = { ...FILTROS_PADRAO, q: 'tcc', curso: 'ads' }
    expect(semFiltro(f, 'curso')).toEqual({ ...FILTROS_PADRAO, q: 'tcc', curso: null })
  })

  it('devolve os filtros sem o termo de busca', () => {
    const f = { ...FILTROS_PADRAO, q: 'monitoria', curso: 'ads' }
    expect(semFiltro(f, 'q')).toEqual({ ...FILTROS_PADRAO, q: '', curso: 'ads' })
  })

  it('devolve o período ao padrão', () => {
    const f = { ...FILTROS_PADRAO, periodo: 'semana' as const }
    expect(semFiltro(f, 'periodo').periodo).toBe('trinta')
  })

  it('não muta a entrada', () => {
    const f = { ...FILTROS_PADRAO, curso: 'ads' }
    semFiltro(f, 'curso')
    expect(f.curso).toBe('ads')
  })
})

describe('descreverAtivos', () => {
  const nomes = { ads: 'Análise e Desenvolvimento de Sistemas' }

  it('não lista nada quando tudo está no padrão', () => {
    expect(descreverAtivos(FILTROS_PADRAO, nomes)).toEqual([])
  })

  it('usa o nome do curso, não o slug', () => {
    const ativos = descreverAtivos({ ...FILTROS_PADRAO, curso: 'ads' }, nomes)
    expect(ativos[0].rotulo).toBe('Curso: Análise e Desenvolvimento de Sistemas')
  })

  it('o link de cada ficha remove só aquele filtro', () => {
    const ativos = descreverAtivos({ ...FILTROS_PADRAO, curso: 'ads', tipo: 'evento' }, nomes)
    const doCurso = ativos.find((a) => a.chave === 'curso')
    expect(doCurso?.href).toBe('/buscar?tipo=evento')
  })

  it('mostra o termo de busca como ficha removível', () => {
    const ativos = descreverAtivos({ ...FILTROS_PADRAO, q: 'monitoria' }, nomes)
    expect(ativos).toHaveLength(1)
    expect(ativos[0].chave).toBe('q')
    expect(ativos[0].rotulo).toBe('Busca: “monitoria”')
  })

  it('o link da ficha de busca remove só o termo', () => {
    const ativos = descreverAtivos({ ...FILTROS_PADRAO, q: 'monitoria', tipo: 'evento' }, nomes)
    const daBusca = ativos.find((a) => a.chave === 'q')
    expect(daBusca?.href).toBe('/buscar?tipo=evento')
  })

  it('descreve o período por extenso', () => {
    const ativos = descreverAtivos({ ...FILTROS_PADRAO, periodo: 'semana' }, nomes)
    expect(ativos[0].rotulo).toBe('Esta semana')
  })
})
