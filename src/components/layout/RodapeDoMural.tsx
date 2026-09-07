import { obterDb } from '@/lib/db/client'
import { listarCursos } from '@/lib/busca/consulta'
import { Rodape } from './Rodape'

/**
 * Metade que busca do rodapé — mesma divisão de `ListagemPorTipo`/
 * `ListaDeSecao`: a peça assíncrona pega os dados, a peça pura desenha e é
 * a que os testes de unidade renderizam.
 */
export async function RodapeDoMural() {
  const db = await obterDb()
  const cursos = await listarCursos(db)
  return <Rodape cursos={cursos} />
}
