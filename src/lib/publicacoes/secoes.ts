import { escolherDestaque } from '@/lib/publicacoes/destaque'
import type { PublicacaoDoMural, TipoPublicacao } from '@/lib/publicacoes/tipos'

const DISTANTE = Number.MAX_SAFE_INTEGER

/** Chave de ordem de cada tipo, sempre crescente. */
const CHAVE: Record<TipoPublicacao, (p: PublicacaoDoMural) => number> = {
  prazo: (p) => p.prazoFinal?.getTime() ?? DISTANTE,
  evento: (p) => p.inicioEm?.getTime() ?? DISTANTE,
  aviso: (p) => -(p.publicadoEm?.getTime() ?? 0),
  noticia: (p) => -(p.publicadoEm?.getTime() ?? 0),
}

/**
 * Ordem dentro de uma seção de um tipo só — diferente da ordem do mural.
 * Prazo pela data-limite, evento pela data em que acontece, aviso e notícia
 * do mais recente ao mais antigo. Item sem a data do seu tipo vai para o fim,
 * em vez de embaralhar os que têm.
 */
export function ordenarSecao(
  itens: readonly PublicacaoDoMural[],
  tipo: TipoPublicacao,
): PublicacaoDoMural[] {
  const chave = CHAVE[tipo]
  return [...itens].sort((a, b) => chave(a) - chave(b))
}

export type SecoesDaHome = {
  destaque: PublicacaoDoMural | null
  avisos: PublicacaoDoMural[]
  eventos: PublicacaoDoMural[]
  prazos: PublicacaoDoMural[]
  noticias: PublicacaoDoMural[]
}

/** O que a home mostra, a partir da lista já vigente e ordenada. */
export function montarSecoesDaHome(itens: PublicacaoDoMural[]): SecoesDaHome {
  const destaque = escolherDestaque(itens)
  const restantes = itens.filter((i) => i.id !== destaque?.id)
  const doTipo = (t: TipoPublicacao) =>
    ordenarSecao(restantes.filter((i) => i.tipo === t), t)

  return {
    destaque,
    avisos: doTipo('aviso').slice(0, 4),
    eventos: doTipo('evento').slice(0, 2),
    prazos: doTipo('prazo').slice(0, 4),
    noticias: doTipo('noticia'),
  }
}
