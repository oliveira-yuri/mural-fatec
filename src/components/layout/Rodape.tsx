import Link from 'next/link'
import { comQuery, FILTROS_PADRAO } from '@/lib/busca/filtros'
import css from './Rodape.module.css'

type Coluna = { titulo: string; links: { rotulo: string; href: string }[] }

const DO_MURAL: Coluna = {
  titulo: 'O mural',
  links: [
    { rotulo: 'Avisos e comunicados', href: '/avisos' },
    { rotulo: 'Eventos do campus', href: '/eventos' },
    { rotulo: 'Prazos acadêmicos', href: '/prazos' },
    { rotulo: 'Comunidade acadêmica', href: '/comunidade' },
  ],
}

const SERVICOS: Coluna = {
  titulo: 'Serviços',
  links: [
    { rotulo: 'SIGA', href: '#' },
    { rotulo: 'Biblioteca', href: '#' },
    { rotulo: 'Estágios', href: '#' },
    { rotulo: 'Centro Acadêmico', href: '#' },
  ],
}

const PUBLICAR: Coluna = {
  titulo: 'Publicar no mural',
  links: [
    { rotulo: 'Entrar', href: '/entrar' },
    { rotulo: 'Quem pode publicar', href: '#' },
    { rotulo: 'Enviar uma pauta', href: '#' },
  ],
}

/**
 * Peça pura do rodapé: recebe os cursos já buscados (a metade que busca é
 * `RodapeDoMural`). Os cursos vêm do banco, como já vêm no `<select>` da
 * barra de filtros — antes eram três slugs escritos à mão aqui, derivados do
 * seed. A §16.1 da spec registra que a lista de cursos ainda não foi
 * confirmada com a unidade e vai mudar; no dia da mudança, slugs à mão
 * viravam links mortos, cada um levando a uma busca que se diz filtrada por
 * um curso que não existe.
 */
export function Rodape({ cursos }: { cursos: { nome: string; slug: string }[] }) {
  const porCurso: Coluna = {
    titulo: 'Por curso',
    links: cursos.map((c) => ({
      rotulo: c.nome,
      href: comQuery({ ...FILTROS_PADRAO, curso: c.slug }),
    })),
  }

  const colunas = [DO_MURAL, ...(porCurso.links.length > 0 ? [porCurso] : []), SERVICOS, PUBLICAR]

  return (
    <footer className={css.pe}>
      <div className="pagina">
        <div className={css.colunas}>
          {colunas.map((coluna) => (
            <div key={coluna.titulo}>
              <h2 className={css.titulo}>{coluna.titulo}</h2>
              <ul>
                {coluna.links.map((l) => (
                  <li key={l.rotulo} className="narrow">
                    {l.href === '#' ? (
                      <a href={l.href}>{l.rotulo}</a>
                    ) : (
                      <Link href={l.href}>{l.rotulo}</Link>
                    )}
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
