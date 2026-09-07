import { ListagemPorTipo } from '@/components/mural/ListagemPorTipo'

export const revalidate = 300
export const metadata = { title: 'Avisos e comunicados — Mural da Fatec Campinas' }

export default function Pagina() {
  return (
    <ListagemPorTipo
      tipo="aviso"
      titulo="Avisos e comunicados"
      descricao="Comunicados oficiais das unidades da faculdade, do mais recente ao mais antigo."
    />
  )
}
