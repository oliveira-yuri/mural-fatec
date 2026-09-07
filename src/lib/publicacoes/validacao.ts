import { z } from 'zod'

const anexo = z.object({
  url: z.string().url(),
  nome: z.string().min(1),
  bytes: z.number().int().positive(),
  mime: z.string().min(1),
})

const link = z.object({
  url: z.string().url(),
  rotulo: z.string().min(1),
})

function camposComuns(agora: Date) {
  return {
    titulo: z.string().trim().min(1, 'Escreva um título.').max(140, 'O título tem no máximo 140 caracteres.'),
    resumo: z.string().trim().min(1, 'Escreva um resumo.').max(220, 'O resumo tem no máximo 220 caracteres.'),
    corpo: z.string().trim().min(1, 'Escreva o texto da publicação.'),
    setorId: z.string().uuid(),
    cursoIds: z.array(z.string().uuid()).default([]),
    imagemUrl: z.string().url().nullish().default(null),
    imagemAlt: z.string().nullish().default(null),
    creditoFoto: z.string().nullish().default(null),
    anexos: z.array(anexo).default([]),
    linkExterno: link.nullish().default(null),
    destaque: z.boolean().default(false),
    expiraEm: z.coerce.date().refine(
      (d) => d.getTime() > agora.getTime(),
      'A data de saída do mural precisa estar no futuro.',
    ),
  }
}

export function criarSchemaPublicacao(agora: Date) {
  const comum = camposComuns(agora)

  const avisoSchema = z.object({
    ...comum,
    tipo: z.literal('aviso'),
    urgencia: z.enum(['informativo', 'importante', 'urgente']).default('informativo'),
    documentoNumero: z.string().nullish().default(null),
  })

  // Nota: o .refine de "fimEm >= inicioEm" NÃO fica aqui. Um .refine() sobre o
  // z.object() transforma o schema em efeito (ZodEffects), e o
  // z.discriminatedUnion exige que cada membro seja um objeto puro. A checagem
  // foi movida para o superRefine da união, abaixo, testando valor.tipo === 'evento'.
  const eventoSchema = z.object({
    ...comum,
    tipo: z.literal('evento'),
    inicioEm: z.coerce.date(),
    fimEm: z.coerce.date().nullish().default(null),
    local: z.string().trim().min(1, 'Informe onde o evento acontece.'),
    modalidade: z.enum(['presencial', 'online', 'hibrido']).default('presencial'),
    linkInscricao: z.string().url().nullish().default(null),
    vagasRestantes: z.number().int().nonnegative().nullish().default(null),
  })

  const prazoSchema = z.object({
    ...comum,
    tipo: z.literal('prazo'),
    prazoFinal: z.coerce.date(),
    abreEm: z.coerce.date().nullish().default(null),
    linkAcao: link.nullish().default(null),
  })

  const noticiaSchema = z.object({
    ...comum,
    tipo: z.literal('noticia'),
    pessoasCitadas: z.string().nullish().default(null),
  })

  return z
    .discriminatedUnion('tipo', [avisoSchema, eventoSchema, prazoSchema, noticiaSchema])
    .superRefine((valor, ctx) => {
      if (valor.imagemUrl && !valor.imagemAlt?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['imagemAlt'],
          message:
            'Descreva a imagem para quem usa leitor de tela. Sem isso a publicação não pode ir ao ar.',
        })
      }

      if (valor.tipo === 'evento' && valor.fimEm && valor.fimEm.getTime() < valor.inicioEm.getTime()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['fimEm'],
          message: 'O evento não pode terminar antes de começar.',
        })
      }
    })
}

export type EntradaPublicacao = z.infer<ReturnType<typeof criarSchemaPublicacao>>
