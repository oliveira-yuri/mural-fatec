import { readFileSync } from 'node:fs'
import { describe, it, expect } from 'vitest'

const css = readFileSync('src/app/globals.css', 'utf8')

describe('tokens de design', () => {
  it.each([
    ['--ardosia', '#475D68'],
    ['--ardosia-escura', '#33454E'],
    ['--tijolo', '#B22D30'],
    ['--tijolo-escuro', '#8E2326'],
    ['--tijolo-claro', '#F3B9BA'],
    ['--tinta', '#1E272C'],
    ['--cinza', '#5A6A72'],
    ['--regra', '#D5DBDE'],
    ['--lavado', '#F2F4F5'],
    ['--papel', '#FFFFFF'],
  ])('define %s como %s', (token, hex) => {
    expect(css).toContain(`${token}: ${hex}`)
  })

  it('não usa sombra de elevação', () => {
    expect(css).not.toMatch(/box-shadow:\s*(?!none)/)
  })
})
