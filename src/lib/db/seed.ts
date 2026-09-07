import { addDays, subDays } from 'date-fns'
import type { Db } from './client'
import { cursos, publicacoes, publicacoesCursos, setores, usuarios } from './schema'
import { gerarSlug } from '@/lib/publicacoes/slug'

// Confirmar esta lista com a unidade antes da entrega (seção 16 da spec).
const CURSOS = [
  { nome: 'Análise e Desenvolvimento de Sistemas', sigla: 'ADS' },
  { nome: 'Gestão Empresarial', sigla: 'GE' },
  { nome: 'Segurança da Informação', sigla: 'SI' },
]

const SETORES = [
  'Secretaria Acadêmica',
  'Direção',
  'Coordenação de ADS',
  'Coordenação de Gestão Empresarial',
  'Centro Acadêmico',
]

export async function semear(db: Db, agora: Date = new Date()): Promise<void> {
  const setoresGravados = await db
    .insert(setores)
    .values(SETORES.map((nome) => ({ nome, slug: gerarSlug(nome) })))
    .returning()

  const cursosGravados = await db
    .insert(cursos)
    .values(CURSOS.map((c) => ({ ...c, slug: gerarSlug(c.nome) })))
    .returning()

  const porSetor = (nome: string) => {
    const s = setoresGravados.find((x) => x.nome === nome)
    if (!s) throw new Error(`Setor ausente no seed: ${nome}`)
    return s.id
  }
  const porCurso = (sigla: string) => {
    const c = cursosGravados.find((x) => x.sigla === sigla)
    if (!c) throw new Error(`Curso ausente no seed: ${sigla}`)
    return c.id
  }

  const [autor] = await db
    .insert(usuarios)
    .values({
      nome: 'Helena Vasconcelos',
      email: 'helena.vasconcelos@fatec.sp.gov.br',
      // Substituído por hash real no Plano 2, quando a autenticação existir.
      senhaHash: 'definir-no-plano-2',
      papel: 'editor',
      setorId: porSetor('Secretaria Acadêmica'),
    })
    .returning()

  const comuns = { autorId: autor.id, status: 'publicado' as const }

  const gravadas = await db
    .insert(publicacoes)
    .values([
      {
        ...comuns,
        slug: gerarSlug('Alteração no calendário acadêmico do 2º semestre'),
        tipo: 'aviso',
        titulo: 'Alteração no calendário acadêmico do 2º semestre',
        resumo: 'Início das aulas antecipado em uma semana. Novas datas de provas no edital.',
        corpo:
          'O início das aulas foi antecipado em uma semana. As novas datas de provas e de encerramento do semestre estão no edital anexo.\n\nA alteração vale para todos os cursos e períodos.',
        setorId: porSetor('Secretaria Acadêmica'),
        urgencia: 'urgente',
        documentoNumero: '042/2026',
        destaque: true,
        publicadoEm: subDays(agora, 3),
        expiraEm: addDays(agora, 27),
      },
      {
        ...comuns,
        slug: gerarSlug('Edital de monitoria remunerada para o 2º semestre'),
        tipo: 'aviso',
        titulo: 'Edital de monitoria remunerada para o 2º semestre',
        resumo: 'Doze vagas em seis disciplinas, com bolsa mensal e oito horas semanais.',
        corpo: 'As inscrições vão até 19 de setembro, pelo SIGA, com histórico e carta de intenção.',
        setorId: porSetor('Coordenação de ADS'),
        urgencia: 'importante',
        documentoNumero: '039/2026',
        publicadoEm: subDays(agora, 5),
        expiraEm: addDays(agora, 25),
      },
      {
        ...comuns,
        slug: gerarSlug('Semana de Tecnologia: IA aplicada a sistemas embarcados'),
        tipo: 'evento',
        titulo: 'Semana de Tecnologia: IA aplicada a sistemas embarcados',
        resumo: 'Abertura da programação com pesquisadores da Unicamp e engenheiros da região.',
        corpo: 'A mesa de abertura discute inferência em dispositivos de borda.',
        setorId: porSetor('Coordenação de ADS'),
        inicioEm: addDays(agora, 15),
        fimEm: addDays(agora, 15),
        local: 'Auditório do Bloco B',
        modalidade: 'presencial',
        vagasRestantes: 23,
        publicadoEm: subDays(agora, 6),
        expiraEm: addDays(agora, 22),
      },
      {
        ...comuns,
        slug: gerarSlug('Feira de estágios e primeiro emprego'),
        tipo: 'evento',
        titulo: 'Feira de estágios e primeiro emprego',
        resumo: 'Dezenove empresas da região recebem currículos e entrevistam no mesmo dia.',
        corpo: 'Levar currículo impresso. Não é preciso se inscrever.',
        setorId: porSetor('Direção'),
        inicioEm: addDays(agora, 24),
        fimEm: addDays(agora, 24),
        local: 'Pátio coberto',
        modalidade: 'presencial',
        publicadoEm: subDays(agora, 2),
        expiraEm: addDays(agora, 31),
      },
      {
        ...comuns,
        slug: gerarSlug('Inscrição em disciplinas do 2º semestre'),
        tipo: 'prazo',
        titulo: 'Inscrição em disciplinas do 2º semestre',
        resumo: 'Pelo SIGA, até as 23h59 da data-limite.',
        corpo: 'Confira a grade antes de confirmar. Depois do prazo só há ajuste presencial.',
        setorId: porSetor('Secretaria Acadêmica'),
        prazoFinal: addDays(agora, 4),
        publicadoEm: subDays(agora, 10),
        expiraEm: addDays(agora, 4),
      },
      {
        ...comuns,
        slug: gerarSlug('Entrega do relatório parcial de TCC'),
        tipo: 'prazo',
        titulo: 'Entrega do relatório parcial de TCC',
        resumo: 'Turmas do 6º ciclo, no SIGA e impresso na secretaria.',
        corpo: 'Duas vias impressas, assinadas pelo orientador.',
        setorId: porSetor('Coordenação de ADS'),
        prazoFinal: addDays(agora, 21),
        publicadoEm: subDays(agora, 8),
        expiraEm: addDays(agora, 21),
      },
      {
        ...comuns,
        slug: gerarSlug('Equipe de ADS fica em terceiro na Maratona de Programação'),
        tipo: 'noticia',
        titulo: 'Equipe de ADS fica em terceiro na Maratona de Programação',
        resumo: 'Os três alunos garantiram vaga na final nacional, em novembro.',
        corpo: 'A equipe disputou a etapa regional contra 112 equipes.',
        setorId: porSetor('Coordenação de ADS'),
        pessoasCitadas: 'Marcela Tsuchiya, Ithalo Bandeira e Renan Sposito',
        creditoFoto: 'Assessoria de Comunicação',
        publicadoEm: subDays(agora, 6),
        expiraEm: addDays(agora, 84),
      },
      {
        ...comuns,
        slug: gerarSlug('Campanha de doação de sangue reúne 84 voluntários'),
        tipo: 'noticia',
        titulo: 'Campanha de doação de sangue reúne 84 voluntários',
        resumo: 'A ação do centro acadêmico ocupou o pátio coberto por dois dias.',
        corpo: 'O hemocentro recebeu doadores de todos os cursos e períodos.',
        setorId: porSetor('Centro Acadêmico'),
        publicadoEm: subDays(agora, 32),
        expiraEm: addDays(agora, 58),
      },
      {
        // Vencida de propósito: prova que expiração some da listagem
        // e que a página individual continua acessível.
        ...comuns,
        slug: gerarSlug('Manutenção elétrica no Bloco C'),
        tipo: 'aviso',
        titulo: 'Manutenção elétrica no Bloco C',
        resumo: 'Aulas do noturno remanejadas para as salas 201 a 206 do Bloco A.',
        corpo: 'O fornecimento foi restabelecido na manhã seguinte.',
        setorId: porSetor('Direção'),
        urgencia: 'informativo',
        publicadoEm: subDays(agora, 40),
        expiraEm: subDays(agora, 10),
      },
    ])
    .returning()

  const porSlug = (slug: string) => {
    const p = gravadas.find((x) => x.slug === slug)
    if (!p) throw new Error(`Publicação ausente no seed: ${slug}`)
    return p.id
  }

  await db.insert(publicacoesCursos).values([
    { publicacaoId: porSlug(gerarSlug('Edital de monitoria remunerada para o 2º semestre')), cursoId: porCurso('ADS') },
    { publicacaoId: porSlug(gerarSlug('Semana de Tecnologia: IA aplicada a sistemas embarcados')), cursoId: porCurso('ADS') },
    { publicacaoId: porSlug(gerarSlug('Inscrição em disciplinas do 2º semestre')), cursoId: porCurso('ADS') },
    { publicacaoId: porSlug(gerarSlug('Inscrição em disciplinas do 2º semestre')), cursoId: porCurso('GE') },
    { publicacaoId: porSlug(gerarSlug('Entrega do relatório parcial de TCC')), cursoId: porCurso('ADS') },
    { publicacaoId: porSlug(gerarSlug('Equipe de ADS fica em terceiro na Maratona de Programação')), cursoId: porCurso('ADS') },
  ])
}

// Execução direta: npm run db:seed
if (process.argv[1]?.includes('seed')) {
  import('./client')
    .then(({ db }) => semear(db))
    .then(() => {
      console.log('Mural semeado com 9 publicações.')
      process.exit(0)
    })
    .catch((erro) => {
      console.error(erro)
      process.exit(1)
    })
}
