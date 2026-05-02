import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
      await supabase.from('profiles').upsert({
        id: data.user.id,
        email: data.user.email,
        name: data.user.user_metadata?.full_name ?? null,
        avatar_url: data.user.user_metadata?.avatar_url ?? null,
      }, { onConflict: 'id', ignoreDuplicates: true })

      return NextResponse.redirect(`${origin}/`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`)
}
