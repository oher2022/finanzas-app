// lib/gmail-service.ts
// Manejo completo de Gmail API: OAuth + lectura de correos

import { google } from 'googleapis'
import { createServiceClient } from '@/lib/supabase/server'
import { parseEmailTransaction, guessCategory } from '@/lib/gmail-parsers'
import { classifyWithAI } from '@/lib/ai-classifier'

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
)

// Scopes mínimos necesarios: solo lectura de correos
const GMAIL_SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/userinfo.email',
]

// ============================================================
// AUTH
// ============================================================
export function getAuthUrl(userId: string): string {
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: GMAIL_SCOPES,
    prompt: 'consent', // Forzar pantalla de consentimiento para obtener refresh_token
    state: userId, // Pasar userId para asociar el token
  })
}

export async function exchangeCode(code: string) {
  const { tokens } = await oauth2Client.getToken(code)
  return tokens
}

export async function refreshAccessToken(refreshToken: string) {
  oauth2Client.setCredentials({ refresh_token: refreshToken })
  const { credentials } = await oauth2Client.refreshAccessToken()
  return credentials
}

// ============================================================
// SYNC DE CORREOS
// ============================================================
interface SyncResult {
  processed: number
  newTransactions: number
  duplicates: number
  ignored: number
  failed: number
  errors: string[]
}

