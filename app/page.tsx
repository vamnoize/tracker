import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Navbar from '@/components/Navbar'
import { Profile, DailySummary } from '@/types'
import Link from 'next/link'
import '@/styles/dashboard.css'

function formatDate(date: Date): string {
  return date.toLocaleDateString('th-TH', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function progressWidth(value: number, limit: number): string {
  return `${Math.min((value / limit) * 100, 100)}%`
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const today = new Date()
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString()
  const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1).toISOString()

  const { data: meals } = await supabase
    .from('meal_logs')
    .select('total_calories, total_protein, total_carbs, total_fat')
    .eq('user_id', user.id)
    .gte('logged_at', startOfDay)
    .lt('logged_at', endOfDay)

  const summary = (meals ?? []).reduce<DailySummary>(
    (acc, m) => ({
      total_calories: acc.total_calories + (m.total_calories ?? 0),
      total_protein: acc.total_protein + (m.total_protein ?? 0),
      total_carbs: acc.total_carbs + (m.total_carbs ?? 0),
      total_fat: acc.total_fat + (m.total_fat ?? 0),
      meal_count: acc.meal_count + 1,
    }),
    { total_calories: 0, total_protein: 0, total_carbs: 0, total_fat: 0, meal_count: 0 }
  )

  const p = profile as Profile | null
  const calLimit = p?.daily_calorie_limit ?? 2000
  const protLimit = p?.daily_protein_limit ?? 50
  const calOver = summary.total_calories > calLimit

  return (
    <>
      <Navbar profile={p} />
      <div className="page-content">
        <div className="container">
          <div className="dashboard-header">
            <div>
              <h1 className="page-title">สวัสดี, {p?.name?.split(' ')[0] ?? 'คุณ'}</h1>
              <p className="dashboard-date">{formatDate(today)}</p>
            </div>
            <Link href="/food" className="btn btn-primary">
              + เพิ่มมื้ออาหาร
            </Link>
          </div>

          <div className="dashboard-grid" style={{ marginBottom: '16px' }}>
            <div className="summary-card summary-card-calories">
              <div className="summary-card-label">แคลอรีวันนี้</div>
              <div className="summary-card-value">{summary.total_calories.toLocaleString()}</div>
              <div className="summary-card-sub">เป้าหมาย {calLimit.toLocaleString()} kcal</div>
              <div className="progress-bar-wrap">
                <div className="progress-bar-label">
                  <span>{summary.total_calories} kcal</span>
                  <span>{calLimit} kcal</span>
                </div>
                <div className="progress-bar-track">
                  <div
                    className={`progress-bar-fill ${calOver ? 'over' : ''}`}
                    style={{ width: progressWidth(summary.total_calories, calLimit) }}
                  />
                </div>
              </div>
            </div>

            <div className="summary-card summary-card-protein">
              <div className="summary-card-label">โปรตีนวันนี้</div>
              <div className="summary-card-value">
                {summary.total_protein.toFixed(1)}
                <span style={{ fontSize: '16px', fontWeight: 400 }}>g</span>
              </div>
              <div className="summary-card-sub">เป้าหมาย {protLimit}g</div>
              <div className="progress-bar-wrap">
                <div className="progress-bar-label">
                  <span>{summary.total_protein.toFixed(1)}g</span>
                  <span>{protLimit}g</span>
                </div>
                <div className="progress-bar-track">
                  <div
                    className="progress-bar-fill protein"
                    style={{ width: progressWidth(summary.total_protein, protLimit) }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="dashboard-grid-3" style={{ marginBottom: '28px' }}>
            <div className="summary-card summary-card-carbs">
              <div className="summary-card-label">คาร์โบไฮเดรต</div>
              <div className="summary-card-value">
                {summary.total_carbs.toFixed(1)}
                <span style={{ fontSize: '14px', fontWeight: 400 }}>g</span>
              </div>
              <div className="summary-card-sub">{summary.meal_count} มื้อวันนี้</div>
            </div>
            <div className="summary-card summary-card-fat">
              <div className="summary-card-label">ไขมัน</div>
              <div className="summary-card-value">
                {summary.total_fat.toFixed(1)}
                <span style={{ fontSize: '14px', fontWeight: 400 }}>g</span>
              </div>
            </div>
            <div className="summary-card">
              <div className="summary-card-label">แคลอรีคงเหลือ</div>
              <div
                className="summary-card-value"
                style={{ color: calOver ? 'var(--color-danger)' : 'var(--color-success)' }}
              >
                {Math.abs(calLimit - summary.total_calories).toLocaleString()}
              </div>
              <div className="summary-card-sub">{calOver ? 'เกินเป้าหมาย' : 'kcal remaining'}</div>
            </div>
          </div>

          <div className="module-card">
            <div className="module-card-header">
              <div className="module-card-title">Body Composition</div>
              <span className="coming-soon-badge">เร็วๆ นี้</span>
            </div>
            <div className="module-card-desc">ติดตามค่า Body Fat %, Muscle Mass, Visceral Fat และอื่นๆ จากเครื่อง InBody / Tanita</div>
            <div className="module-placeholder">ยังไม่มีข้อมูล — ฟีเจอร์นี้กำลังพัฒนา</div>
          </div>

          <div className="module-card">
            <div className="module-card-header">
              <div className="module-card-title">น้ำหนักและสัดส่วนร่างกาย</div>
              <span className="coming-soon-badge">เร็วๆ นี้</span>
            </div>
            <div className="module-card-desc">บันทึกน้ำหนัก รอบเอว รอบสะโพก และสัดส่วนร่างกายเพื่อดูพัฒนาการ</div>
            <div className="module-placeholder">ยังไม่มีข้อมูล — ฟีเจอร์นี้กำลังพัฒนา</div>
          </div>
        </div>
      </div>
    </>
  )
}
