CREATE TYPE "public"."modalidade_evento" AS ENUM('presencial', 'online', 'hibrido');--> statement-breakpoint
CREATE TYPE "public"."papel_usuario" AS ENUM('colaborador', 'editor', 'administrador');--> statement-breakpoint
CREATE TYPE "public"."status_publicacao" AS ENUM('rascunho', 'em_revisao', 'publicado', 'arquivado');--> statement-breakpoint
CREATE TYPE "public"."tipo_publicacao" AS ENUM('aviso', 'evento', 'prazo', 'noticia');--> statement-breakpoint
CREATE TYPE "public"."urgencia_aviso" AS ENUM('informativo', 'importante', 'urgente');--> statement-breakpoint
CREATE TABLE "cursos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nome" text NOT NULL,
	"sigla" text NOT NULL,
	"slug" text NOT NULL,
	"ativo" boolean DEFAULT true NOT NULL,
	CONSTRAINT "cursos_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "publicacoes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"tipo" "tipo_publicacao" NOT NULL,
	"titulo" text NOT NULL,
	"resumo" text NOT NULL,
	"corpo" text NOT NULL,
	"setor_id" uuid NOT NULL,
	"autor_id" uuid NOT NULL,
	"imagem_url" text,
	"imagem_alt" text,
	"credito_foto" text,
	"anexos" jsonb,
	"link_externo" jsonb,
	"destaque" boolean DEFAULT false NOT NULL,
	"status" "status_publicacao" DEFAULT 'rascunho' NOT NULL,
	"publicado_em" timestamp with time zone,
	"expira_em" timestamp with time zone NOT NULL,
	"urgencia" "urgencia_aviso",
	"documento_numero" text,
	"inicio_em" timestamp with time zone,
	"fim_em" timestamp with time zone,
	"local" text,
	"modalidade" "modalidade_evento",
	"link_inscricao" text,
	"vagas_restantes" integer,
	"prazo_final" timestamp with time zone,
	"abre_em" timestamp with time zone,
	"link_acao" jsonb,
	"pessoas_citadas" text,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "publicacoes" ADD COLUMN "busca_tsv" tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('portuguese', coalesce("titulo", '')), 'A') ||
    setweight(to_tsvector('portuguese', coalesce("resumo", '')), 'B') ||
    setweight(to_tsvector('portuguese', coalesce("corpo", '')), 'C')
  ) STORED;
--> statement-breakpoint
CREATE TABLE "publicacoes_cursos" (
	"publicacao_id" uuid NOT NULL,
	"curso_id" uuid NOT NULL,
	CONSTRAINT "publicacoes_cursos_publicacao_id_curso_id_pk" PRIMARY KEY("publicacao_id","curso_id")
);
--> statement-breakpoint
CREATE TABLE "setores" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nome" text NOT NULL,
	"slug" text NOT NULL,
	"ativo" boolean DEFAULT true NOT NULL,
	CONSTRAINT "setores_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "usuarios" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nome" text NOT NULL,
	"email" text NOT NULL,
	"senha_hash" text NOT NULL,
	"papel" "papel_usuario" DEFAULT 'colaborador' NOT NULL,
	"setor_id" uuid NOT NULL,
	"ativo" boolean DEFAULT true NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "usuarios_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "publicacoes" ADD CONSTRAINT "publicacoes_setor_id_setores_id_fk" FOREIGN KEY ("setor_id") REFERENCES "public"."setores"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "publicacoes" ADD CONSTRAINT "publicacoes_autor_id_usuarios_id_fk" FOREIGN KEY ("autor_id") REFERENCES "public"."usuarios"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "publicacoes_cursos" ADD CONSTRAINT "publicacoes_cursos_publicacao_id_publicacoes_id_fk" FOREIGN KEY ("publicacao_id") REFERENCES "public"."publicacoes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "publicacoes_cursos" ADD CONSTRAINT "publicacoes_cursos_curso_id_cursos_id_fk" FOREIGN KEY ("curso_id") REFERENCES "public"."cursos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_setor_id_setores_id_fk" FOREIGN KEY ("setor_id") REFERENCES "public"."setores"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "publicacoes_slug_idx" ON "publicacoes" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "publicacoes_mural_idx" ON "publicacoes" USING btree ("status","expira_em");--> statement-breakpoint
CREATE INDEX "publicacoes_busca_idx" ON "publicacoes" USING gin ("busca_tsv");