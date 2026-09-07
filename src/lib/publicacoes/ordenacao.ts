import { diasAte } from '@/lib/publicacoes/exibicao'
import type { PublicacaoDoMural } from '@/lib/publicacoes/tipos'

export type ItemOrdenavel = {
  tipo: string
  destaque: boolean
  publicadoEm: Date
  prazoFinal?: Date | null
  urgencia?: string | null
}

const DIAS_PRAZO_APERTADO = 7
const DIAS_AVISO_QUENTE = 3

const FAIXA_DESTAQUE = 0
const FAIXA_PRAZO_APERTADO = 1
const FAIXA_AVISO_URGENTE = 2
const FAIXA_NORMAL = 3

function faixa(item: ItemOrdenavel, agora: Date): number {
  if (item.destaque) return FAIXA_DESTAQUE

  if (item.tipo === 'prazo' && item.prazoFinal) {
    const dias = diasAte(item.prazoFinal, agora)
    if (dias >= 0 && dias <= DIAS_PRAZO_APERTADO) return FAIXA_PRAZO_APERTADO
  }

  if (item.tipo === 'aviso' && item.urgencia === 'urgente') {
    const diasDesdePublicacao = -diasAte(item.publicadoEm, agora)
    if (diasDesdePublicacao <= DIAS_AVISO_QUENTE) return FAIXA_AVISO_URGENTE
  }

  return FAIXA_NORMAL
}

export function ordenarMural<T extends ItemOrdenavel>(itens: readonly T[], agora: Date): T[] {
  return [...itens].sort((a, b) => {
    const faixaA = faixa(a, agora)
    const faixaB = faixa(b, agora)
    if (faixaA !== faixaB) return faixaA - faixaB

    // Dentro da faixa de prazo apertado, vem primeiro quem termina antes.
    if (faixaA === FAIXA_PRAZO_APERTADO && a.prazoFinal && b.prazoFinal) {
      return a.prazoFinal.getTime() - b.prazoFinal.getTime()
    }

    return b.publicadoEm.getTime() - a.publicadoEm.getTime()
  })
}

/**
 * `publicadoEm` é opcional no schema (rascunhos não têm data de publicação),
 * então `PublicacaoDoMural.publicadoEm` é `Date | null` no tipo. Quem chama
 * isto já filtrou por `isNotNull(publicacoes.publicadoEm)` na consulta — o
 * Drizzle não propaga essa garantia da cláusula WHERE para o tipo da linha
 * devolvida, então esta função só declara, no tipo, o que a consulta já
 * garante em tempo de execução. `ordenarMural`, acima, depende de
 * `publicadoEm: Date` não nulo para desempatar por recência.
 */
export function paraOrdenacao(
  itens: PublicacaoDoMural[],
): (PublicacaoDoMural & { publicadoEm: Date })[] {
  return itens as (PublicacaoDoMural & { publicadoEm: Date })[]
}
