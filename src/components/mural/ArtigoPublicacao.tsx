import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { estaVigente, estadoDoPrazo, rotuloContagem } from '@/lib/publicacoes/exibicao'
import {
  formatarDataCompleta,
  formatarDataExtenso,
  formatarHorario,
  paraAtributoDatetime,
} from '@/lib/formato/datas'
import { ROTULO_TIPO } from '@/lib/publicacoes/tipos'
import type { PublicacaoDoMural } from '@/lib/publicacoes/tipos'
import css from './ArtigoPublicacao.module.css'

/**
 * Peça pura da página da publicação: só JSX a partir de uma publicação já
 * buscada. Sem `async`, sem tocar em banco — por isso é a metade
 * renderizável em teste de unidade. `src/app/p/[slug]/page.tsx` cuida da
 * busca (sem filtro de validade) e do 404 quando o slug não existe, e
 * delega todo o desenho para aqui.
 */
export function ArtigoPublicacao({
  publicacao: p,
  agora,
}: {
  publicacao: PublicacaoDoMural
  agora: Date
}) {
  const data = p.publicadoEm ?? p.criadoEm
  const vigente = estaVigente(p, agora)

  return (
    <main id="conteudo" className={`pagina ${css.pagina}`}>
      <article>
        <p className={`narrow ${css.procedencia}`}>
          {ROTULO_TIPO[p.tipo]} — {p.setor.nome} —{' '}
          <time dateTime={paraAtributoDatetime(data)}>{formatarDataCompleta(data)}</time>
          {p.documentoNumero ? ` — Comunicado ${p.documentoNumero}` : null}
        </p>

        <h1 className={css.titulo}>{p.titulo}</h1>
        <p className={`narrow ${css.resumo}`}>{p.resumo}</p>

        {!vigente ? (
          <p className={css.arquivada}>
            Esta publicação saiu do mural em{' '}
            <time dateTime={paraAtributoDatetime(p.expiraEm)}>
              {formatarDataCompleta(p.expiraEm)}
            </time>
            . O texto segue disponível para consulta.
          </p>
        ) : null}

        {p.imagemUrl ? (
          <figure className={css.figura}>
            <img src={p.imagemUrl} alt={p.imagemAlt ?? ''} />
            {p.creditoFoto ? <figcaption className="narrow">Foto: {p.creditoFoto}</figcaption> : null}
          </figure>
        ) : null}

        {p.tipo === 'evento' && p.inicioEm ? (
          <dl className={`narrow ${css.fatos}`}>
            <dt>Quando</dt>
            <dd>
              <time dateTime={paraAtributoDatetime(p.inicioEm)}>{formatarDataExtenso(p.inicioEm)}</time>
              , {formatarHorario(p.inicioEm, p.fimEm)}
            </dd>
            {p.local ? (<><dt>Onde</dt><dd>{p.local}</dd></>) : null}
            {p.vagasRestantes !== null ? (<><dt>Vagas</dt><dd>{p.vagasRestantes} restantes</dd></>) : null}
          </dl>
        ) : null}

        {p.tipo === 'prazo' && p.prazoFinal ? (
          <dl className={`narrow ${css.fatos}`}>
            <dt>Data-limite</dt>
            <dd>
              <time dateTime={paraAtributoDatetime(p.prazoFinal)}>
                {formatarDataExtenso(p.prazoFinal)}
              </time>
            </dd>
            <dt>Situação</dt>
            <dd data-estado={estadoDoPrazo(p.prazoFinal, agora)}>
              {rotuloContagem(p.prazoFinal, agora)}
            </dd>
          </dl>
        ) : null}

        <div className={css.corpo}>
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{p.corpo}</ReactMarkdown>
        </div>

        {p.pessoasCitadas ? (
          <p className={`narrow ${css.pessoas}`}>{p.pessoasCitadas}</p>
        ) : null}

        {p.anexos && p.anexos.length > 0 ? (
          <section className={css.anexos}>
            <h2>Anexos</h2>
            <ul>
              {p.anexos.map((a) => (
                <li key={a.url} className="narrow">
                  <a href={a.url}>{a.nome}</a> ({Math.round(a.bytes / 1024)} KB)
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {p.cursos.length > 0 ? (
          <p className={`narrow ${css.cursos}`}>
            Vale para: {p.cursos.map((c) => c.nome).join(', ')}.
          </p>
        ) : null}
      </article>
    </main>
  )
}
