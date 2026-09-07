import Link from 'next/link'
import { formatarDataCurta, paraAtributoDatetime } from '@/lib/formato/datas'
import type { PublicacaoDoMural } from '@/lib/publicacoes/tipos'
import { NIVEL_PADRAO, type NivelTitulo } from './nivelTitulo'
import css from './LinhaAviso.module.css'

export function LinhaAviso({
  publicacao,
  nivel = NIVEL_PADRAO,
}: {
  publicacao: PublicacaoDoMural
  nivel?: NivelTitulo
}) {
  const data = publicacao.publicadoEm ?? publicacao.criadoEm
  const Titulo = `h${nivel}` as const
  return (
    <Link className={css.linha} href={`/p/${publicacao.slug}`}>
      <time className="narrow" dateTime={paraAtributoDatetime(data)}>
        {formatarDataCurta(data)}
      </time>
      <div>
        <Titulo className={css.titulo}>
          {publicacao.urgencia === 'urgente' ? <span className={css.selo}>Urgente</span> : null}
          {publicacao.titulo}
        </Titulo>
        <p className={`narrow ${css.resumo}`}>{publicacao.resumo}</p>
      </div>
      <span className={`narrow ${css.org}`}>{publicacao.setor.nome}</span>
    </Link>
  )
}
