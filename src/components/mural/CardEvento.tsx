import Link from 'next/link'
import {
  formatarDataExtenso,
  formatarHorario,
  paraAtributoDatetime,
} from '@/lib/formato/datas'
import type { PublicacaoDoMural } from '@/lib/publicacoes/tipos'
import css from './CardEvento.module.css'

export function CardEvento({ publicacao }: { publicacao: PublicacaoDoMural }) {
  const inicio = publicacao.inicioEm
  return (
    <Link className={css.card} href={`/p/${publicacao.slug}`}>
      {publicacao.imagemUrl ? (
        <img className={css.foto} src={publicacao.imagemUrl} alt={publicacao.imagemAlt ?? ''} />
      ) : null}

      {inicio ? (
        <p className={css.dia}>
          <time dateTime={paraAtributoDatetime(inicio)}>{formatarDataExtenso(inicio)}</time>
        </p>
      ) : null}

      <h3 className={css.titulo}>{publicacao.titulo}</h3>
      <p className={`narrow ${css.resumo}`}>{publicacao.resumo}</p>

      <dl className={`narrow ${css.fatos}`}>
        {inicio ? (
          <>
            <dt>Horário</dt>
            <dd>{formatarHorario(inicio, publicacao.fimEm)}</dd>
          </>
        ) : null}
        {publicacao.local ? (
          <>
            <dt>Local</dt>
            <dd>{publicacao.local}</dd>
          </>
        ) : null}
        {publicacao.vagasRestantes !== null ? (
          <>
            <dt>Vagas</dt>
            <dd>{publicacao.vagasRestantes} restantes</dd>
          </>
        ) : null}
      </dl>
    </Link>
  )
}
