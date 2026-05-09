// app/api/gmail/callback/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { exchangeCode } from '@/lib/gmail-service'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get('code')
  const userId = searchParams.get('state') // lo pasamos en getAuthUrl
  const error = searchParams.get('error')

  const base = process.env.NEXTAUTH_URL || 'http://localhost:3000'

  if (error || !code || !userId) {
    return NextResponse.redirect(`${base}/settings?gmail=error`)
  }

  try {
    const tokens = await exchangeCode(code)
    const supabase = createServiceClient()

    // Guardar/actualizar tokens
    await supabase.from('gmail_tokens').upsert({
      user_id: userId,
      access_token: tokens.access_token!,
      refresh_token: tokens.refresh_token!,
      expires_at: new Date(tokens.expiry_date!).toISOString(),
      is_active: true,
    }, { onConflict: 'user_id' })

    return NextResponse.redirect(`${base}/dashboard?gmail=connected`)
  } catch (err) {
    console.error('Gmail callback error:', err)
    return NextResponse.redirect(`${base}/settings?gmail=error`)
  }
}
