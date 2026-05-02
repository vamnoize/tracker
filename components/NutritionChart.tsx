'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Cell,
} from 'recharts'
import { ChartPoint, Range } from '@/app/api/nutrition-history/route'
import '@/styles/chart.css'

type Metric = 'calories' | 'macros'

interface NutritionChartProps {
  calLimit: number
  protLimit: number
}

const RANGE_LABELS: { value: Range; label: string }[] = [
  { value: 'daily',   label: '7 วัน' },
  { value: 'weekly',  label: '4 สัปดาห์' },
  { value: 'monthly', label: '6 เดือน' },
]

const METRIC_LABELS: { value: Metric; label: string }[] = [
  { value: 'calories', label: 'แคลอรี' },
  { value: 'macros',   label: 'สารอาหาร' },
]

const COLORS = {
  calories: 'var(--color-accent)',
  protein:  'var(--color-protein)',
  carbs:    'var(--color-carbs)',
  fat:      'var(--color-fat)',
}

function CustomTooltip({ active, payload, label, metric }: {
  active?: boolean
  payload?: { name: string; value: number; color: string }[]
  label?: string
  metric: Metric
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="chart-tooltip">
      <div className="chart-tooltip-label">{label}</div>
      {payload.map((p) => (
        <div key={p.name} className="chart-tooltip-row">
          <span className="chart-tooltip-dot" style={{ background: p.color }} />
          <span className="chart-tooltip-name">{p.name}</span>
          <span className="chart-tooltip-value">
            {metric === 'calories' ? `${p.value.toLocaleString()} kcal` : `${p.value}g`}
          </span>
        </div>
      ))}
    </div>
  )
}

export default function NutritionChart({ calLimit, protLimit }: NutritionChartProps) {
  const [range, setRange]   = useState<Range>('daily')
  const [metric, setMetric] = useState<Metric>('calories')
  const [data, setData]     = useState<ChartPoint[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async (r: Range) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/nutrition-history?range=${r}`)
      if (res.ok) setData(await res.json())
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData(range) }, [range, fetchData])

  const handleRange = (r: Range) => { setRange(r); fetchData(r) }

  const isEmpty = !loading && data.every((d) =>
    d.calories === 0 && d.protein === 0 && d.carbs === 0 && d.fat === 0
  )

  // For calories chart: color each bar red if over limit
  const today = new Date().toLocaleDateString('th-TH', { weekday: 'short', day: 'numeric' }).replace(' ', ' ')

  return (
    <div className="chart-card">
      <div className="chart-card-header">
        <div className="chart-card-title">กราฟเปรียบเทียบสารอาหาร</div>
        <div className="chart-controls">
          <div className="seg-control">
            {RANGE_LABELS.map((r) => (
              <button
                key={r.value}
                className={`seg-btn ${range === r.value ? 'active' : ''}`}
                onClick={() => handleRange(r.value)}
              >
                {r.label}
              </button>
            ))}
          </div>
          <div className="seg-control">
            {METRIC_LABELS.map((m) => (
              <button
                key={m.value}
                className={`seg-btn ${metric === m.value ? 'active' : ''}`}
                onClick={() => setMetric(m.value)}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="chart-loading">
          <span className="spinner spinner-dark" />
          กำลังโหลด...
        </div>
      ) : isEmpty ? (
        <div className="chart-loading">ยังไม่มีข้อมูลในช่วงนี้</div>
      ) : (
        <>
          <div className="chart-body">
            <ResponsiveContainer width="100%" height={220}>
              {metric === 'calories' ? (
                <BarChart data={data} margin={{ top: 8, right: 16, left: -10, bottom: 0 }} barCategoryGap="28%">
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-light)" vertical={false} />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v}
                  />
                  <Tooltip content={<CustomTooltip metric={metric} />} cursor={{ fill: 'var(--color-border-light)' }} />
                  <ReferenceLine
                    y={calLimit}
                    stroke="var(--color-danger)"
                    strokeDasharray="4 3"
                    strokeWidth={1.5}
                    label={{ value: 'เป้า', position: 'right', fontSize: 10, fill: 'var(--color-danger)' }}
                  />
                  <Bar dataKey="calories" name="แคลอรี" radius={[4, 4, 0, 0]}>
                    {data.map((entry, i) => (
                      <Cell
                        key={i}
                        fill={entry.calories > calLimit ? 'var(--color-danger)' : 'var(--color-accent)'}
                        fillOpacity={0.85}
                      />
                    ))}
                  </Bar>
                </BarChart>
              ) : (
                <BarChart data={data} margin={{ top: 8, right: 16, left: -10, bottom: 0 }} barCategoryGap="28%">
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-light)" vertical={false} />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `${v}g`}
                  />
                  <Tooltip content={<CustomTooltip metric={metric} />} cursor={{ fill: 'var(--color-border-light)' }} />
                  <ReferenceLine
                    y={protLimit}
                    stroke="var(--color-protein)"
                    strokeDasharray="4 3"
                    strokeWidth={1.5}
                    label={{ value: 'เป้าโปรตีน', position: 'right', fontSize: 10, fill: 'var(--color-protein)' }}
                  />
                  <Bar dataKey="protein" name="โปรตีน" fill={COLORS.protein} fillOpacity={0.85} radius={[3, 3, 0, 0]} stackId="a" />
                  <Bar dataKey="carbs"   name="คาร์บ"   fill={COLORS.carbs}   fillOpacity={0.85} stackId="a" />
                  <Bar dataKey="fat"     name="ไขมัน"   fill={COLORS.fat}     fillOpacity={0.85} radius={[3, 3, 0, 0]} stackId="a" />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>

          {/* Legend */}
          <div className="chart-legend">
            {metric === 'calories' ? (
              <>
                <div className="chart-legend-item">
                  <span className="chart-legend-dot" style={{ background: 'var(--color-accent)' }} />
                  แคลอรี
                </div>
                <div className="chart-legend-item">
                  <span className="chart-legend-dot" style={{ background: 'var(--color-danger)' }} />
                  เกินเป้าหมาย
                </div>
              </>
            ) : (
              <>
                <div className="chart-legend-item">
                  <span className="chart-legend-dot" style={{ background: COLORS.protein }} />
                  โปรตีน
                </div>
                <div className="chart-legend-item">
                  <span className="chart-legend-dot" style={{ background: COLORS.carbs }} />
                  คาร์โบไฮเดรต
                </div>
                <div className="chart-legend-item">
                  <span className="chart-legend-dot" style={{ background: COLORS.fat }} />
                  ไขมัน
                </div>
              </>
            )}
          </div>
        </>
      )}
    </div>
  )
}
