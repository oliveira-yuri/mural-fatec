import { db } from '@/lib/db/client'
import { listarMural, contarVigentes } from '@/lib/publicacoes/consultas'
import { montarSecoesDaHome } from '@/lib/publicacoes/secoes'
import { Navegacao } from '@/components/layout/Navegacao'
import { Hero } from '@/components/mural/Hero'
import { TituloSecao } from '@/components/mural/TituloSecao'
import { LinhaAviso } from '@/components/mural/LinhaAviso'
import { CardEvento } from '@/components/mural/CardEvento'
import { LinhaPrazo } from '@/components/mural/LinhaPrazo'
import { NotaComunidade } from '@/components/mural/NotaComunidade'
import css from './pagina.module.css'

export const revalidate = 300

export default async function Home() {
  const agora = new Date()
  const [itens, total] = await Promise.all([
    listarMural(db, agora),
    contarVigentes(db, agora),
  ])

  const { destaque, avisos, eventos, prazos, noticias } = montarSecoesDaHome(itens)

  return (
    <>
      <Navegacao ativo="/" />
      {destaque ? <Hero publicacao={destaque} /> : null}

      <main id="conteudo">
        <p className={`narrow pagina ${css.contagem}`}>
          <strong>{total}</strong> {total === 1 ? 'publicação' : 'publicações'} no mural agora
        </p>

        {avisos.length > 0 ? (
          <section className={`pagina ${css.secao}`}>
            <TituloSecao titulo="Avisos e comunicados" verTodos={{ href: '/avisos', rotulo: 'Ver todos os avisos' }} />
            <div className={css.lista}>
              {avisos.map((a) => <LinhaAviso key={a.id} publicacao={a} />)}
            </div>
          </section>
        ) : null}

        {eventos.length > 0 ? (
          <section className={css.lavada}>
            <div className="pagina">
              <TituloSecao titulo="Acontece no campus" verTodos={{ href: '/eventos', rotulo: 'Ver todos os eventos' }} />
              <div className={css.doisPorLinha}>
                {eventos.map((e) => <CardEvento key={e.id} publicacao={e} />)}
              </div>
            </div>
          </section>
        ) : null}

        {prazos.length > 0 ? (
          <section className={`pagina ${css.secao}`}>
            <TituloSecao titulo="Prazos abertos" verTodos={{ href: '/prazos', rotulo: 'Ver todos os prazos' }} />
            <div className={css.lista}>
              {prazos.map((p) => <LinhaPrazo key={p.id} publicacao={p} agora={agora} />)}
            </div>
          </section>
        ) : null}

        {noticias.length > 0 ? (
          <section className={css.lavada}>
            <div className="pagina">
              <TituloSecao titulo="Comunidade acadêmica" verTodos={{ href: '/comunidade', rotulo: 'Ver mais notícias' }} />
              <div className={css.comunidade}>
                <NotaComunidade publicacao={noticias[0]} variante="destaque" />
                <div>
                  {noticias.slice(1, 5).map((n) => (
                    <NotaComunidade key={n.id} publicacao={n} variante="compacta" />
                  ))}
                </div>
              </div>
            </div>
          </section>
        ) : null}
      </main>
    </>
  )
}
