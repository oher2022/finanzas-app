// lib/gmail-parsers.ts
// Parsers específicos para bancos chilenos: Santander, BCI, Falabella
// Cada parser retorna ParsedBankEmail o null si no reconoce el formato

import { ParsedBankEmail } from '@/types'

// ============================================================
// UTILIDADES
// ============================================================
function cleanAmount(raw: string): number {
  // Limpia "$123.456" o "123.456,78" o "123456" → número
  const cleaned = raw
    .replace(/\$/g, '')
    .replace(/\s/g, '')
    .replace(/\./g, '')   // miles chilenos usan punto
    .replace(/,/g, '.')   // decimales
    .trim()
  return parseFloat(cleaned) || 0
}

function parseChileanDate(raw: string): string {
  // Formatos: "02/05/2026", "02-05-2026", "2 de mayo de 2026"
  const meses: Record<string, string> = {
    enero: '01', febrero: '02', marzo: '03', abril: '04',
    mayo: '05', junio: '06', julio: '07', agosto: '08',
    septiembre: '09', octubre: '10', noviembre: '11', diciembre: '12'
  }

  // "DD de MMMM de YYYY"
  const longMatch = raw.match(/(\d{1,2})\s+de\s+(\w+)\s+de\s+(\d{4})/i)
  if (longMatch) {
    const [, d, m, y] = longMatch
    const month = meses[m.toLowerCase()]
    if (month) return `${y}-${month}-${d.padStart(2, '0')}`
  }

  // "DD/MM/YYYY" o "DD-MM-YYYY"
  const slashMatch = raw.match(/(\d{2})[\/\-](\d{2})[\/\-](\d{4})/)
  if (slashMatch) {
    const [, d, m, y] = slashMatch
    return `${y}-${m}-${d}`
  }

  // "YYYY-MM-DD"
  const isoMatch = raw.match(/(\d{4})-(\d{2})-(\d{2})/)
  if (isoMatch) return isoMatch[0]

  return new Date().toISOString().split('T')[0]
}

function extractLast4(text: string): string | null {
  const match = text.match(/(?:terminada?|terminados?|N[°º]?|ending|últimos|last)\s*(?:en|in)?\s*(\d{4})/i)
    || text.match(/[Xx\*]{4,}(\d{4})/)
    || text.match(/\b(\d{4})\b.*(?:visa|mastercard|tarjeta|débito|crédito)/i)
  return match ? match[1] : null
}

function extractInstallments(text: string): number | null {
  const match = text.match(/(\d+)\s*(?:cuotas?|cuota|meses?|installments?)/i)
  return match ? parseInt(match[1]) : null
}

// ============================================================
// SANTANDER CHILE
// Asuntos típicos:
// "Compra con tarjeta terminada en 1234"
// "Alerta de compra Santander"
// "Compra aprobada - Santander"
// ============================================================
export function parseSantander(subject: string, body: string, messageId: string): ParsedBankEmail | null {
  const text = `${subject} ${body}`

  // Detectar que es Santander
  const isSantander = /santander/i.test(text)
  if (!isSantander) return null

  // Detectar que es un GASTO (no ingreso/abono)
  const isExpense = /compra|cargo|débito|debito|pago\s+en|purchase|transacci[oó]n/i.test(text)
  const isIncome = /abono|dep[oó]sito|transferencia\s+recibida|ingreso/i.test(text)
  if (!isExpense || isIncome) return null

  // Extraer monto - Santander usa formato "$1.234.567"
  const amountMatch = body.match(/\$\s*([\d\.]+(?:,\d{1,2})?)/i)
    || body.match(/monto[:\s]+\$?\s*([\d\.]+)/i)
    || body.match(/por\s+\$\s*([\d\.]+)/i)
  if (!amountMatch) return null

  const amount = cleanAmount(amountMatch[1])
  if (amount <= 0 || amount > 100000000) return null

  // Extraer comercio
  const merchantMatch = body.match(/(?:en|comercio|establecimiento|merchant)[:\s]+([^\n\r,\.]{3,50})/i)
    || body.match(/compra\s+en\s+([^\n\r,\.]{3,40})/i)
  const merchant = merchantMatch ? merchantMatch[1].trim() : 'Santander - Comercio desconocido'

  // Extraer fecha
  const dateMatch = body.match(/fecha[:\s]+([\d\/\-]+|\d+\s+de\s+\w+\s+de\s+\d{4})/i)
  const date = dateMatch ? parseChileanDate(dateMatch[1]) : new Date().toISOString().split('T')[0]

  return {
    merchant: merchant.replace(/\s+/g, ' ').trim(),
    amount,
    currency: 'CLP',
    date,
    card_last4: extractLast4(text),
    installments: extractInstallments(text),
    bank_issuer: 'Santander',
    raw_subject: subject,
    gmail_message_id: messageId,
  }
}

