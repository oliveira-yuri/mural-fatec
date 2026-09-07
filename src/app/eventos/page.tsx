import { ListagemPorTipo } from '@/components/mural/ListagemPorTipo'

export const revalidate = 300
export const metadata = { title: 'Eventos do campus — Mural da Fatec Campinas' }

export default function Pagina() {
  return (
    <ListagemPorTipo
      tipo="evento"
      titulo="Acontece no campus"
      descricao="Palestras, semanas acadêmicas, workshops e feiras da unidade."
    />
  )
}
