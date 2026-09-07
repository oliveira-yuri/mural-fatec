import Link from 'next/link'
import css from './TituloSecao.module.css'

export function TituloSecao({
  titulo,
  verTodos,
}: {
  titulo: string
  verTodos?: { href: string; rotulo: string }
}) {
  return (
    <div className={css.cabeca}>
      <h2 className={css.titulo}>{titulo}</h2>
      {verTodos ? <Link href={verTodos.href}>{verTodos.rotulo}</Link> : null}
    </div>
  )
}
