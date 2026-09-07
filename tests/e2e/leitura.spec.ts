import { test, expect, type Locator } from '@playwright/test'

/**
 * toBeVisible() sozinho não basta: a definição de "visible" do Playwright
 * cobre display, visibility e dimensão zero, mas não opacity — um elemento
 * com opacity:0 (a técnica mais comum para "só aparece no hover") passa em
 * toBeVisible() normalmente. Confirmado na prática: com opacity:0 forçado
 * no título via CSS, toBeVisible() continuou passando. Por isso a opacidade
 * computada entra como checagem própria.
 */
async function estaRealmenteVisivel(locator: Locator) {
  await expect(locator).toBeVisible()
  const opacidade = await locator.evaluate((el) => Number(getComputedStyle(el).opacity))
  expect(opacidade).toBeGreaterThan(0)
}

test('a home abre com o aviso mais importante no topo', async ({ page }) => {
  await page.goto('/')
  // O título do seed é "Alteração no calendário acadêmico do 2º semestre";
  // o brief citava "Calendário do 2º semestre" (com C maiúsculo e sem
  // "acadêmico"), que não é substring do título real. toContainText faz
  // correspondência de substring sensível a maiúsculas, então o texto
  // original nunca bateria mesmo com a home correta. Ajustado para o
  // trecho que de fato aparece no h1.
  await expect(page.getByRole('heading', { level: 1 })).toContainText(
    'calendário acadêmico do 2º semestre',
  )
  await expect(page.getByRole('link', { name: 'Ler o comunicado' })).toBeVisible()
})

test('o aluno chega ao prazo mais próximo sem buscar nem filtrar', async ({ page }) => {
  await page.goto('/')
  const prazos = page.getByRole('heading', { name: 'Prazos abertos' })
  await expect(prazos).toBeVisible()
  await expect(page.getByText(/Faltam \d+ dias|Termina hoje|Falta 1 dia/).first()).toBeVisible()
})

test('a publicação vencida sai da listagem e continua abrindo pela URL', async ({ page }) => {
  await page.goto('/avisos')
  await expect(page.getByText('Manutenção elétrica no Bloco C')).toHaveCount(0)

  await page.goto('/p/manutencao-eletrica-no-bloco-c')
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Manutenção elétrica')
  await expect(page.getByText(/saiu do mural em/)).toBeVisible()
})

test('a busca do cabeçalho leva a um resultado com URL própria', async ({ page }) => {
  await page.goto('/')
  await page.getByLabel('Buscar no mural').fill('monitoria')
  await page.getByRole('button', { name: 'Buscar' }).click()

  await expect(page).toHaveURL(/\/buscar\?q=monitoria/)
  await expect(page.getByText(/publicaç(ão|ões) para/)).toBeVisible()
})

test('filtro combinado sem resultado oferece a saída, e a ficha remove só um filtro', async ({
  page,
}) => {
  await page.goto('/buscar?tipo=evento&curso=seguranca-da-informacao&periodo=semana')

  // getByRole('heading', { level: 2 }) sem escopo pega também os quatro <h2>
  // do rodapé (Rodape.tsx) e falha em modo estrito por resolver 5 elementos.
  // Escopar em <main id="conteudo"> isola o h2 de EstadoVazio, que é o único
  // que esta asserção quer checar.
  const conteudo = page.locator('main#conteudo')
  await expect(conteudo.getByRole('heading', { level: 2 })).toContainText('Nenhum evento')

  // O brief usava o link "Ver todos os cursos" da tela de estado vazio
  // (EstadoVazio), condicionado a `saidas.semCurso > 0`. Com este recorte
  // (evento + Segurança da Informação + esta semana) esse contador dá 0 no
  // seed atual — nenhum evento cai fora do filtro de curso dentro dos
  // próximos 7 dias — então o link nunca aparece e o `if (await
  // limpar.count())` do brief pula o bloco inteiro sem executar nenhuma
  // asserção. Ou seja, como estava, o teste "passava" sem checar nada sobre
  // remoção de filtro, mesmo que essa funcionalidade estivesse quebrada.
  //
  // O componente que de fato representa "a ficha" citada no nome do teste é
  // FichasAtivas (as fichas removíveis da §7 da spec), que renderiza sempre
  // que há um filtro ativo, independente da contagem de resultados. Troquei
  // para esse locator, que exercita a asserção de verdade e não depende de
  // uma coincidência de datas do seed.
  const removerCurso = page.getByRole('link', { name: /Remover filtro Curso/ })
  await expect(removerCurso).toBeVisible()
  await removerCurso.click()
  await expect(page).not.toHaveURL(/curso=/)
  await expect(page).toHaveURL(/tipo=evento/)
})

test('nenhuma informação depende de hover', async ({ page }) => {
  await page.goto('/')
  // toContainText só olha o texto que já está no DOM — passaria mesmo que
  // o título estivesse escondido atrás de opacity:0 até o hover, que é
  // exatamente a regressão que este teste existe para pegar. Sem mover o
  // mouse: título, data, resumo e setor precisam estar visíveis de
  // verdade, os quatro.
  const linha = page.locator('a').filter({ hasText: 'Edital de monitoria' }).first()

  await estaRealmenteVisivel(linha.getByRole('heading', { level: 3 }))
  await estaRealmenteVisivel(linha.locator('time'))
  await estaRealmenteVisivel(
    linha.getByText('Doze vagas em seis disciplinas, com bolsa mensal e oito horas semanais.'),
  )
  await estaRealmenteVisivel(linha.getByText('Coordenação de ADS'))
})

test('a navegação por teclado alcança o conteúdo principal', async ({ page }) => {
  await page.goto('/')
  await page.keyboard.press('Tab')
  await expect(page.getByRole('link', { name: 'Pular para o conteúdo' })).toBeFocused()
})
