import { ListagemPorTipo } from '@/components/mural/ListagemPorTipo'

export const revalidate = 300
export const metadata = { title: 'Prazos acadêmicos — Mural da Fatec Campinas' }

export default function Pagina() {
  return (
    <ListagemPorTipo
      tipo="prazo"
      titulo="Prazos abertos"
      descricao="Matrícula, trancamento, inscrições, bolsas e entregas, do que vence antes ao que vence depois."
    />
  )
}
