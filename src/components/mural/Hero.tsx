import Link from 'next/link'
import { formatarDataCompleta, paraAtributoDatetime } from '@/lib/formato/datas'
import { ROTULO_TIPO, type PublicacaoDoMural, type TipoPublicacao } from '@/lib/publicacoes/tipos'
import css from './Hero.module.css'

/**
 * O destaque não é necessariamente um aviso: `escolherDestaque` procura aviso
 * fixado, depois aviso urgente, e então cai no primeiro item da lista, de
 * qualquer tipo — o que acontece em toda semana sem aviso vigente (recesso,
 * começo de semestre). A cópia dos botões segue o tipo, para o mural não
 * chamar de comunicado o que é evento.
 */
const ACAO_POR_TIPO: Record<TipoPublicacao, string> = {
  aviso: 'Ler o comunicado',
  evento: 'Ver o evento',
  prazo: 'Ver o prazo',
  noticia: 'Ler a notícia',
}

function emKb(bytes: number): string {
  return `${Math.round(bytes / 1024)} KB`
}

export function Hero({ publicacao }: { publicacao: PublicacaoDoMural }) {
  const data = publicacao.publicadoEm ?? publicacao.criadoEm
  const anexo = publicacao.anexos?.[0] ?? null

  // "Comunicado 042/2026" só vale para aviso — `documentoNumero` é campo de
  // aviso. Nos demais tipos a linha nomeia o tipo, que é a informação que o
  // número dava.
  const identificacao = [
    publicacao.tipo === 'aviso' && publicacao.documentoNumero
      ? `Comunicado ${publicacao.documentoNumero}`
      : ROTULO_TIPO[publicacao.tipo],
    publicacao.setor.nome,
  ]
    .filter(Boolean)
    .join(' — ')

  // "Baixar edital" é nome de anexo de aviso. Nos outros tipos o anexo é
  // programação, formulário, regulamento — então quem nomeia é o próprio
  // anexo.
  const rotuloAnexo =
    publicacao.tipo === 'aviso' ? 'Baixar edital' : `Baixar ${anexo?.nome ?? 'anexo'}`

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
              <Link className={css.acao} href={`/p/${publicacao.slug}`}>
                {ACAO_POR_TIPO[publicacao.tipo]}
              </Link>
              {anexo ? (
                <a className={`${css.acao} ${css.claro}`} href={anexo.url}>
                  {rotuloAnexo} ({emKb(anexo.bytes)})
                </a>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