// ============================================================
// BCI (Banco de Crédito e Inversiones)
// Formato real: correo 100% HTML desde contacto@bci.cl
// Subject: "Notificación de uso de tu tarjeta de crédito"
// Tabla: Número tarjeta / Monto / Fecha / Hora / Comercio / Cuotas
// ============================================================
export function parseBCI(subject: string, body: string, messageId: string, from = ''): ParsedBankEmail | null {
  const text = `${from} ${subject} ${body}`

  // Detectar BCI — verificar primero por remitente, luego por contenido
  const isBCI = /@bci\.cl/i.test(from) || /\bBCI\b/.test(subject) || /\bBCI\b/.test(body)
  if (!isBCI) return null

  // Detectar GASTO
  const isExpense = /compra|uso.*tarjeta|notificaci[oó]n.*tarjeta|cargo/i.test(text)
  const isIncome = /abono|dep[oó]sito|transferencia\s+recibida|pago\s+recibido/i.test(text)
  if (!isExpense || isIncome) return null

  // Limpiar HTML — BCI envía solo HTML, sin texto plano
  const clean = body
    .replace(/<[^>]+>/g, ' ')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&amp;/gi, '&').replace(/&lt;/gi, '<').replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"').replace(/&nbsp;/gi, ' ')
    .replace(/&[aeiouAEIOUn](?:acute|tilde|grave|circ);/gi, (e) => ({
      '&aacute;': 'á', '&eacute;': 'é', '&iacute;': 'í', '&oacute;': 'ó', '&uacute;': 'ú',
      '&Aacute;': 'Á', '&Eacute;': 'É', '&Iacute;': 'Í', '&Oacute;': 'Ó', '&Uacute;': 'Ú',
      '&ntilde;': 'ñ', '&Ntilde;': 'Ñ',
    }[e.toLowerCase()] ?? e))
    .replace(/\s+/g, ' ')
    .trim()

  // Monto — en tabla: "Monto $29.480"
  const amountMatch = clean.match(/Monto\s+\$\s*([\d\.]+(?:,\d{1,2})?)/i)
    || clean.match(/\$\s*(\d{1,3}(?:\.\d{3})+(?:,\d{1,2})?)/i)
  if (!amountMatch) return null

  const amount = cleanAmount(amountMatch[1])
  if (amount <= 0 || amount > 100000000) return null

  // Comercio — BCI envía tabla HTML; al aplanar queda: "...Hora Comercio Cuotas ****XXXX $AMT DD/MM HH:MM MERCHANT NUM_CUOTAS"
  // El comercio real aparece DESPUÉS de la hora (HH:MM), no después del label "Comercio"
  const merchantMatch =
    clean.match(/\d{2}:\d{2}\s+([A-ZÁÉÍÓÚ][A-ZÁÉÍÓÚ0-9\s\.\-&\/]{2,50?}?)\s+\d+(?:\s|$)/) ||
    clean.match(/\d{2}:\d{2}\s+([A-ZÁÉÍÓÚ][A-ZÁÉÍÓÚ0-9\s\.\-&\/]{2,50})/) ||
    clean.match(/Comercio\s+([A-Z0-9][A-Z0-9\s\.\-]{3,50?}?)\s+(?:Cuotas|\d{2}\/)/i) ||
    clean.match(/Comercio\s+([A-Z0-9][A-Z0-9\s\.\-]{3,50})/i)
  let merchant = merchantMatch ? merchantMatch[1].trim() : 'BCI'
  // Quitar ciudad y código de país: "PASAJEBUS SANTIAGO CL" → "PASAJEBUS"
  merchant = merchant.replace(/\s+[A-Z]{2,20}\s+CL\s*$/i, '').replace(/\s+CL\s*$/i, '').trim()

  // Fecha — "01/05/2026"
  const dateMatch = clean.match(/Fecha\s+(\d{2}\/\d{2}\/\d{4})/i)
    || clean.match(/(\d{2}\/\d{2}\/\d{4})/)
  const date = dateMatch ? parseChileanDate(dateMatch[1]) : new Date().toISOString().split('T')[0]

  // Últimos 4 dígitos — "****8164"
  const last4Match = body.match(/\*{3,4}(\d{4})/)
  const card_last4 = last4Match ? last4Match[1] : null

  // Cuotas
  const cuotasMatch = clean.match(/Cuotas\s+(\d+)/i)
  const installments = cuotasMatch && parseInt(cuotasMatch[1]) > 0 ? parseInt(cuotasMatch[1]) : null

  return {
    merchant: merchant || 'BCI',
    amount,
    currency: 'CLP',
    date,
    card_last4,
    installments,
    bank_issuer: 'BCI',
    raw_subject: subject,
    gmail_message_id: messageId,
  }
}

