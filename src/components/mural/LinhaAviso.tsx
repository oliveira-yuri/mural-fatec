import Link from 'next/link'
import { formatarDataCurta, paraAtributoDatetime } from '@/lib/formato/datas'
import type { PublicacaoDoMural } from '@/lib/publicacoes/tipos'
import css from './LinhaAviso.module.css'

export function LinhaAviso({ publicacao }: { publicacao: PublicacaoDoMural }) {
  const data = publicacao.publicadoEm ?? publicacao.criadoEm
  return (
    <Link className={css.linha} href={`/p/${publicacao.slug}`}>
      <time className="narrow" dateTime={paraAtributoDatetime(data)}>
        {formatarDataCurta(data)}
      </time>
      <div>
        <h3 className={css.titulo}>
          {publicacao.urgencia === 'urgente' ? <span className={css.selo}>Urgente</span> : null}
          {publicacao.titulo}
        </h3>
        <p className={`narrow ${css.resumo}`}>{publicacao.resumo}</p>
      </div>
      <span className={`narrow ${css.org}`}>{publicacao.setor.nome}</span>
    </Link>
  )
}