export async function syncGmailTransactions(userId: string): Promise<SyncResult> {
  const supabase = createServiceClient()
  const result: SyncResult = { processed: 0, newTransactions: 0, duplicates: 0, ignored: 0, failed: 0, errors: [] }

  // 1. Obtener tokens del usuario
  const { data: tokenData, error: tokenError } = await supabase
    .from('gmail_tokens')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .single()

  if (tokenError || !tokenData) {
    result.errors.push('No hay tokens Gmail activos')
    return result
  }

  // 2. Refrescar token si está vencido
  let accessToken = tokenData.access_token
  if (new Date(tokenData.expires_at) < new Date()) {
    try {
      const newCreds = await refreshAccessToken(tokenData.refresh_token)
      accessToken = newCreds.access_token!
      await supabase
        .from('gmail_tokens')
        .update({
          access_token: accessToken,
          expires_at: new Date(newCreds.expiry_date!).toISOString(),
        })
        .eq('user_id', userId)
    } catch {
      result.errors.push('No se pudo refrescar el token de Gmail')
      return result
    }
  }

  // 3. Configurar cliente Gmail
  oauth2Client.setCredentials({ access_token: accessToken })
  const gmail = google.gmail({ version: 'v1', auth: oauth2Client })

  // 4. Buscar correos bancarios de los últimos 365 días
  const afterDate = new Date()
  afterDate.setDate(afterDate.getDate() - 365)
  const pad = (n: number) => String(n).padStart(2, '0')
  const afterQuery = `${afterDate.getFullYear()}/${pad(afterDate.getMonth() + 1)}/${pad(afterDate.getDate())}`

  // Gmail acepta: from:(A OR B OR C) — más robusto que múltiples OR separados
  const bankQuery = [
    `from:(contacto@bci.cl OR alertas@bci.cl OR hola@bci.cl`,
    ` OR alertas@santander.cl OR notificaciones@santander.cl`,
    ` OR alertas@falabella.com OR notificaciones@falabella.com OR contacto@falabella.com`,
    ` OR notificaciones@mercadopago.com)`,
    ` after:${afterQuery}`,
  ].join('')

  console.log(`[Gmail Sync] Query: ${bankQuery}`)

  try {
    const listResponse = await gmail.users.messages.list({
      userId: 'me',
      q: bankQuery,
      maxResults: 200,
    })

    const messages = listResponse.data.messages || []
    result.processed = messages.length
    console.log(`[Gmail Sync] Query returned ${messages.length} emails`)

    // 5. Procesar cada correo
    for (const msg of messages) {
      if (!msg.id) continue

      // Saltar solo si ya fue parseado exitosamente (tiene transacción)
      // Los 'ignored' se reintentan en cada sync para que los parsers mejorados los capturen
      const { data: existing } = await supabase
        .from('gmail_emails')
        .select('id')
        .eq('gmail_message_id', msg.id)
        .eq('user_id', userId)
        .eq('parse_status', 'parsed')
        .single()

      if (existing) {
        result.duplicates++
        continue
      }

      try {
        // Obtener contenido del correo
        const msgData = await gmail.users.messages.get({
          userId: 'me',
          id: msg.id,
          format: 'full',
        })

        const headers = msgData.data.payload?.headers || []
        const subject = headers.find(h => h.name === 'Subject')?.value || ''
        const from = headers.find(h => h.name === 'From')?.value || ''
        const body = extractEmailBody(msgData.data.payload)
        const receivedAt = new Date(parseInt(msgData.data.internalDate || '0')).toISOString()

        // Intentar parsear como transacción bancaria
        const parsed = parseEmailTransaction(subject, body, msg.id, from)

        if (!parsed) {
          result.ignored++
          console.log(`[Gmail Sync] ignored | from="${from}" | subject="${subject}" | body[:200]="${body.substring(0, 200).replace(/\s+/g, ' ')}"`)
          result.errors.push(`[ignored] from="${from}" subject="${subject}"`)
          await supabase.from('gmail_emails').upsert({
            user_id: userId,
            gmail_message_id: msg.id,
            raw_subject: subject,
            raw_snippet: body.substring(0, 300),
            parse_status: 'ignored',
            received_at: receivedAt,
          }, { onConflict: 'user_id,gmail_message_id' })
          continue
        }

        // Clasificar categoría
        let categoryName = guessCategory(parsed.merchant)
        if (!categoryName) {
          categoryName = await classifyWithAI(parsed.merchant, parsed.amount, parsed.bank_issuer)
        }

        // Buscar category_id por nombre
        const { data: categoryData } = await supabase
          .from('categories')
          .select('id')
          .eq('user_id', userId)
          .eq('name', categoryName)
          .single()

        // Crear transacción
        const { data: txn, error: txnError } = await supabase
          .from('transactions')
          .insert({
            user_id: userId,
            category_id: categoryData?.id || null,
            txn_date: parsed.date,
            merchant: parsed.merchant,
            amount: parsed.amount,
            currency: parsed.currency,
            card_last4: parsed.card_last4,
            bank_issuer: parsed.bank_issuer,
            installments: parsed.installments,
            source: 'gmail',
            is_recurring: isRecurringSub(parsed.merchant),
            is_reviewed: false,
          })
          .select('id')
          .single()

        if (txnError) {
          result.failed++
          result.errors.push(`Error creando transacción: ${txnError.message}`)
          continue
        }

        // Guardar registro del correo procesado
        await supabase.from('gmail_emails').upsert({
          user_id: userId,
          gmail_message_id: msg.id,
          raw_subject: subject,
          raw_snippet: body.substring(0, 500),
          parsed_merchant: parsed.merchant,
          parsed_amount: parsed.amount,
          parse_status: 'parsed',
          transaction_id: txn.id,
          received_at: receivedAt,
        }, { onConflict: 'user_id,gmail_message_id' })

        result.newTransactions++
      } catch (emailError) {
        result.failed++
        result.errors.push(`Error procesando correo ${msg.id}: ${emailError}`)
      }
    }

    // Actualizar timestamp de último sync
    await supabase
      .from('gmail_tokens')
      .update({ last_sync: new Date().toISOString() })
      .eq('user_id', userId)

  } catch (apiError) {
    result.errors.push(`Error consultando Gmail API: ${apiError}`)
    console.error('[Gmail Sync] API error:', apiError)
  }

  console.log('[Gmail Sync] Final result:', result)
  return result
}

// ============================================================
// UTILIDADES
// ============================================================
function findPartByMime(payload: any, mimeType: string): string {
  if (!payload) return ''
  if (payload.mimeType === mimeType && payload.body?.data) {
    return Buffer.from(payload.body.data, 'base64').toString('utf-8')
  }
  for (const part of payload.parts || []) {
    const found = findPartByMime(part, mimeType)
    if (found) return found
  }
  return ''
}

function extractEmailBody(payload: any): string {
  if (!payload) return ''
  // Correo de cuerpo directo (sin partes)
  if (payload.body?.data && !payload.parts) {
    return Buffer.from(payload.body.data, 'base64').toString('utf-8')
  }
  return findPartByMime(payload, 'text/plain') || findPartByMime(payload, 'text/html')
}

const RECURRING_PATTERNS = [
  /netflix|spotify|youtube\s*premium|prime\s*video|disney|hbo|apple\s*tv|apple\s*music/i,
  /icloud|dropbox|google\s*one|microsoft\s*365|adobe/i,
  /linkedin\s*premium|duolingo|headspace|calm/i,
]

function isRecurringSub(merchant: string): boolean {
  return RECURRING_PATTERNS.some(p => p.test(merchant))
}
