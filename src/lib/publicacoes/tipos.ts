import type { publicacoes } from '@/lib/db/schema'

export type TipoPublicacao = 'aviso' | 'evento' | 'prazo' | 'noticia'

export type LinhaPublicacao = typeof publicacoes.$inferSelect

export type PublicacaoDoMural = LinhaPublicacao & {
  setor: { nome: string; slug: string }
  cursos: { nome: string; sigla: string; slug: string }[]
}

export const ROTULO_TIPO: Record<TipoPublicacao, string> = {
  aviso: 'Aviso',
  evento: 'Evento',
  prazo: 'Prazo',
  noticia: 'Comunidade',
}

export const CAMINHO_TIPO: Record<TipoPublicacao, string> = {
  aviso: '/avisos',
  evento: '/eventos',
  prazo: '/prazos',
  noticia: '/comunidade',
}
