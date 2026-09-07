import type { PublicacaoDoMural } from '@/lib/publicacoes/tipos'

/**
 * O que ocupa o topo da home. A lista já chega ordenada por
 * ordenarMural, então o primeiro item é o fallback natural.
 */
export function escolherDestaque(itens: PublicacaoDoMural[]): PublicacaoDoMural | null {
  if (itens.length === 0) return null

  const fixado = itens.find((i) => i.destaque && i.tipo === 'aviso')
  if (fixado) return fixado

  const urgente = itens.find((i) => i.tipo === 'aviso' && i.urgencia === 'urgente')
  if (urgente) return urgente

  return itens[0]
}
