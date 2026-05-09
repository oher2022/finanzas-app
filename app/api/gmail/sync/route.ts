// app/api/gmail/sync/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { syncGmailTransactions } from '@/lib/gmail-service'

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  // Verificar que tiene tokens Gmail
  const supa = createServiceClient()
  const { data: token } = await supa
    .from('gmail_tokens')
    .select('is_active')
    .eq('user_id', user.id)
    .single()

  if (!token?.is_active) {
    return NextResponse.json({ requiresAuth: true }, { status: 200 })
  }

  try {
    const result = await syncGmailTransactions(user.id)
    const hasPermissionError = result.errors.some(e => /Insufficient Permission/i.test(e))
    if (hasPermissionError) {
      return NextResponse.json({ requiresAuth: true, reason: 'insufficient_permission' }, { status: 200 })
    }
    return NextResponse.json(result)
  } catch (err) {
    console.error('Sync error:', err)
    return NextResponse.json({ error: 'Error al sincronizar' }, { status: 500 })
  }
}
