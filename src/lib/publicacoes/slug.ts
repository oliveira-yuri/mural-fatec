/**
 * Remove acentos preservando a letra. A Tarefa 14 reusa isto para dobrar o
 * termo de busca do mesmo jeito que a coluna busca_tsv dobra o conteúdo — se
 * os dois lados não dobrarem igual, a busca não casa.
 */
export function semAcento(texto: string): string {
  return texto.normalize('NFD').replace(/[̀-ͯ]/g, '')
}

export function gerarSlug(titulo: string): string {
  return semAcento(titulo)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
