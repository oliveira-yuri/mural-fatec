import { describe, it, expect } from 'vitest'
import { precisaDeBancoEmMemoria, URL_PLACEHOLDER } from '@/lib/db/client'

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
