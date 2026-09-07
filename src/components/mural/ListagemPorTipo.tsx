import { db } from '@/lib/db/client'
import { listarPorTipo } from '@/lib/publicacoes/consultas'
import { ordenarSecao } from '@/lib/publicacoes/secoes'
import type { TipoPublicacao } from '@/lib/publicacoes/tipos'
import { CAMINHO_TIPO } from '@/lib/publicacoes/tipos'
import { Navegacao } from '@/components/layout/Navegacao'
import { LinhaAviso } from './LinhaAviso'
import { CardEvento } from './CardEvento'
import { LinhaPrazo } from './LinhaPrazo'
import { NotaComunidade } from './NotaComunidade'
import css from '@/app/pagina.module.css'

export async function ListagemPorTipo({
  tipo,
  titulo,
  descricao,
}: {
  tipo: TipoPublicacao
  titulo: string
  descricao: string
}) {
  const agora = new Date()
  // A mesma ordem das seções da home: prazo pela data-limite, evento pela
  // data em que acontece. A página de prazos promete "do que vence antes ao
  // que vence depois" no próprio texto, e precisa cumprir.
  const itens = ordenarSecao(await listarPorTipo(db, tipo, agora), tipo)

  return (
    <>
      <Navegacao ativo={CAMINHO_TIPO[tipo]} />
      <main id="conteudo" className={`pagina ${css.secao}`}>
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
      </main>
    </>
  )
}
