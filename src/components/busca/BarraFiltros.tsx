import { PERIODOS, ROTULO_PERIODO, type Filtros } from '@/lib/busca/filtros'
import { ROTULO_TIPO_PLURAL, TIPOS_PUBLICACAO } from '@/lib/publicacoes/tipos'
import css from './BarraFiltros.module.css'

export function BarraFiltros({
  filtros,
  cursos,
}: {
  filtros: Filtros
  cursos: { nome: string; sigla: string; slug: string }[]
}) {
  return (
    <form className={css.barra} action="/buscar" method="get" role="search">
      <div className="pagina">
        <div className={css.campos}>
          <p className={css.campo}>
            <label htmlFor="f-q">Buscar</label>
            <input id="f-q" name="q" type="search" defaultValue={filtros.q} className={css.termo} />
          </p>

          <p className={css.campo}>
            <label htmlFor="f-curso">Curso</label>
            <select id="f-curso" name="curso" defaultValue={filtros.curso ?? ''}>
              <option value="">Todos os cursos</option>
              {cursos.map((c) => (
                <option key={c.slug} value={c.slug}>{c.nome}</option>
              ))}
            </select>
          </p>

          <p className={css.campo}>
            <label htmlFor="f-tipo">Tipo</label>
            <select id="f-tipo" name="tipo" defaultValue={filtros.tipo ?? ''}>
              <option value="">Todos os tipos</option>
              {TIPOS_PUBLICACAO.map((t) => (
                <option key={t} value={t}>{ROTULO_TIPO_PLURAL[t]}</option>
              ))}
            </select>
          </p>

          <p className={css.campo}>
            <label htmlFor="f-periodo">Período</label>
            <select id="f-periodo" name="periodo" defaultValue={filtros.periodo}>
              {PERIODOS.map((p) => (
                <option key={p} value={p}>{ROTULO_PERIODO[p]}</option>
              ))}
            </select>
          </p>

          <p className={css.campo}>
            <label htmlFor="f-ordem">Ordenar por</label>
            <select id="f-ordem" name="ordem" defaultValue={filtros.ordem}>
              <option value="recentes">Mais recentes</option>
              <option value="prazo">Prazo mais próximo</option>
            </select>
          </p>

          <button className={css.enviar} type="submit">Filtrar</button>
        </div>
      </div>
    </form>
  )
}
