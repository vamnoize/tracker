import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export type Range = 'daily' | 'weekly' | 'monthly'

export interface ChartPoint {
  label: string
  calories: number
  protein: number
  carbs: number
  fat: number
}

const THAI_DAYS = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส']
const THAI_MONTHS = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.']

function dateKey(date: Date, range: Range): string {
  if (range === 'daily') {
    return date.toISOString().slice(0, 10)
  }
  if (range === 'weekly') {
    // ISO week key: YYYY-Www
    const d = new Date(date)
    d.setHours(0, 0, 0, 0)
    d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7))
    const week1 = new Date(d.getFullYear(), 0, 4)
    const wk = Math.round(((d.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7) + 1
    return `${d.getFullYear()}-W${String(wk).padStart(2, '0')}`
  }
  // monthly
  return date.toISOString().slice(0, 7)
}

function dateLabel(key: string, range: Range): string {
  if (range === 'daily') {
    const d = new Date(key + 'T12:00:00')
    return `${THAI_DAYS[d.getDay()]} ${d.getDate()}`
  }
  if (range === 'weekly') {
    return `สัปดาห์ ${key.split('-W')[1]}`
  }
  const [year, month] = key.split('-')
  return `${THAI_MONTHS[parseInt(month) - 1]} ${parseInt(year) + 543 - 2500}`
}

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const range = (request.nextUrl.searchParams.get('range') ?? 'daily') as Range

  const now = new Date()
  const startDate = new Date(now)

  if (range === 'daily') startDate.setDate(now.getDate() - 6)
  else if (range === 'weekly') startDate.setDate(now.getDate() - 27)
  else startDate.setMonth(now.getMonth() - 5)

  startDate.setHours(0, 0, 0, 0)

  const { data: meals } = await supabase
    .from('meal_logs')
    .select('total_calories, total_protein, total_carbs, total_fat, logged_at')
    .eq('user_id', user.id)
    .gte('logged_at', startDate.toISOString())
    .order('logged_at', { ascending: true })

  // Build ordered key list (all periods, even empty ones)
  const keys: string[] = []
  const cursor = new Date(startDate)
  while (cursor <= now) {
    const k = dateKey(cursor, range)
    if (!keys.includes(k)) keys.push(k)
    if (range === 'daily') cursor.setDate(cursor.getDate() + 1)
    else if (range === 'weekly') cursor.setDate(cursor.getDate() + 7)
    else cursor.setMonth(cursor.getMonth() + 1)
  }

  // Aggregate meals into buckets
  const buckets: Record<string, ChartPoint> = {}
  for (const k of keys) {
    buckets[k] = { label: dateLabel(k, range), calories: 0, protein: 0, carbs: 0, fat: 0 }
  }

  for (const m of meals ?? []) {
    const k = dateKey(new Date(m.logged_at), range)
    if (buckets[k]) {
      buckets[k].calories += m.total_calories ?? 0
      buckets[k].protein  += m.total_protein  ?? 0
      buckets[k].carbs    += m.total_carbs    ?? 0
      buckets[k].fat      += m.total_fat      ?? 0
    }
  }

  const result: ChartPoint[] = keys.map((k) => ({
    ...buckets[k],
    protein: Math.round(buckets[k].protein * 10) / 10,
    carbs:   Math.round(buckets[k].carbs   * 10) / 10,
    fat:     Math.round(buckets[k].fat     * 10) / 10,
  }))

  return NextResponse.json(result)
}
