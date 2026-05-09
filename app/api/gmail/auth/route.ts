// app/api/gmail/auth/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAuthUrl } from '@/lib/gmail-service'

export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.redirect(new URL('/login', process.env.NEXTAUTH_URL!))

  const url = getAuthUrl(user.id)
  return NextResponse.redirect(url)
}
