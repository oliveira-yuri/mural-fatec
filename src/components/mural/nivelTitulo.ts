/**
 * Nível do `<h>` que cada item do mural emite.
 *
 * O mesmo componente de item aparece em dois contextos com profundidades
 * diferentes: na home ele vive dentro de uma seção que já tem `<h2>`
 * (TituloSecao), então o item é `<h3>`; nas páginas por tipo e na busca não
 * há seção intermediária — o `<h1>` é o título da própria página —, então o
 * item precisa ser `<h2>`. Fixar `<h3>` nos dois casos é o que fazia 5 das 8
 * rotas pularem de `h1` para `h3`, violação de `heading-order` (spec §12).
 */
export type NivelTitulo = 2 | 3

/** O caso mais comum: item aninhado numa seção com `<h2>`. */
export const NIVEL_PADRAO: NivelTitulo = 3
