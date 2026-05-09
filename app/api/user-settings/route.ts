// app/api/user-settings/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { data } = await supabase
    .from('user_settings')
    .select('user_id, period_start_day')
    .eq('user_id', user.id)
    .single()

  return NextResponse.json(data ?? { user_id: user.id, period_start_day: 1 })
}

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const body = await req.json()
  const day = Number(body.period_start_day)
  if (!day || day < 1 || day > 28) {
    return NextResponse.json({ error: 'Día inválido (1–28)' }, { status: 400 })
  }

  const { error } = await supabase
    .from('user_settings')
    .upsert({ user_id: user.id, period_start_day: day, updated_at: new Date().toISOString() }, { onConflict: 'user_id' })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, period_start_day: day })
}
