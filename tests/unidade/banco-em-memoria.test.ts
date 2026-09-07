import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  ERRO_PRODUCAO_SEM_BANCO,
  obterDb,
  permiteBancoEmMemoria,
  precisaDeBancoEmMemoria,
  URL_PLACEHOLDER,
} from '@/lib/db/client'

describe('precisaDeBancoEmMemoria', () => {
  it('precisa de banco em memória quando DATABASE_URL está ausente', () => {
    expect(precisaDeBancoEmMemoria(undefined)).toBe(true)
  })

  it('precisa de banco em memória quando DATABASE_URL está vazia', () => {
    expect(precisaDeBancoEmMemoria('')).toBe(true)
  })

  it('precisa de banco em memória quando DATABASE_URL é o placeholder do .env.example', () => {
    expect(precisaDeBancoEmMemoria(URL_PLACEHOLDER)).toBe(true)
  })

  it('não precisa de banco em memória com uma DATABASE_URL real', () => {
    expect(precisaDeBancoEmMemoria('postgresql://real:senha@db.supabase.co:5432/postgres')).toBe(false)
  })
})

describe('permiteBancoEmMemoria', () => {
  it('permite em desenvolvimento', () => {
    expect(permiteBancoEmMemoria('development')).toBe(true)
  })

  it('permite em teste', () => {
    expect(permiteBancoEmMemoria('test')).toBe(true)
  })

  it('não permite em produção', () => {
    expect(permiteBancoEmMemoria('production')).toBe(false)
  })
})

describe('obterDb — fronteira de produção', () => {
  // obterDb guarda a Promise em globalThis para sobreviver ao hot reload.
  // Cada caso aqui monta o banco do zero, então a chave precisa sair antes
  // e depois — senão um caso herdaria a decisão do outro.
  const CHAVE = Symbol.for('mural-fatec.db')
  const limparCache = () => {
    delete (globalThis as Record<symbol, unknown>)[CHAVE]
  }

  beforeEach(limparCache)
  afterEach(() => {
    limparCache()
    vi.unstubAllEnvs()
  })

  it('recusa subir o banco em memória em produção, em vez de servir dados de exemplo', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubEnv('DATABASE_URL', '')

    await expect(obterDb()).rejects.toThrow(ERRO_PRODUCAO_SEM_BANCO)
  })

  it('recusa também quando a DATABASE_URL ficou no placeholder do .env.example', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubEnv('DATABASE_URL', URL_PLACEHOLDER)

    await expect(obterDb()).rejects.toThrow(/DATABASE_URL/)
  })

  it('em produção com DATABASE_URL de verdade, monta a conexão normalmente', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubEnv('DATABASE_URL', 'postgresql://real:senha@db.supabase.co:5432/postgres')

    // postgres-js só abre a conexão na primeira consulta, então isto não
    // toca a rede: prova só que a fronteira deixa passar o caminho certo.
    await expect(obterDb()).resolves.toBeDefined()
  })
})
