import { NextRequest, NextResponse } from 'next/server'
import { uploadImage } from '@/lib/cloudinary'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { image } = await request.json()
  if (!image) return NextResponse.json({ error: 'No image provided' }, { status: 400 })

  const url = await uploadImage(image)
  return NextResponse.json({ url })
}
