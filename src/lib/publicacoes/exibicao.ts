import { differenceInCalendarDays } from 'date-fns'
import { toZonedTime } from 'date-fns-tz'
import { FUSO } from '@/lib/formato/datas'

export type EstadoPrazo = 'vencido' | 'apertado' | 'normal'

const LIMITE_APERTADO = 7

export function diasAte(alvo: Date, agora: Date): number {
  return differenceInCalendarDays(toZonedTime(alvo, FUSO), toZonedTime(agora, FUSO))
}

export function estadoDoPrazo(prazoFinal: Date, agora: Date): EstadoPrazo {
  const dias = diasAte(prazoFinal, agora)
  if (dias < 0) return 'vencido'
  if (dias <= LIMITE_APERTADO) return 'apertado'
  return 'normal'
}

export function rotuloContagem(prazoFinal: Date, agora: Date): string {
  const dias = diasAte(prazoFinal, agora)
  if (dias < 0) return 'Encerrado'
  if (dias === 0) return 'Termina hoje'
  if (dias === 1) return 'Falta 1 dia'
  return `Faltam ${dias} dias`
}

export function estaVigente(
  p: { status: string; expiraEm: Date },
  agora: Date,
): boolean {
  return p.status === 'publicado' && p.expiraEm.getTime() > agora.getTime()
}
