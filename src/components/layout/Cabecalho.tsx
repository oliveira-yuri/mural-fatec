import css from './Cabecalho.module.css'

export function Cabecalho() {
  return (
    <div className={css.topo}>
      <div className={`pagina ${css.faixa}`}>
        <a className={css.lockup} href="/">
          <span className={css.marca}>
            <span className={css.fatec}>Fatec</span>
            <span className={css.unidade}>Campinas</span>
          </span>
          <span className={css.divisor} aria-hidden="true" />
          <span className={css.produto}>
            <span className={css.nome}>Mural</span>
            <span className={css.desc}>Avisos, eventos e prazos da unidade</span>
          </span>
        </a>

        <form className={css.busca} action="/buscar" method="get" role="search">
          <label className={css.rotuloOculto} htmlFor="busca-topo">Buscar no mural</label>
          <input
            id="busca-topo"
            name="q"
            type="search"
            placeholder="Buscar avisos, eventos e prazos"
          />
          <button type="submit">Buscar</button>
        </form>
      </div>
    </div>
  )
}
