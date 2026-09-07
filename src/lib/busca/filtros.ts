import { ROTULO_TIPO_PLURAL, TIPOS_PUBLICACAO, type TipoPublicacao } from '@/lib/publicacoes/tipos'

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

export const PERIODOS: Periodo[] = ['semana', 'trinta', 'qualquer']
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
    tipo: TIPOS_PUBLICACAO.includes(tipo) ? tipo : null,
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

/** Qual filtro uma ficha remove. O termo de busca é um filtro como os outros. */
export type ChaveDeFiltro = 'q' | 'curso' | 'tipo' | 'periodo'

export function semFiltro(f: Filtros, chave: ChaveDeFiltro): Filtros {
  if (chave === 'periodo') return { ...f, periodo: FILTROS_PADRAO.periodo }
  if (chave === 'q') return { ...f, q: '' }
  return { ...f, [chave]: null }
}

/** URL de /buscar com estes filtros. Exportada para que a tela vazia use a
 *  mesma função, em vez da cópia byte a byte que ela tinha. */
export function comQuery(f: Filtros): string {
  const qs = escreverFiltros(f)
  return qs ? `/buscar?${qs}` : '/buscar'
}

export function descreverAtivos(
  f: Filtros,
  nomesDeCurso: Record<string, string>,
): { chave: ChaveDeFiltro; rotulo: string; href: string }[] {
  const fichas: { chave: ChaveDeFiltro; rotulo: string; href: string }[] = []

  // O termo entra como ficha igual às outras: quem chega pela busca do
  // cabeçalho via lista recortada e "nenhum filtro ativo", que é o oposto do
  // que a seção de filtros ativos existe para evitar (spec §7).
  if (f.q) {
    fichas.push({
      chave: 'q',
      rotulo: `Busca: “${f.q}”`,
      href: comQuery(semFiltro(f, 'q')),
    })
  }
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
      rotulo: `Tipo: ${ROTULO_TIPO_PLURAL[f.tipo]}`,
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
