import Link from 'next/link'
import css from './Navegacao.module.css'

const SECOES = [
  { rotulo: 'Tudo', href: '/' },
  { rotulo: 'Avisos', href: '/avisos' },
  { rotulo: 'Eventos', href: '/eventos' },
  { rotulo: 'Prazos', href: '/prazos' },
  { rotulo: 'Comunidade', href: '/comunidade' },
]

export function Navegacao({ ativo }: { ativo: string }) {
  return (
    <nav className={css.nav} aria-label="Seções do mural">
      <div className={`pagina ${css.faixa}`}>
        {SECOES.map((s) => {
          const atual = s.href === ativo
          return (
            <Link
              key={s.href}
              href={s.href}
              className={atual ? css.atual : undefined}
              aria-current={atual ? 'page' : undefined}
            >
              {s.rotulo}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
