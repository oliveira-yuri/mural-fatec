import Link from 'next/link'
import { formatarDataCompleta, paraAtributoDatetime } from '@/lib/formato/datas'
import type { PublicacaoDoMural } from '@/lib/publicacoes/tipos'
import css from './NotaComunidade.module.css'

export function NotaComunidade({
  publicacao,
  variante,
}: {
  publicacao: PublicacaoDoMural
  variante: 'destaque' | 'compacta'
}) {
  const data = publicacao.publicadoEm ?? publicacao.criadoEm
  const href = `/p/${publicacao.slug}`

  if (variante === 'compacta') {
    return (
      <Link className={css.compacta} href={href}>
        <span className={`narrow ${css.procedencia}`}>
          <time dateTime={paraAtributoDatetime(data)}>{formatarDataCompleta(data)}</time>
          {' — '}
          {publicacao.setor.nome}
        </span>
        <h3 className={css.manchete}>{publicacao.titulo}</h3>
      </Link>
    )
  }

  return (
    <Link className={css.destaque} href={href}>
      {publicacao.imagemUrl ? (
        <img className={css.foto} src={publicacao.imagemUrl} alt={publicacao.imagemAlt ?? ''} />
      ) : null}
      <h3 className={css.titulo}>{publicacao.titulo}</h3>
      <p className={`narrow ${css.resumo}`}>{publicacao.resumo}</p>
      <p className={`narrow ${css.credito}`}>
        {publicacao.pessoasCitadas ? <strong>{publicacao.pessoasCitadas}</strong> : null}
        {publicacao.pessoasCitadas ? <br /> : null}
        <time dateTime={paraAtributoDatetime(data)}>{formatarDataCompleta(data)}</time>
        {', publicado por '}
        {publicacao.setor.nome}
      </p>
    </Link>
  )
}
