// app/api/transactions/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const body = await req.json()
  const updates: Record<string, unknown> = {}

  if ('reimbursed_amount' in body) {
    const reimbursed = Number(body.reimbursed_amount ?? 0)
    if (reimbursed < 0) return NextResponse.json({ error: 'El abono no puede ser negativo' }, { status: 400 })
    updates.reimbursed_amount = reimbursed
  }

  if ('fixed_budget_id' in body) {
    updates.fixed_budget_id = body.fixed_budget_id ?? null
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No hay campos para actualizar' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('transactions')
    .update(updates)
    .eq('id', params.id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
