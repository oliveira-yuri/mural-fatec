import css from './Rodape.module.css'

const COLUNAS = [
  {
    titulo: 'O mural',
    links: [
      { rotulo: 'Avisos e comunicados', href: '/avisos' },
      { rotulo: 'Eventos do campus', href: '/eventos' },
      { rotulo: 'Prazos acadêmicos', href: '/prazos' },
      { rotulo: 'Comunidade acadêmica', href: '/comunidade' },
    ],
  },
  {
    titulo: 'Por curso',
    links: [
      { rotulo: 'Análise e Desenvolvimento de Sistemas', href: '/buscar?curso=analise-e-desenvolvimento-de-sistemas' },
      { rotulo: 'Gestão Empresarial', href: '/buscar?curso=gestao-empresarial' },
      { rotulo: 'Segurança da Informação', href: '/buscar?curso=seguranca-da-informacao' },
    ],
  },
  {
    titulo: 'Serviços',
    links: [
      { rotulo: 'SIGA', href: '#' },
      { rotulo: 'Biblioteca', href: '#' },
      { rotulo: 'Estágios', href: '#' },
      { rotulo: 'Centro Acadêmico', href: '#' },
    ],
  },
  {
    titulo: 'Publicar no mural',
    links: [
      { rotulo: 'Entrar', href: '/entrar' },
      { rotulo: 'Quem pode publicar', href: '#' },
      { rotulo: 'Enviar uma pauta', href: '#' },
    ],
  },
]

export function Rodape() {
  return (
    <footer className={css.pe}>
      <div className="pagina">
        <div className={css.colunas}>
          {COLUNAS.map((coluna) => (
            <div key={coluna.titulo}>
              <h2 className={css.titulo}>{coluna.titulo}</h2>
              <ul>
                {coluna.links.map((l) => (
                  <li key={l.rotulo} className="narrow">
                    <a href={l.href}>{l.rotulo}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p className={`narrow ${css.fim}`}>
          Fatec Campinas — Faculdade de Tecnologia do Estado de São Paulo, Centro Paula Souza.
          <br />
          Este mural reúne comunicados oficiais publicados pelas unidades da faculdade.
        </p>
      </div>
    </footer>
  )
}
