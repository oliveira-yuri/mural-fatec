import Link from 'next/link'
import { formatarDataExtenso, paraAtributoDatetime } from '@/lib/formato/datas'
import { estadoDoPrazo, rotuloContagem } from '@/lib/publicacoes/exibicao'
import type { PublicacaoDoMural } from '@/lib/publicacoes/tipos'
import { NIVEL_PADRAO, type NivelTitulo } from './nivelTitulo'
import css from './LinhaPrazo.module.css'

export function LinhaPrazo({
  publicacao,
  agora,
  nivel = NIVEL_PADRAO,
}: {
  publicacao: PublicacaoDoMural
  agora: Date
  nivel?: NivelTitulo
}) {
  const prazo = publicacao.prazoFinal
  if (!prazo) return null
  const Titulo = `h${nivel}` as const

  return (
    <Link className={css.linha} href={`/p/${publicacao.slug}`}>
      <div>
        <Titulo className={css.titulo}>{publicacao.titulo}</Titulo>
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
