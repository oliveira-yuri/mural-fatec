import type { PublicacaoDoMural } from '@/lib/publicacoes/tipos'

/**
 * Formato de linha que `db.query.publicacoes.findFirst`/`findMany` devolve
 * quando consultados com a relação `setor` (um-para-um) e `cursos` (a tabela
 * de junção `publicacoesCursos`, cada uma trazendo sua relação `curso`).
 *
 * O Drizzle infere esse formato a partir de `RelationalQueryBuilder`
 * genérico sobre o schema completo, o que o deixa verboso demais para escrever
 * à mão sem repetir todo o schema aqui. Descrevemos só o formato que
 * `COM_RELACOES` (em `consultas.ts`) realmente produz — setor e cursos, com
 * as colunas selecionadas — e usamos isso como o tipo de entrada de
 * `achatar`, em vez de importar o tipo inferido do Drizzle.
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
