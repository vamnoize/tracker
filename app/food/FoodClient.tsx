'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { MealLog, Profile, NutritionAnalysis } from '@/types'
import AddMealModal from '@/components/AddMealModal'
import '@/styles/food.css'

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

  const barWidth = (val: number, limit: number) =>
    `${Math.min((val / limit) * 100, 100)}%`

  const handleSave = async (analysis: NutritionAnalysis, imageBase64: string) => {
    // Upload image to Cloudinary at save time
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

        {/* Daily nutrition bars */}
        <div className="nutrition-bar-row">
          <div className="nutrition-bar-item">
            <div className="nutrition-bar-label">แคลอรี</div>
            <div className={`nutrition-bar-amount calories ${totals.calories > calLimit ? 'over' : ''}`}>
              {totals.calories.toLocaleString()}
            </div>
            <div className="nutrition-bar-track">
              <div
                className={`nutrition-bar-fill calories ${totals.calories > calLimit ? 'over' : ''}`}
                style={{ width: barWidth(totals.calories, calLimit) }}
              />
            </div>
            <div className="nutrition-bar-limit">เป้า {calLimit.toLocaleString()} kcal</div>
          </div>

          <div className="nutrition-bar-item">
            <div className="nutrition-bar-label">โปรตีน</div>
            <div className="nutrition-bar-amount protein">{totals.protein.toFixed(1)}g</div>
            <div className="nutrition-bar-track">
              <div
                className="nutrition-bar-fill protein"
                style={{ width: barWidth(totals.protein, protLimit) }}
              />
            </div>
            <div className="nutrition-bar-limit">เป้า {protLimit}g</div>
          </div>

          <div className="nutrition-bar-item">
            <div className="nutrition-bar-label">คาร์บ</div>
            <div className="nutrition-bar-amount carbs">{totals.carbs.toFixed(1)}g</div>
            <div className="nutrition-bar-track">
              <div className="nutrition-bar-fill carbs" style={{ width: '100%', opacity: 0.3 }} />
            </div>
            <div className="nutrition-bar-limit">{meals.length} มื้อ</div>
          </div>

          <div className="nutrition-bar-item">
            <div className="nutrition-bar-label">ไขมัน</div>
            <div className="nutrition-bar-amount fat">{totals.fat.toFixed(1)}g</div>
            <div className="nutrition-bar-track">
              <div className="nutrition-bar-fill fat" style={{ width: '100%', opacity: 0.3 }} />
            </div>
            <div className="nutrition-bar-limit">วันนี้</div>
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
              <div key={meal.id} className="meal-card">
                <div className="meal-card-inner">
                  {meal.image_url ? (
                    <img
                      src={meal.image_url}
                      alt="Food"
                      className="meal-card-image"
                    />
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

                <div className="meal-card-actions">
                  <button
                    className="meal-delete-btn"
                    onClick={() => handleDelete(meal.id)}
                    title="ลบมื้ออาหาร"
                  >
                    ✕
                  </button>
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
    </div>
  )
}
