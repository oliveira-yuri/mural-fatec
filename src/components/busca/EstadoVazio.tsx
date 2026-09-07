import Link from 'next/link'
import { comQuery, semFiltro, type Filtros, type Periodo } from '@/lib/busca/filtros'
import type { TipoPublicacao } from '@/lib/publicacoes/tipos'
import css from './EstadoVazio.module.css'

// Frase usada dentro do título ("nesta semana", não "esta semana"): o rótulo
// dos filtros (ROTULO_PERIODO) é feito para etiqueta de ficha, não para
// encaixar em frase corrida.
const FRASE_PERIODO: Record<Periodo, string> = {
  semana: 'nesta semana',
  trinta: 'nos próximos 30 dias',
  qualquer: '',
}

/**
 * Como cada tipo aparece numa frase, com o artigo certo. Não dá para derivar
 * de ROTULO_TIPO: ele é rótulo de seção ("Comunidade"), e "Nenhuma comunidade
 * de ADS" não é português. O gênero também não é adivinhável — sem isto a
 * tela mais comum de resultado zero dizia "Nenhum publicação".
 */
const NA_FRASE: Record<TipoPublicacao, { artigo: string; nome: string }> = {
  aviso: { artigo: 'Nenhum', nome: 'aviso' },
  evento: { artigo: 'Nenhum', nome: 'evento' },
  prazo: { artigo: 'Nenhum', nome: 'prazo' },
  noticia: { artigo: 'Nenhuma', nome: 'notícia' },
}

const SEM_TIPO = { artigo: 'Nenhuma', nome: 'publicação' }

export function EstadoVazio({
  filtros,
  nomesDeCurso,
  saidas,
}: {
  filtros: Filtros
  nomesDeCurso: Record<string, string>
  saidas: { semPeriodo: number; semTipo: number; semCurso: number }
}) {
  const { artigo, nome: nomeTipo } = filtros.tipo ? NA_FRASE[filtros.tipo] : SEM_TIPO
  const plural = filtros.tipo ? `${nomeTipo}s` : 'publicações'
  // Curso pedido que não existe na lista de cursos: a busca devolve zero de
  // propósito (`consulta.ts`), e aqui a tela precisa dizer por quê, em vez de
  // repetir o slug como se fosse nome de curso.
  const cursoDesconhecido = filtros.curso !== null && !(filtros.curso in nomesDeCurso)
  const nomeCurso = filtros.curso && !cursoDesconhecido ? nomesDeCurso[filtros.curso] : null

  const titulo = [
    `${artigo} ${nomeTipo}`,
    nomeCurso ? `de ${nomeCurso}` : null,
    filtros.q ? `para “${filtros.q}”` : null,
    filtros.periodo !== 'qualquer' ? FRASE_PERIODO[filtros.periodo] : null,
  ]
    .filter(Boolean)
    .join(' ')

  // Cada pedaço da frase só entra com o filtro correspondente ativo: sem
  // isto, quem buscava sem escolher curso lia "Há 6 eventos desse curso mais
  // adiante no calendário" sem ter escolhido curso nenhum.
  const partes = [
    saidas.semPeriodo > 0
      ? `Há ${saidas.semPeriodo} ${plural}${nomeCurso ? ' desse curso' : ''} mais adiante no calendário`
      : null,
    saidas.semTipo > 0 ? `${saidas.semTipo} publicações de outros tipos no mesmo recorte` : null,
  ].filter(Boolean)

  return (
    <div className={css.vazio}>
      <h2 className={css.titulo}>{titulo}</h2>
      {cursoDesconhecido ? (
        <p className={`narrow ${css.linha}`}>
          O curso “{filtros.curso}” não está na lista de cursos do mural.
        </p>
      ) : null}
      {partes.length > 0 ? <p className={`narrow ${css.linha}`}>{partes.join(', e ')}.</p> : null}

      <div className={css.saidas}>
        {saidas.semPeriodo > 0 ? (
          <Link href={comQuery({ ...semFiltro(filtros, 'periodo'), periodo: 'qualquer' })}>
            Ver qualquer data ({saidas.semPeriodo})
          </Link>
        ) : null}
        {saidas.semTipo > 0 ? (
          <Link href={comQuery(semFiltro(filtros, 'tipo'))}>Incluir outros tipos ({saidas.semTipo})</Link>
        ) : null}
        {saidas.semCurso > 0 && filtros.curso ? (
          <Link href={comQuery(semFiltro(filtros, 'curso'))}>Ver todos os cursos ({saidas.semCurso})</Link>
        ) : null}
        <Link href="/buscar">Limpar tudo</Link>
      </div>
    </div>
  )
}
