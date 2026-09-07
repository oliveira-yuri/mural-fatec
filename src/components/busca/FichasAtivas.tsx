import Link from 'next/link'
import { descreverAtivos, type Filtros } from '@/lib/busca/filtros'
import css from './FichasAtivas.module.css'

export function FichasAtivas({
  filtros,
  nomesDeCurso,
}: {
  filtros: Filtros
  nomesDeCurso: Record<string, string>
}) {
  const fichas = descreverAtivos(filtros, nomesDeCurso)
  if (fichas.length === 0) return null

  return (
    <div className={css.faixa}>
      <span className={`narrow ${css.rotulo}`}>Filtros ativos:</span>
      {fichas.map((f) => (
        <Link key={f.chave} className={css.ficha} href={f.href} aria-label={`Remover filtro ${f.rotulo}`}>
          <span>{f.rotulo}</span>
          <span className={css.x} aria-hidden="true">✕</span>
        </Link>
      ))}
      <Link className={css.limpar} href="/buscar">Limpar todos os filtros</Link>
    </div>
  )
}
