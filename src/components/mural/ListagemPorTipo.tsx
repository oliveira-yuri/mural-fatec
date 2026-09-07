import { obterDb } from '@/lib/db/client'
import { listarPorTipo } from '@/lib/publicacoes/consultas'
import { ordenarSecao } from '@/lib/publicacoes/secoes'
import type { TipoPublicacao } from '@/lib/publicacoes/tipos'
import { CAMINHO_TIPO } from '@/lib/publicacoes/tipos'
import { Navegacao } from '@/components/layout/Navegacao'
import { ListaDeSecao } from './ListaDeSecao'
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
  const db = await obterDb()
  const agora = new Date()
  // A mesma ordem das seções da home: prazo pela data-limite, evento pela
  // data em que acontece. A página de prazos promete "do que vence antes ao
  // que vence depois" no próprio texto, e precisa cumprir.
  const itens = ordenarSecao(await listarPorTipo(db, tipo, agora), tipo)

  return (
    <>
      <Navegacao ativo={CAMINHO_TIPO[tipo]} />
      <main id="conteudo" className={`pagina ${css.secao}`}>
        <ListaDeSecao itens={itens} tipo={tipo} titulo={titulo} descricao={descricao} agora={agora} />
      </main>
    </>
  )
}
