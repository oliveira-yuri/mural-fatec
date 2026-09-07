import type { Filtros } from '@/lib/busca/filtros'
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
              <option value="aviso">Avisos</option>
              <option value="evento">Eventos</option>
              <option value="prazo">Prazos</option>
              <option value="noticia">Comunidade</option>
            </select>
          </p>

          <p className={css.campo}>
            <label htmlFor="f-periodo">Período</label>
            <select id="f-periodo" name="periodo" defaultValue={filtros.periodo}>
              <option value="semana">Esta semana</option>
              <option value="trinta">Próximos 30 dias</option>
              <option value="qualquer">Qualquer data</option>
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
