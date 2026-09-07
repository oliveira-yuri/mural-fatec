import type { publicacoes } from '@/lib/db/schema'

export type TipoPublicacao = 'aviso' | 'evento' | 'prazo' | 'noticia'

export type LinhaPublicacao = typeof publicacoes.$inferSelect

export type PublicacaoDoMural = LinhaPublicacao & {
  setor: { nome: string; slug: string }
  cursos: { nome: string; sigla: string; slug: string }[]
}

/** Os quatro tipos, na ordem em que aparecem em qualquer lista da interface. */
export const TIPOS_PUBLICACAO: TipoPublicacao[] = ['aviso', 'evento', 'prazo', 'noticia']

/** Rótulo de uma publicação só. */
export const ROTULO_TIPO: Record<TipoPublicacao, string> = {
  aviso: 'Aviso',
  evento: 'Evento',
  prazo: 'Prazo',
  noticia: 'Comunidade',
}

/**
 * Rótulo do conjunto: o que aparece no `<select>` de tipo e na ficha de
 * filtro ativo. Vive aqui, junto do rótulo singular, porque as duas listas
 * já existiam copiadas em `filtros.ts` e em `BarraFiltros.tsx` com as mesmas
 * strings — e um tipo novo teria que ser lembrado nos dois.
 */
export const ROTULO_TIPO_PLURAL: Record<TipoPublicacao, string> = {
  aviso: 'Avisos',
  evento: 'Eventos',
  prazo: 'Prazos',
  noticia: 'Comunidade',
}

export const CAMINHO_TIPO: Record<TipoPublicacao, string> = {
  aviso: '/avisos',
  evento: '/eventos',
  prazo: '/prazos',
  noticia: '/comunidade',
}
