import type { PublicacaoDoMural } from '@/lib/publicacoes/tipos'

/**
 * Argumento `with` para `db.query.publicacoes.findFirst`/`findMany` trazer a
 * relação `setor` (um-para-um) e `cursos` (a tabela de junção
 * `publicacoesCursos`, cada uma trazendo sua relação `curso`), com só as
 * colunas que o mural e a busca exibem.
 *
 * Compartilhado entre `src/lib/publicacoes/consultas.ts` e
 * `src/lib/busca/consulta.ts` para que as duas consultas concordem sobre o
 * formato da linha — é o mesmo formato que `LinhaComRelacoes`, abaixo,
 * descreve.
 */
export const COM_RELACOES = {
  setor: { columns: { nome: true, slug: true } },
  cursos: { with: { curso: { columns: { nome: true, sigla: true, slug: true } } } },
} as const

/**
 * Formato de linha que `db.query.publicacoes.findFirst`/`findMany` devolve
 * quando consultados com `COM_RELACOES`, acima.
 *
 * O Drizzle infere esse formato a partir de `RelationalQueryBuilder`
 * genérico sobre o schema completo, o que o deixa verboso demais para escrever
 * à mão sem repetir todo o schema aqui. Descrevemos só o formato que
 * `COM_RELACOES` realmente produz — setor e cursos, com as colunas
 * selecionadas — e usamos isso como o tipo de entrada de `achatar`, em vez de
 * importar o tipo inferido do Drizzle.
 */
export type LinhaComRelacoes = Omit<PublicacaoDoMural, 'setor' | 'cursos'> & {
  setor: { nome: string; slug: string }
  cursos: { curso: { nome: string; sigla: string; slug: string } }[]
}

/** Achata `cursos: { curso }[]` em `cursos: []`, no formato de `PublicacaoDoMural`. */
export function achatar(linha: LinhaComRelacoes): PublicacaoDoMural {
  const { cursos, ...resto } = linha
  return { ...resto, cursos: cursos.map((c) => c.curso) }
}
