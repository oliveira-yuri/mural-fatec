import Link from 'next/link'
import css from './BarraServicos.module.css'

const SERVICOS = [
  { rotulo: 'Secretaria', href: '#' },
  { rotulo: 'SIGA', href: '#' },
  { rotulo: 'Biblioteca', href: '#' },
  { rotulo: 'Estágios', href: '#' },
  { rotulo: 'Centro Acadêmico', href: '#' },
]

export function BarraServicos() {
  return (
    <div className={css.barra}>
      <nav className={`pagina ${css.faixa}`} aria-label="Serviços da unidade">
        {SERVICOS.map((s) => (
          <a key={s.rotulo} href={s.href}>{s.rotulo}</a>
        ))}
        <a href="#" className={css.fim}>Acessibilidade</a>
        <Link href="/entrar">Entrar para publicar</Link>
      </nav>
    </div>
  )
}
