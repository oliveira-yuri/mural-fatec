import { notFound } from 'next/navigation'
import { db } from '@/lib/db/client'
import { buscarPorSlug } from '@/lib/publicacoes/consultas'
import { ArtigoPublicacao } from '@/components/mural/ArtigoPublicacao'

export const revalidate = 300

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const p = await buscarPorSlug(db, slug)
  if (!p) return { title: 'Publicação não encontrada — Mural da Fatec Campinas' }
  return { title: `${p.titulo} — Mural da Fatec Campinas`, description: p.resumo }
}

export default async function Pagina({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const p = await buscarPorSlug(db, slug)
  if (!p) notFound()

  return <ArtigoPublicacao publicacao={p} agora={new Date()} />
}
