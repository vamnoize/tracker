'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { MealLog, Profile, NutritionAnalysis } from '@/types'
import AddMealModal from '@/components/AddMealModal'
import MealDetailModal from '@/components/MealDetailModal'
import '@/styles/food.css'
import '@/styles/dashboard.css'
import '@/styles/meal-detail.css'

interface FoodClientProps {
  initialMeals: MealLog[]
  profile: Profile | null
  userId: string
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('th-TH', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

function getMealNames(meal: MealLog): string {
  return meal.food_items?.map((f) => f.name).join(', ') || 'มื้ออาหาร'
}

export default function FoodClient({ initialMeals, profile, userId }: FoodClientProps) {
  const [meals, setMeals] = useState<MealLog[]>(initialMeals)
  const [showModal, setShowModal] = useState(false)
  const [selectedMeal, setSelectedMeal] = useState<MealLog | null>(null)
  const supabase = createClient()

  const calLimit = profile?.daily_calorie_limit ?? 2000
  const protLimit = profile?.daily_protein_limit ?? 50

  const totals = meals.reduce(
    (acc, m) => ({
      calories: acc.calories + (m.total_calories ?? 0),
      protein: acc.protein + (m.total_protein ?? 0),
      carbs: acc.carbs + (m.total_carbs ?? 0),
      fat: acc.fat + (m.total_fat ?? 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  )

  const calOver = totals.calories > calLimit
  const calRemain = calLimit - totals.calories
  const calPct = Math.min((totals.calories / calLimit) * 100, 100)
  const protPct = Math.min((totals.protein / protLimit) * 100, 100)

  const handleSave = async (analysis: NutritionAnalysis, imageBase64: string) => {
    let imageUrl: string | null = null
    const uploadRes = await fetch('/api/upload-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: imageBase64 }),
    })
    if (uploadRes.ok) {
      const { url } = await uploadRes.json()
      imageUrl = url
    }

    const { data, error } = await supabase
      .from('meal_logs')
      .insert({
        user_id: userId,
        image_url: imageUrl,
        food_items: analysis.food_items,
        total_calories: analysis.total_calories,
        total_protein: analysis.total_protein,
        total_carbs: analysis.total_carbs,
        total_fat: analysis.total_fat,
        analysis_text: analysis.analysis_text,
        logged_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) throw error
    setMeals((prev) => [data as MealLog, ...prev])
  }

  const handleDelete = async (id: string) => {
    await supabase.from('meal_logs').delete().eq('id', id)
    setMeals((prev) => prev.filter((m) => m.id !== id))
  }

  return (
    <div className="page-content">
      <div className="container">

        <div className="food-header">
          <h1 className="page-title">Food Tracking วันนี้</h1>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            + เพิ่มมื้ออาหาร
          </button>
        </div>

        {/* Nutrition summary card — same design as dashboard */}
        <div className="nutrition-card">
          <div className="nutrition-card-header">
            <span className="nutrition-card-title">สรุปสารอาหารวันนี้</span>
            <span className="nutrition-card-meals">{meals.length} มื้อ</span>
          </div>

          <div className="nutrient-row">
            <div className="nutrient-row-top">
              <div className="nutrient-label">
                <span className="nutrient-dot" style={{ background: 'var(--color-accent)' }} />
                แคลอรี
              </div>
              <div className="nutrient-values">
                <span className="nutrient-current" style={{ color: calOver ? 'var(--color-danger)' : 'var(--color-accent)' }}>
                  {totals.calories.toLocaleString()}
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

          <div className="nutrient-row">
            <div className="nutrient-row-top">
              <div className="nutrient-label">
                <span className="nutrient-dot" style={{ background: 'var(--color-protein)' }} />
                โปรตีน
              </div>
              <div className="nutrient-values">
                <span className="nutrient-current" style={{ color: 'var(--color-protein)' }}>
                  {totals.protein.toFixed(1)}
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

          <div className="macro-row">
            <div className="macro-item">
              <span className="nutrient-dot" style={{ background: 'var(--color-carbs)' }} />
              <div>
                <div className="macro-label">คาร์โบไฮเดรต</div>
                <div className="macro-value" style={{ color: 'var(--color-carbs)' }}>
                  {totals.carbs.toFixed(1)} <span className="macro-unit">g</span>
                </div>
              </div>
            </div>
            <div className="macro-divider" />
            <div className="macro-item">
              <span className="nutrient-dot" style={{ background: 'var(--color-fat)' }} />
              <div>
                <div className="macro-label">ไขมัน</div>
                <div className="macro-value" style={{ color: 'var(--color-fat)' }}>
                  {totals.fat.toFixed(1)} <span className="macro-unit">g</span>
                </div>
              </div>
            </div>
          </div>

          <div className="nutrition-card-divider" />

          <div className={`calorie-remain ${calOver ? 'over' : 'under'}`}>
            <span className="calorie-remain-icon">{calOver ? '⚠️' : '✓'}</span>
            <span className="calorie-remain-text">
              {calOver
                ? `เกินเป้าหมาย ${Math.abs(calRemain).toLocaleString()} kcal`
                : `คงเหลืออีก ${calRemain.toLocaleString()} kcal`}
            </span>
          </div>
        </div>

        {/* Meal list */}
        {meals.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🍽️</div>
            <div className="empty-state-text">ยังไม่มีบันทึกมื้ออาหารวันนี้</div>
            <div className="empty-state-sub">กดปุ่ม + เพิ่มมื้ออาหาร เพื่อเริ่มต้น</div>
          </div>
        ) : (
          <div className="meal-list">
            {meals.map((meal) => (
              <div key={meal.id} className="meal-card meal-card-clickable" onClick={() => setSelectedMeal(meal)}>
                <button
                  className="meal-delete-btn"
                  onClick={(e) => {
                    e.stopPropagation()
                    if (window.confirm(`ลบมื้ออาหารนี้ใช่ไหม?\n"${getMealNames(meal)}"`)) {
                      handleDelete(meal.id)
                    }
                  }}
                  title="ลบมื้ออาหาร"
                >
                  ✕
                </button>
                <div className="meal-card-inner">
                  {meal.image_url ? (
                    <img src={meal.image_url} alt="Food" className="meal-card-image" />
                  ) : (
                    <div className="meal-card-image-placeholder">🍽️</div>
                  )}
                  <div className="meal-card-content">
                    <div className="meal-card-time">{formatTime(meal.logged_at)}</div>
                    <div className="meal-card-title">{getMealNames(meal)}</div>
                    <div className="meal-card-macros">
                      <span className="meal-macro cals">
                        <strong>{meal.total_calories}</strong> kcal
                      </span>
                      <span className="meal-macro prot">
                        P <strong>{meal.total_protein?.toFixed(1)}</strong>g
                      </span>
                      <span className="meal-macro carb">
                        C <strong>{meal.total_carbs?.toFixed(1)}</strong>g
                      </span>
                      <span className="meal-macro fat">
                        F <strong>{meal.total_fat?.toFixed(1)}</strong>g
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <AddMealModal
          onClose={() => setShowModal(false)}
          onSave={handleSave}
        />
      )}

      {selectedMeal && (
        <MealDetailModal
          meal={selectedMeal}
          onClose={() => setSelectedMeal(null)}
        />
      )}
    </div>
  )
}
