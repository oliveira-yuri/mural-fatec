import {
  boolean, customType, index, integer, jsonb, pgEnum, pgTable,
  primaryKey, text, timestamp, uniqueIndex, uuid,
} from 'drizzle-orm/pg-core'

const tsvector = customType<{ data: string }>({
  dataType: () => 'tsvector',
})

export const tipoPublicacao = pgEnum('tipo_publicacao', ['aviso', 'evento', 'prazo', 'noticia'])
export const statusPublicacao = pgEnum('status_publicacao', ['rascunho', 'em_revisao', 'publicado', 'arquivado'])
export const urgenciaAviso = pgEnum('urgencia_aviso', ['informativo', 'importante', 'urgente'])
export const modalidadeEvento = pgEnum('modalidade_evento', ['presencial', 'online', 'hibrido'])
export const papelUsuario = pgEnum('papel_usuario', ['colaborador', 'editor', 'administrador'])

export const setores = pgTable('setores', {
  id: uuid('id').primaryKey().defaultRandom(),
  nome: text('nome').notNull(),
  slug: text('slug').notNull().unique(),
  ativo: boolean('ativo').notNull().default(true),
})

export const cursos = pgTable('cursos', {
  id: uuid('id').primaryKey().defaultRandom(),
  nome: text('nome').notNull(),
  sigla: text('sigla').notNull(),
  slug: text('slug').notNull().unique(),
  ativo: boolean('ativo').notNull().default(true),
})

export const usuarios = pgTable('usuarios', {
  id: uuid('id').primaryKey().defaultRandom(),
  nome: text('nome').notNull(),
  email: text('email').notNull().unique(),
  senhaHash: text('senha_hash').notNull(),
  papel: papelUsuario('papel').notNull().default('colaborador'),
  setorId: uuid('setor_id').notNull().references(() => setores.id),
  ativo: boolean('ativo').notNull().default(true),
  criadoEm: timestamp('criado_em', { withTimezone: true }).notNull().defaultNow(),
})

export const publicacoes = pgTable(
  'publicacoes',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    slug: text('slug').notNull(),
    tipo: tipoPublicacao('tipo').notNull(),

    titulo: text('titulo').notNull(),
    resumo: text('resumo').notNull(),
    corpo: text('corpo').notNull(),

    setorId: uuid('setor_id').notNull().references(() => setores.id),
    autorId: uuid('autor_id').notNull().references(() => usuarios.id),

    imagemUrl: text('imagem_url'),
    imagemAlt: text('imagem_alt'),
    creditoFoto: text('credito_foto'),
    anexos: jsonb('anexos').$type<{ url: string; nome: string; bytes: number; mime: string }[]>(),
    linkExterno: jsonb('link_externo').$type<{ url: string; rotulo: string } | null>(),

    destaque: boolean('destaque').notNull().default(false),
    status: statusPublicacao('status').notNull().default('rascunho'),
    publicadoEm: timestamp('publicado_em', { withTimezone: true }),
    expiraEm: timestamp('expira_em', { withTimezone: true }).notNull(),

    urgencia: urgenciaAviso('urgencia'),
    documentoNumero: text('documento_numero'),

    inicioEm: timestamp('inicio_em', { withTimezone: true }),
    fimEm: timestamp('fim_em', { withTimezone: true }),
    local: text('local'),
    modalidade: modalidadeEvento('modalidade'),
    linkInscricao: text('link_inscricao'),
    vagasRestantes: integer('vagas_restantes'),

    prazoFinal: timestamp('prazo_final', { withTimezone: true }),
    abreEm: timestamp('abre_em', { withTimezone: true }),
    linkAcao: jsonb('link_acao').$type<{ url: string; rotulo: string } | null>(),

    pessoasCitadas: text('pessoas_citadas'),

    buscaTsv: tsvector('busca_tsv'),

    criadoEm: timestamp('criado_em', { withTimezone: true }).notNull().defaultNow(),
    atualizadoEm: timestamp('atualizado_em', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('publicacoes_slug_idx').on(t.slug),
    index('publicacoes_mural_idx').on(t.status, t.expiraEm),
    index('publicacoes_busca_idx').using('gin', t.buscaTsv),
  ],
)

export const publicacoesCursos = pgTable(
  'publicacoes_cursos',
  {
    publicacaoId: uuid('publicacao_id').notNull().references(() => publicacoes.id, { onDelete: 'cascade' }),
    cursoId: uuid('curso_id').notNull().references(() => cursos.id, { onDelete: 'cascade' }),
  },
  (t) => [primaryKey({ columns: [t.publicacaoId, t.cursoId] })],
)
