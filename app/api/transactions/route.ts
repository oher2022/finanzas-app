// app/api/transactions/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const TxnSchema = z.object({
  merchant: z.string().min(1),
  amount: z.number().positive(),
  txn_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  category_id: z.string().uuid().optional().nullable(),
  currency: z.string().default('CLP'),
  payment_method: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
})

export async function GET(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const year = searchParams.get('year') || new Date().getFullYear()
  const month = searchParams.get('month') || (new Date().getMonth() + 1)

  const startDate = `${year}-${String(month).padStart(2, '0')}-01`
  const endDate = new Date(Number(year), Number(month), 0).toISOString().split('T')[0]

  const { data, error } = await supabase
    .from('transactions')
    .select('*, categories(id, name, color, icon)')
    .eq('user_id', user.id)
    .gte('txn_date', startDate)
    .lte('txn_date', endDate)
    .order('txn_date', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const body = await req.json()
  const parsed = TxnSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const { data, error } = await supabase
    .from('transactions')
    .insert({ ...parsed.data, user_id: user.id, source: 'manual', is_reviewed: true })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}

export async function DELETE(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Falta id' }, { status: 400 })

  const { error } = await supabase
    .from('transactions')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