// ============================================================
// FALABELLA (CMR / Banco Falabella)
// Asuntos típicos:
// "Compra con tu CMR Falabella"
// "Notificación de cargo - Falabella"
// "Tu compra en Falabella fue aprobada"
// ============================================================
export function parseFalabella(subject: string, body: string, messageId: string): ParsedBankEmail | null {
  const text = `${subject} ${body}`

  const isFalabella = /falabella|cmr/i.test(text)
  if (!isFalabella) return null

  const isExpense = /compra|cargo|transacci[oó]n|débito|aprobada/i.test(text)
  const isIncome = /abono|pago\s+recibido|transferencia\s+recibida/i.test(text)
  if (!isExpense || isIncome) return null

  // Falabella usa "$12.345" o "$ 12.345" o "CLP 12.345"
  const amountMatch = body.match(/\$\s*([\d\.]+(?:,\d{1,2})?)/i)
    || body.match(/CLP\s*([\d\.]+)/i)
    || body.match(/monto[:\s]*\$?\s*([\d\.]+)/i)
  if (!amountMatch) return null

  const amount = cleanAmount(amountMatch[1])
  if (amount <= 0 || amount > 100000000) return null

  // Falabella frecuentemente pone "en [COMERCIO]" o "Tienda: "
  const merchantMatch = body.match(/tienda[:\s]+([^\n\r]{3,50})/i)
    || body.match(/comercio[:\s]+([^\n\r]{3,50})/i)
    || body.match(/compra\s+en\s+([^\n\r,\.]{3,45})/i)
    || body.match(/en\s+([A-ZÁÉÍÓÚ][^\n\r,\.]{2,40})/i)
  const merchant = merchantMatch ? merchantMatch[1].trim() : 'Falabella - Comercio desconocido'

  const dateMatch = body.match(/(\d{2}\/\d{2}\/\d{4})/i)
    || body.match(/fecha[:\s]+([\d\/\-]+)/i)
  const date = dateMatch ? parseChileanDate(dateMatch[1]) : new Date().toISOString().split('T')[0]

  // Falabella es fuerte en cuotas
  const installments = extractInstallments(text)

  return {
    merchant: merchant.replace(/\s+/g, ' ').trim(),
    amount,
    currency: 'CLP',
    date,
    card_last4: extractLast4(text),
    installments,
    bank_issuer: 'Falabella',
    raw_subject: subject,
    gmail_message_id: messageId,
  }
}

