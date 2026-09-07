import type { TipoPublicacao } from '@/lib/publicacoes/tipos'

export type Periodo = 'semana' | 'trinta' | 'qualquer'
export type Ordem = 'recentes' | 'prazo'

export type Filtros = {
  q: string
  curso: string | null
  tipo: TipoPublicacao | null
  periodo: Periodo
  ordem: Ordem
}

export const FILTROS_PADRAO: Filtros = {
  q: '',
  curso: null,
  tipo: null,
  periodo: 'trinta',
  ordem: 'recentes',
}

const TIPOS: TipoPublicacao[] = ['aviso', 'evento', 'prazo', 'noticia']
const PERIODOS: Periodo[] = ['semana', 'trinta', 'qualquer']
const ORDENS: Ordem[] = ['recentes', 'prazo']

export const ROTULO_PERIODO: Record<Periodo, string> = {
  semana: 'Esta semana',
  trinta: 'Próximos 30 dias',
  qualquer: 'Qualquer data',
}

function primeiro(valor: string | string[] | undefined): string {
  if (Array.isArray(valor)) return valor[0] ?? ''
  return valor ?? ''
}

export function lerFiltros(params: Record<string, string | string[] | undefined>): Filtros {
  const tipo = primeiro(params.tipo) as TipoPublicacao
  const periodo = primeiro(params.periodo) as Periodo
  const ordem = primeiro(params.ordem) as Ordem
  const curso = primeiro(params.curso).trim()

  return {
    q: primeiro(params.q).trim(),
    curso: curso === '' ? null : curso,
    tipo: TIPOS.includes(tipo) ? tipo : null,
    periodo: PERIODOS.includes(periodo) ? periodo : FILTROS_PADRAO.periodo,
    ordem: ORDENS.includes(ordem) ? ordem : FILTROS_PADRAO.ordem,
  }
}

export function escreverFiltros(f: Filtros): string {
  const p = new URLSearchParams()
  if (f.q) p.set('q', f.q)
  if (f.curso) p.set('curso', f.curso)
  if (f.tipo) p.set('tipo', f.tipo)
  if (f.periodo !== FILTROS_PADRAO.periodo) p.set('periodo', f.periodo)
  if (f.ordem !== FILTROS_PADRAO.ordem) p.set('ordem', f.ordem)
  return p.toString()
}

export function semFiltro(f: Filtros, chave: 'curso' | 'tipo' | 'periodo'): Filtros {
  if (chave === 'periodo') return { ...f, periodo: FILTROS_PADRAO.periodo }
  return { ...f, [chave]: null }
}

function comQuery(f: Filtros): string {
  const qs = escreverFiltros(f)
  return qs ? `/buscar?${qs}` : '/buscar'
}

export function descreverAtivos(
  f: Filtros,
  nomesDeCurso: Record<string, string>,
): { chave: 'curso' | 'tipo' | 'periodo'; rotulo: string; href: string }[] {
  const rotuloTipo: Record<TipoPublicacao, string> = {
    aviso: 'Avisos',
    evento: 'Eventos',
    prazo: 'Prazos',
    noticia: 'Comunidade',
  }

  const fichas: { chave: 'curso' | 'tipo' | 'periodo'; rotulo: string; href: string }[] = []

  if (f.curso) {
    fichas.push({
      chave: 'curso',
      rotulo: `Curso: ${nomesDeCurso[f.curso] ?? f.curso}`,
      href: comQuery(semFiltro(f, 'curso')),
    })
  }
  if (f.tipo) {
    fichas.push({
      chave: 'tipo',
      rotulo: `Tipo: ${rotuloTipo[f.tipo]}`,
      href: comQuery(semFiltro(f, 'tipo')),
    })
  }
  if (f.periodo !== FILTROS_PADRAO.periodo) {
    fichas.push({
      chave: 'periodo',
      rotulo: ROTULO_PERIODO[f.periodo],
      href: comQuery(semFiltro(f, 'periodo')),
    })
  }

  return fichas
}
