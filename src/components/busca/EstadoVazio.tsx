import Link from 'next/link'
import { escreverFiltros, semFiltro, type Filtros, type Periodo } from '@/lib/busca/filtros'
import { ROTULO_TIPO } from '@/lib/publicacoes/tipos'
import css from './EstadoVazio.module.css'

// Frase usada dentro do título ("nesta semana", não "esta semana"): o rótulo
// dos filtros (ROTULO_PERIODO) é feito para etiqueta de ficha, não para
// encaixar em frase corrida.
const FRASE_PERIODO: Record<Periodo, string> = {
  semana: 'nesta semana',
  trinta: 'nos próximos 30 dias',
  qualquer: '',
}

function href(f: Filtros): string {
  const qs = escreverFiltros(f)
  return qs ? `/buscar?${qs}` : '/buscar'
}

export function EstadoVazio({
  filtros,
  nomesDeCurso,
  saidas,
}: {
  filtros: Filtros
  nomesDeCurso: Record<string, string>
  saidas: { semPeriodo: number; semTipo: number; semCurso: number }
}) {
  const singular = filtros.tipo ? ROTULO_TIPO[filtros.tipo].toLowerCase() : 'publicação'
  const plural = filtros.tipo ? `${singular}s` : 'publicações'
  const nomeCurso = filtros.curso ? nomesDeCurso[filtros.curso] ?? filtros.curso : null

  const titulo = [
    `Nenhum ${singular}`,
    nomeCurso ? `de ${nomeCurso}` : null,
    filtros.q ? `para “${filtros.q}”` : null,
    filtros.periodo !== 'qualquer' ? FRASE_PERIODO[filtros.periodo] : null,
  ]
    .filter(Boolean)
    .join(' ')

  const partes = [
    saidas.semPeriodo > 0
      ? `Há ${saidas.semPeriodo} ${plural} desse curso mais adiante no calendário`
      : null,
    saidas.semTipo > 0 ? `${saidas.semTipo} publicações de outros tipos no mesmo recorte` : null,
  ].filter(Boolean)

  return (
    <div className={css.vazio}>
      <h2 className={css.titulo}>{titulo}</h2>
      {partes.length > 0 ? <p className={`narrow ${css.linha}`}>{partes.join(', e ')}.</p> : null}

      <div className={css.saidas}>
        {saidas.semPeriodo > 0 ? (
          <Link href={href({ ...semFiltro(filtros, 'periodo'), periodo: 'qualquer' })}>
            Ver qualquer data ({saidas.semPeriodo})
          </Link>
        ) : null}
        {saidas.semTipo > 0 ? (
          <Link href={href(semFiltro(filtros, 'tipo'))}>Incluir outros tipos ({saidas.semTipo})</Link>
        ) : null}
        {saidas.semCurso > 0 && filtros.curso ? (
          <Link href={href(semFiltro(filtros, 'curso'))}>Ver todos os cursos ({saidas.semCurso})</Link>
        ) : null}
        <Link href="/buscar">Limpar tudo</Link>
      </div>
    </div>
  )
}
