// lib/period-utils.ts
// Utilidad para calcular períodos de facturación personalizados (ej: día 20 al día 19)

const MESES_ES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']

export interface PeriodBounds {
  start: Date
  end: Date
  startStr: string   // "YYYY-MM-DD" para queries SQL
  endStr: string
  label: string      // "20 abr – 19 may"
}

export function getPeriodBounds(startDay: number, offset = 0): PeriodBounds {
  const today = new Date()
  const day = today.getDate()
  let year = today.getFullYear()
  let month = today.getMonth() // 0-indexed

  // Si hoy es antes del día de inicio, el período empezó el mes pasado
  if (day < startDay) month -= 1

  // Aplicar offset para navegar entre períodos (-1 = anterior, +1 = siguiente)
  month += offset
  while (month > 11) { month -= 12; year++ }
  while (month < 0)  { month += 12; year-- }

  const start = new Date(year, month, startDay)
  // El período termina el día anterior al día de inicio del mes siguiente
  let endMonth = month + 1
  let endYear = year
  if (endMonth > 11) { endMonth = 0; endYear++ }
  const end = new Date(endYear, endMonth, startDay - 1)

  const pad = (n: number) => String(n).padStart(2, '0')
  const startStr = `${start.getFullYear()}-${pad(start.getMonth() + 1)}-${pad(start.getDate())}`
  const endStr   = `${end.getFullYear()}-${pad(end.getMonth() + 1)}-${pad(end.getDate())}`
  const label    = `${start.getDate()} ${MESES_ES[start.getMonth()]} – ${end.getDate()} ${MESES_ES[end.getMonth()]}`

  return { start, end, startStr, endStr, label }
}
