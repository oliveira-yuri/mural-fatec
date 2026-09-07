import { and, count, eq, gt, inArray, isNotNull } from 'drizzle-orm'
import type { Db } from '@/lib/db/client'
import { publicacoes } from '@/lib/db/schema'
import { achatar, COM_RELACOES } from '@/lib/publicacoes/achatar'
import { ordenarMural, paraOrdenacao } from '@/lib/publicacoes/ordenacao'
import type { PublicacaoDoMural, TipoPublicacao } from '@/lib/publicacoes/tipos'

/**
 * Condição única de "está no mural agora". Usada por toda listagem — inclusive
 * pela busca (`src/lib/busca/consulta.ts`), para que as duas nunca discordem
 * sobre o que está publicado.
 *
 * `publicadoEm` entra na condição porque a ordenação depende dele e a coluna
 * é nulável. Uma linha publicada sem data de publicação é dado malformado:
 * some da listagem em silêncio, em vez de derrubar a home com um erro de
 * leitura de nulo. A garantia de escrita virá do painel, no Plano 2.
 */
export function vigente(agora: Date) {
  return and(
    eq(publicacoes.status, 'publicado'),
    isNotNull(publicacoes.publicadoEm),
    gt(publicacoes.expiraEm, agora),
  )
}

export async function listarMural(
  db: Db,
  agora: Date,
  limite?: number,
): Promise<PublicacaoDoMural[]> {
  const linhas = await db.query.publicacoes.findMany({
    where: vigente(agora),
    with: COM_RELACOES,
  })
  const ordenadas = ordenarMural(paraOrdenacao(linhas.map(achatar)), agora)
  // `limite === 0` precisa devolver lista vazia, não a lista inteira.
  // Um teste ternário sobre o número trata 0 como ausência de limite.
  return limite === undefined ? ordenadas : ordenadas.slice(0, limite)
}

export async function listarPorTipo(
  db: Db,
  tipo: TipoPublicacao,
  agora: Date,
): Promise<PublicacaoDoMural[]> {
  const linhas = await db.query.publicacoes.findMany({
    where: and(vigente(agora), eq(publicacoes.tipo, tipo)),
    with: COM_RELACOES,
  })
  return ordenarMural(paraOrdenacao(linhas.map(achatar)), agora)
}

/** Os únicos status que o público pode ler pela URL. */
const STATUS_PUBLICO = ['publicado', 'arquivado'] as const

/**
 * Busca pela URL da publicação. Sem filtro de **validade**, de propósito; com
 * filtro de **status**, obrigatoriamente. São duas coisas diferentes, e a
 * distinção é fácil de desfazer sem querer:
 *
 * - Validade (`expiraEm`) fica FORA da condição de propósito: uma URL citada
 *   num edital não pode virar 404 no dia em que a peça sai do mural. A página
 *   avisa que saiu; o texto continua legível. Não acrescente `gt(expiraEm,
 *   agora)` aqui — isso quebraria a regra central do produto.
 * - Status fica DENTRO da condição, obrigatoriamente: `rascunho` e
 *   `em_revisao` são peças que ainda não foram aprovadas, e o slug vem do
 *   título (`slug.ts`), portanto é adivinhável. Servi-las por aqui esvaziaria
 *   a fila de aprovação da §8 da spec e ainda faria a página dizer "saiu do
 *   mural em [data futura]" sobre algo que nunca esteve no mural.
 */
export async function buscarPorSlug(db: Db, slug: string): Promise<PublicacaoDoMural | null> {
  const linha = await db.query.publicacoes.findFirst({
    where: and(eq(publicacoes.slug, slug), inArray(publicacoes.status, [...STATUS_PUBLICO])),
    with: COM_RELACOES,
  })
  return linha ? achatar(linha) : null
}

export async function contarVigentes(db: Db, agora: Date): Promise<number> {
  const [linha] = await db.select({ total: count() }).from(publicacoes).where(vigente(agora))
  return linha.total
}