// ============================================================
// MERCADO PAGO (pagos salientes)
// ============================================================
export function parseMercadoPago(subject: string, body: string, messageId: string): ParsedBankEmail | null {
  const text = `${subject} ${body}`

  const isMP = /mercado\s*pago|mercadopago/i.test(text)
  if (!isMP) return null

  // Solo gastos salientes
  const isExpense = /pagaste|compraste|enviaste|débito|cobro/i.test(text)
  const isIncome = /recibiste|te\s+enviaron|acreditamos/i.test(text)
  if (!isExpense || isIncome) return null

  const amountMatch = body.match(/\$\s*([\d\.]+(?:,\d{1,2})?)/i)
    || body.match(/ARS\s*([\d\.]+)/i)
    || body.match(/CLP\s*([\d\.]+)/i)
  if (!amountMatch) return null

  const amount = cleanAmount(amountMatch[1])
  if (amount <= 0) return null

  const merchantMatch = body.match(/(?:a|en|para)\s+([A-Z][^\n\r,\.]{2,40})/i)
    || body.match(/destinatario[:\s]+([^\n\r]{3,50})/i)
  const merchant = merchantMatch ? merchantMatch[1].trim() : 'Mercado Pago'

  return {
    merchant: merchant.replace(/\s+/g, ' ').trim(),
    amount,
    currency: body.includes('ARS') ? 'ARS' : 'CLP',
    date: new Date().toISOString().split('T')[0],
    card_last4: null,
    installments: null,
    bank_issuer: 'Mercado Pago',
    raw_subject: subject,
    gmail_message_id: messageId,
  }
}

// ============================================================
// DISPATCHER: Intenta todos los parsers en orden
// ============================================================
export function parseEmailTransaction(
  subject: string,
  body: string,
  messageId: string,
  from = ''
): ParsedBankEmail | null {
  const parsers = [
    () => parseSantander(subject, body, messageId),
    () => parseBCI(subject, body, messageId, from),
    () => parseFalabella(subject, body, messageId),
    () => parseMercadoPago(subject, body, messageId),
  ]

  for (const parser of parsers) {
    const result = parser()
    if (result) return result
  }

  return null
}

// ============================================================
// CLASIFICADOR DE CATEGORÍAS por nombre de comercio
// Reglas locales para Chile (sin llamar a la API)
// ============================================================
const MERCHANT_RULES: Array<{ pattern: RegExp; category: string }> = [
  // Supermercados
  { pattern: /jumbo|lider|l[íi]der|santa\s*isabel|unimarc|walmart|acuenta|mayorista/i, category: 'Supermercado' },
  // Delivery
  { pattern: /rappi|uber\s*eats|pedidos\s*ya|justo|ifood|domi\s*cili/i, category: 'Delivery / Comida' },
  // Transporte
  { pattern: /uber|didi|cabify|taxi|metro|transantiago|bip!/i, category: 'Transporte' },
  // Suscripciones
  { pattern: /netflix|spotify|youtube|prime\s*video|disney|hbo|apple|icloud|adobe|microsoft|dropbox/i, category: 'Suscripciones' },
  // Cafeterías
  { pattern: /starbucks|café|caffe|caff[eé]|dunkin|juan\s*valdez/i, category: 'Cafetería' },
  // Farmacias / Salud
  { pattern: /salcobrand|farmacias\s*ahumada|cruz\s*verde|dr\.?\s*simi|farmacia|cl[íi]nica|m[eé]dico|laboratorio/i, category: 'Salud' },
  // Combustible
  { pattern: /copec|shell|petrobras|enex|bencin|combustible|gasolinera/i, category: 'Combustible' },
  // Tiendas retail
  { pattern: /falabella\s*store|ripley|paris|h&m|zara|forever\s*21|ropa/i, category: 'Ropa / Moda' },
  // Compras online
  { pattern: /mercado\s*libre|amazon|aliexpress|ebay|shein|wish|shopify/i, category: 'Compras online' },
  // Entretenimiento
  { pattern: /cinema|cineplanet|cinemark|teatro|evento|ticketmaster|jug[au]/i, category: 'Entretenimiento' },
  // Restaurantes
  { pattern: /restaurant|fuente\s*de\s*soda|comida|sushi|pizza|burger|mcdonalds|kfc|subway/i, category: 'Delivery / Comida' },
  // Educación
  { pattern: /universidad|colegio|escuela|academia|curso|udemy|coursera|platzi/i, category: 'Educación' },
]

export function guessCategory(merchantName: string): string | null {
  for (const rule of MERCHANT_RULES) {
    if (rule.pattern.test(merchantName)) return rule.category
  }
  return null
}
