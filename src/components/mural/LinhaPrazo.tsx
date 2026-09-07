import Link from 'next/link'
import { formatarDataExtenso, paraAtributoDatetime } from '@/lib/formato/datas'
import { estadoDoPrazo, rotuloContagem } from '@/lib/publicacoes/exibicao'
import type { PublicacaoDoMural } from '@/lib/publicacoes/tipos'
import css from './LinhaPrazo.module.css'

export function LinhaPrazo({
  publicacao,
  agora,
}: {
  publicacao: PublicacaoDoMural
  agora: Date
}) {
  const prazo = publicacao.prazoFinal
  if (!prazo) return null

  return (
    <Link className={css.linha} href={`/p/${publicacao.slug}`}>
      <div>
        <h3 className={css.titulo}>{publicacao.titulo}</h3>
        <span className={`narrow ${css.sub}`}>{publicacao.resumo}</span>
      </div>
      <span className={`narrow ${css.ate}`}>
        Até <time dateTime={paraAtributoDatetime(prazo)}>{formatarDataExtenso(prazo)}</time>
      </span>
      <span className={css.falta} data-estado={estadoDoPrazo(prazo, agora)}>
        {rotuloContagem(prazo, agora)}
      </span>
    </Link>
  )
}
