import { NextRequest, NextResponse } from 'next/server'
import { analyzeFoodImage } from '@/lib/gemini'
import { createClient } from '@/lib/supabase/server'

export const maxDuration = 30

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { imageBase64 } = await request.json()
  if (!imageBase64) return NextResponse.json({ error: 'No imageBase64 provided' }, { status: 400 })

  try {
    const analysis = await analyzeFoodImage(imageBase64)
    return NextResponse.json(analysis)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Analysis failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
