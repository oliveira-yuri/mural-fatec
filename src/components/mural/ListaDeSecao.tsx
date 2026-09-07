import type { PublicacaoDoMural, TipoPublicacao } from '@/lib/publicacoes/tipos'
import { ItemDoMural } from './ItemDoMural'
import css from '@/app/pagina.module.css'

/**
 * Peça pura da listagem por tipo: só JSX a partir de itens já buscados e
 * ordenados. Sem `async`, sem tocar em banco — por isso é a metade
 * renderizável em teste de unidade. `ListagemPorTipo` cuida da busca e
 * delega o desenho para aqui, mesma divisão que a composição da home fez
 * na Tarefa 11.
 */
export function ListaDeSecao({
  itens,
  tipo,
  titulo,
  descricao,
  agora,
}: {
  itens: PublicacaoDoMural[]
  tipo: TipoPublicacao
  titulo: string
  descricao: string
  agora: Date
}) {
  // Aqui o `<h1>` é o título da página e não há seção intermediária, então
  // os itens entram em `<h2>`: sem isto a página pulava de h1 para h3.
  const itensDaLista = itens.map((i) => (
    <ItemDoMural key={i.id} publicacao={i} agora={agora} nivel={2} />
  ))

  return (
    <>
      <h1>{titulo}</h1>
      <p className="narrow">{descricao}</p>

      {itens.length === 0 ? (
        <p className="narrow">Nada publicado nesta seção no momento.</p>
      ) : tipo === 'evento' ? (
        <div className={css.doisPorLinha}>{itensDaLista}</div>
      ) : (
        <div className={css.lista}>{itensDaLista}</div>
      )}
    </>
  )
}
