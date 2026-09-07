import Link from 'next/link'
import { formatarDataCompleta, paraAtributoDatetime } from '@/lib/formato/datas'
import type { PublicacaoDoMural } from '@/lib/publicacoes/tipos'
import css from './Hero.module.css'

function emKb(bytes: number): string {
  return `${Math.round(bytes / 1024)} KB`
}

export function Hero({ publicacao }: { publicacao: PublicacaoDoMural }) {
  const data = publicacao.publicadoEm ?? publicacao.criadoEm
  const anexo = publicacao.anexos?.[0] ?? null

  const identificacao = [
    publicacao.documentoNumero ? `Comunicado ${publicacao.documentoNumero}` : null,
    publicacao.setor.nome,
  ]
    .filter(Boolean)
    .join(' — ')

  return (
    <section className={css.hero}>
      {publicacao.imagemUrl ? (
        <img className={css.fundo} src={publicacao.imagemUrl} alt={publicacao.imagemAlt ?? ''} />
      ) : null}

      <div className={css.veu}>
        <div className="pagina">
          <div className={css.caixa}>
            <p className={css.identificacao}>
              {identificacao}
              {' — '}
              <time dateTime={paraAtributoDatetime(data)}>{formatarDataCompleta(data)}</time>
            </p>
            <h1 className={css.titulo}>{publicacao.titulo}</h1>
            <p className={`narrow ${css.resumo}`}>{publicacao.resumo}</p>
            <div className={css.acoes}>
              <Link className={css.acao} href={`/p/${publicacao.slug}`}>Ler o comunicado</Link>
              {anexo ? (
                <a className={`${css.acao} ${css.claro}`} href={anexo.url}>
                  Baixar edital ({emKb(anexo.bytes)})
                </a>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
