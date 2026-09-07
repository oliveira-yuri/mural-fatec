import { obterDb } from '@/lib/db/client'
import { buscar, sugerirSaidas, listarCursos } from '@/lib/busca/consulta'
import { lerFiltros } from '@/lib/busca/filtros'
import { Navegacao } from '@/components/layout/Navegacao'
import { BarraFiltros } from '@/components/busca/BarraFiltros'
import { FichasAtivas } from '@/components/busca/FichasAtivas'
import { EstadoVazio } from '@/components/busca/EstadoVazio'
import { LinhaAviso } from '@/components/mural/LinhaAviso'
import { CardEvento } from '@/components/mural/CardEvento'
import { LinhaPrazo } from '@/components/mural/LinhaPrazo'
import { NotaComunidade } from '@/components/mural/NotaComunidade'
import css from '@/app/pagina.module.css'
import cssBusca from './pagina.module.css'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Buscar no mural — Mural da Fatec Campinas' }

export default async function Buscar({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const db = await obterDb()
  const filtros = lerFiltros(await searchParams)
  const agora = new Date()

  const [cursos, resultado] = await Promise.all([listarCursos(db), buscar(db, filtros, agora)])
  const nomesDeCurso = Object.fromEntries(cursos.map((c) => [c.slug, c.nome]))
  const saidas = resultado.total === 0 ? await sugerirSaidas(db, filtros, agora) : null

  return (
    <>
      <Navegacao ativo="/buscar" />
      <BarraFiltros filtros={filtros} cursos={cursos} />

      <main id="conteudo" className={`pagina ${css.secao}`}>
        <FichasAtivas filtros={filtros} nomesDeCurso={nomesDeCurso} />

        <h1 className={`narrow ${cssBusca.titulo}`}>
          <strong>
            {resultado.total} {resultado.total === 1 ? 'publicação' : 'publicações'}
          </strong>
          {filtros.q ? ` para “${filtros.q}”` : ' no mural'}
        </h1>

        {resultado.total === 0 && saidas ? (
          <EstadoVazio filtros={filtros} nomesDeCurso={nomesDeCurso} saidas={saidas} />
        ) : (
          <div className={css.lista}>
            {resultado.itens.map((i) =>
              i.tipo === 'evento' ? <CardEvento key={i.id} publicacao={i} />
              : i.tipo === 'prazo' ? <LinhaPrazo key={i.id} publicacao={i} agora={agora} />
              : i.tipo === 'noticia' ? <NotaComunidade key={i.id} publicacao={i} variante="compacta" />
              : <LinhaAviso key={i.id} publicacao={i} />,
            )}
          </div>
        )}
      </main>
    </>
  )
}
