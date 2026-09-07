import Link from 'next/link'
import { formatarDataCompleta, paraAtributoDatetime } from '@/lib/formato/datas'
import type { PublicacaoDoMural } from '@/lib/publicacoes/tipos'
import { NIVEL_PADRAO, type NivelTitulo } from './nivelTitulo'
import css from './NotaComunidade.module.css'

export function NotaComunidade({
  publicacao,
  variante,
  nivel = NIVEL_PADRAO,
}: {
  publicacao: PublicacaoDoMural
  variante: 'destaque' | 'compacta'
  nivel?: NivelTitulo
}) {
  const data = publicacao.publicadoEm ?? publicacao.criadoEm
  const href = `/p/${publicacao.slug}`
  const Titulo = `h${nivel}` as const

  if (variante === 'compacta') {
    return (
      <Link className={css.compacta} href={href}>
        <span className={`narrow ${css.procedencia}`}>
          <time dateTime={paraAtributoDatetime(data)}>{formatarDataCompleta(data)}</time>
          {' — '}
          {publicacao.setor.nome}
        </span>
        <Titulo className={css.manchete}>{publicacao.titulo}</Titulo>
      </Link>
    )
  }

  return (
    <Link className={css.destaque} href={href}>
      {publicacao.imagemUrl ? (
        <figure className={css.figura}>
          <img className={css.foto} src={publicacao.imagemUrl} alt={publicacao.imagemAlt ?? ''} />
          {publicacao.creditoFoto ? (
            <figcaption className={`narrow ${css.creditoFoto}`}>
              Foto: {publicacao.creditoFoto}
            </figcaption>
          ) : null}
        </figure>
      ) : null}
      <Titulo className={css.titulo}>{publicacao.titulo}</Titulo>
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
