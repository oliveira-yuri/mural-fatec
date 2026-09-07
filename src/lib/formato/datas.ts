import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { toZonedTime } from 'date-fns-tz'

export const FUSO = 'America/Sao_Paulo'

function noFuso(d: Date): Date {
  return toZonedTime(d, FUSO)
}

export function formatarDataExtenso(d: Date): string {
  return format(noFuso(d), "EEEE, d 'de' MMMM", { locale: ptBR })
}

export function formatarDataCurta(d: Date): string {
  return format(noFuso(d), "d 'de' MMMM", { locale: ptBR })
}

export function formatarDataCompleta(d: Date): string {
  return format(noFuso(d), "d 'de' MMMM 'de' yyyy", { locale: ptBR })
}

function hora(d: Date): string {
  const z = noFuso(d)
  const h = format(z, 'H')
  const m = format(z, 'mm')
  return m === '00' ? `${h}h` : `${h}h${m}`
}

export function formatarHorario(inicio: Date, fim?: Date | null): string {
  return fim ? `${hora(inicio)} às ${hora(fim)}` : hora(inicio)
}

export function paraAtributoDatetime(d: Date): string {
  return format(noFuso(d), 'yyyy-MM-dd')
}
