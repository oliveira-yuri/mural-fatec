import type { PublicacaoDoMural, TipoPublicacao } from '@/lib/publicacoes/tipos'
import { LinhaAviso } from './LinhaAviso'
import { CardEvento } from './CardEvento'
import { LinhaPrazo } from './LinhaPrazo'
import { NotaComunidade } from './NotaComunidade'
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
  return (
    <>
      <h1>{titulo}</h1>
      <p className="narrow">{descricao}</p>

      {itens.length === 0 ? (
        <p className="narrow">Nada publicado nesta seção no momento.</p>
      ) : tipo === 'evento' ? (
        <div className={css.doisPorLinha}>
          {itens.map((i) => <CardEvento key={i.id} publicacao={i} />)}
        </div>
      ) : (
        <div className={css.lista}>
          {itens.map((i) =>
            tipo === 'aviso' ? <LinhaAviso key={i.id} publicacao={i} />
            : tipo === 'prazo' ? <LinhaPrazo key={i.id} publicacao={i} agora={agora} />
            : <NotaComunidade key={i.id} publicacao={i} variante="compacta" />,
          )}
        </div>
      )}
    </>
  )
}
