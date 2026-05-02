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
  const calRemain = calLimit - summary.total_calories
  const calPct = Math.min((summary.total_calories / calLimit) * 100, 100)
  const protPct = Math.min((summary.total_protein / protLimit) * 100, 100)

  return (
    <>
      <Navbar profile={p} />
      <div className="page-content">
        <div className="container">

          {/* Header */}
          <div className="dashboard-header">
            <div>
              <h1 className="page-title">สวัสดี, {p?.name?.split(' ')[0] ?? 'คุณ'}</h1>
              <p className="dashboard-date">{formatDate(today)}</p>
            </div>
            <Link href="/food" className="btn btn-primary">
              + เพิ่มมื้ออาหาร
            </Link>
          </div>

          {/* Nutrition summary card */}
          <div className="nutrition-card">
            <div className="nutrition-card-header">
              <span className="nutrition-card-title">สรุปสารอาหารวันนี้</span>
              <span className="nutrition-card-meals">{summary.meal_count} มื้อ</span>
            </div>

            {/* Calories row */}
            <div className="nutrient-row">
              <div className="nutrient-row-top">
                <div className="nutrient-label">
                  <span className="nutrient-dot" style={{ background: 'var(--color-accent)' }} />
                  แคลอรี
                </div>
                <div className="nutrient-values">
                  <span className="nutrient-current" style={{ color: calOver ? 'var(--color-danger)' : 'var(--color-accent)' }}>
                    {summary.total_calories.toLocaleString()}
                  </span>
                  <span className="nutrient-sep">/</span>
                  <span className="nutrient-limit">{calLimit.toLocaleString()} kcal</span>
                </div>
              </div>
              <div className="nutrient-bar-track">
                <div
                  className="nutrient-bar-fill"
                  style={{
                    width: `${calPct}%`,
                    background: calOver ? 'var(--color-danger)' : 'var(--color-accent)',
                  }}
                />
              </div>
              <div className="nutrient-pct" style={{ color: calOver ? 'var(--color-danger)' : 'var(--color-text-muted)' }}>
                {calPct.toFixed(0)}%{calOver ? ' — เกินเป้าหมาย' : ''}
              </div>
            </div>

            {/* Protein row */}
            <div className="nutrient-row">
              <div className="nutrient-row-top">
                <div className="nutrient-label">
                  <span className="nutrient-dot" style={{ background: 'var(--color-protein)' }} />
                  โปรตีน
                </div>
                <div className="nutrient-values">
                  <span className="nutrient-current" style={{ color: 'var(--color-protein)' }}>
                    {summary.total_protein.toFixed(1)}
                  </span>
                  <span className="nutrient-sep">/</span>
                  <span className="nutrient-limit">{protLimit} g</span>
                </div>
              </div>
              <div className="nutrient-bar-track">
                <div
                  className="nutrient-bar-fill"
                  style={{ width: `${protPct}%`, background: 'var(--color-protein)' }}
                />
              </div>
              <div className="nutrient-pct">{protPct.toFixed(0)}%</div>
            </div>

            <div className="nutrition-card-divider" />

            {/* Carbs + Fat row */}
            <div className="macro-row">
              <div className="macro-item">
                <span className="nutrient-dot" style={{ background: 'var(--color-carbs)' }} />
                <div>
                  <div className="macro-label">คาร์โบไฮเดรต</div>
                  <div className="macro-value" style={{ color: 'var(--color-carbs)' }}>
                    {summary.total_carbs.toFixed(1)} <span className="macro-unit">g</span>
                  </div>
                </div>
              </div>
              <div className="macro-divider" />
              <div className="macro-item">
                <span className="nutrient-dot" style={{ background: 'var(--color-fat)' }} />
                <div>
                  <div className="macro-label">ไขมัน</div>
                  <div className="macro-value" style={{ color: 'var(--color-fat)' }}>
                    {summary.total_fat.toFixed(1)} <span className="macro-unit">g</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="nutrition-card-divider" />

            {/* Remaining calories */}
            <div className={`calorie-remain ${calOver ? 'over' : 'under'}`}>
              <span className="calorie-remain-icon">{calOver ? '⚠️' : '✓'}</span>
              <span className="calorie-remain-text">
                {calOver
                  ? `เกินเป้าหมาย ${Math.abs(calRemain).toLocaleString()} kcal`
                  : `คงเหลืออีก ${calRemain.toLocaleString()} kcal`}
              </span>
            </div>
          </div>

          {/* Placeholder modules */}
          <div className="module-card">
            <div className="module-card-header">
              <div className="module-card-title">Body Composition</div>
              <span className="coming-soon-badge">เร็วๆ นี้</span>
            </div>
            <div className="module-card-desc">ติดตามค่า Body Fat %, Muscle Mass, Visceral Fat จากเครื่อง InBody / Tanita</div>
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
