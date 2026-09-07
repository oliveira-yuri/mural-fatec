import { ListagemPorTipo } from '@/components/mural/ListagemPorTipo'

export const revalidate = 300
export const metadata = { title: 'Comunidade acadêmica — Mural da Fatec Campinas' }

export default function Pagina() {
  return (
    <ListagemPorTipo
      tipo="noticia"
      titulo="Comunidade acadêmica"
      descricao="Conquistas, publicações e resultados de alunos e professores da unidade."
    />
  )
}
