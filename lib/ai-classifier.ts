// lib/ai-classifier.ts
// Clasificador de transacciones usando Claude API
// Solo se llama cuando las reglas locales no detectan categoría

import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const CATEGORIES = [
  'Supermercado',
  'Delivery / Comida',
  'Transporte',
  'Suscripciones',
  'Cafetería',
  'Salud',
  'Ropa / Moda',
  'Compras online',
  'Entretenimiento',
  'Educación',
  'Hogar',
  'Combustible',
  'Otros',
]

export async function classifyWithAI(
  merchant: string,
  amount: number,
  bankIssuer: string
): Promise<string> {
  try {
    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001', // Modelo más económico para clasificaciones
      max_tokens: 50,
      system: `Eres un clasificador de gastos financieros para usuarios en Chile.
Tu única tarea es asignar una categoría a una transacción.
Responde ÚNICAMENTE con el nombre exacto de una de estas categorías, sin explicación:
${CATEGORIES.join(', ')}`,
      messages: [
        {
          role: 'user',
          content: `Comercio: "${merchant}", Monto: $${amount} CLP, Banco: ${bankIssuer}. ¿Categoría?`,
        },
      ],
    })

    const response = message.content[0]
    if (response.type !== 'text') return 'Otros'

    const suggested = response.text.trim()
    // Validar que sea una categoría válida
    const match = CATEGORIES.find(
      c => c.toLowerCase() === suggested.toLowerCase()
    )
    return match || 'Otros'
  } catch (error) {
    console.error('AI classifier error:', error)
    return 'Otros'
  }
}

// Clasificar en batch (más eficiente para sync inicial de Gmail)
export async function classifyBatch(
  transactions: Array<{ merchant: string; amount: number; bankIssuer: string }>
): Promise<string[]> {
  // Procesar de a 5 en paralelo para no saturar la API
  const results: string[] = []
  const BATCH_SIZE = 5

  for (let i = 0; i < transactions.length; i += BATCH_SIZE) {
    const batch = transactions.slice(i, i + BATCH_SIZE)
    const classified = await Promise.all(
      batch.map(t => classifyWithAI(t.merchant, t.amount, t.bankIssuer))
    )
    results.push(...classified)
  }

  return results
}

// Generar insights automáticos del mes
export async function generateInsights(
  monthData: {
    expenses: Array<{ category: string; amount: number; prevMonthAmount: number }>
    totalExpenses: number
    prevMonthTotal: number
    topSubscriptions: string[]
    unusualTransactions: Array<{ merchant: string; amount: number }>
  }
): Promise<Array<{ type: 'warning' | 'info' | 'success' | 'tip'; message: string; detail: string }>> {
  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 800,
      system: `Eres un asesor financiero personal para usuarios en Chile.
Analiza los datos financieros del mes y genera exactamente 3-4 insights útiles en español.
Responde SOLO en JSON válido con este formato exacto:
[
  {"type": "warning|info|success|tip", "message": "Texto corto (máx 80 chars)", "detail": "Detalle breve (máx 150 chars)"}
]
Sé específico con números y porcentajes. Usa pesos chilenos ($).`,
      messages: [
        {
          role: 'user',
          content: JSON.stringify(monthData),
        },
      ],
    })

    const response = message.content[0]
    if (response.type !== 'text') return []

    const cleaned = response.text.replace(/```json|```/g, '').trim()
    return JSON.parse(cleaned)
  } catch (error) {
    console.error('Insights generation error:', error)
    return []
  }
}
