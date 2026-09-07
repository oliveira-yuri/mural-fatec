import type { PublicacaoDoMural } from '@/lib/publicacoes/tipos'
import { NIVEL_PADRAO, type NivelTitulo } from './nivelTitulo'
import { LinhaAviso } from './LinhaAviso'
import { CardEvento } from './CardEvento'
import { LinhaPrazo } from './LinhaPrazo'
import { NotaComunidade } from './NotaComunidade'

/**
 * Qual componente representa cada tipo de publicação numa lista.
 *
 * Esta decisão existia escrita duas vezes — em `ListaDeSecao` (despachando
 * pelo tipo da *página*) e em `buscar/page.tsx` (despachando pelo tipo do
 * *item*) —, com semânticas sutilmente diferentes para a mesma regra de
 * produto. Um quinto tipo, ou um campo novo em todos, teria que ser lembrado
 * nos dois lugares. Aqui é um só, e o despacho é sempre pelo tipo do item:
 * na listagem por tipo os dois coincidem, e na busca só o do item faz
 * sentido.
 *
 * Fora daqui ficam as decisões que não são "qual componente": o container
 * (grade de dois por linha para eventos, lista corrida para o resto) segue
 * com a página, e a variante "destaque" da NotaComunidade segue com a home,
 * que é a única a usá-la.
 */
export function ItemDoMural({
  publicacao,
  agora,
  nivel = NIVEL_PADRAO,
}: {
  publicacao: PublicacaoDoMural
  agora: Date
  nivel?: NivelTitulo
}) {
  switch (publicacao.tipo) {
    case 'evento':
      return <CardEvento publicacao={publicacao} nivel={nivel} />
    case 'prazo':
      return <LinhaPrazo publicacao={publicacao} agora={agora} nivel={nivel} />
    case 'noticia':
      return <NotaComunidade publicacao={publicacao} variante="compacta" nivel={nivel} />
    default:
      return <LinhaAviso publicacao={publicacao} nivel={nivel} />
  }
}
