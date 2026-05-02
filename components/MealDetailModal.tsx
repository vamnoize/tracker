'use client'

import { MealLog } from '@/types'
import '@/styles/food.css'
import '@/styles/meal-detail.css'

interface MealDetailModalProps {
  meal: MealLog
  onClose: () => void
}

function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString('th-TH', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function MealDetailModal({ meal, onClose }: MealDetailModalProps) {
  const items = meal.food_items ?? []

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2 className="modal-title">รายละเอียดมื้ออาหาร</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          {/* Image */}
          {meal.image_url && (
            <div className="detail-image-wrap">
              <img src={meal.image_url} alt="Food" className="detail-image" />
            </div>
          )}

          {/* Time */}
          <p className="detail-time">{formatDateTime(meal.logged_at)}</p>

          {/* Analysis text */}
          {meal.analysis_text && (
            <p className="detail-analysis-text">{meal.analysis_text}</p>
          )}

          {/* Food items breakdown */}
          {items.length > 0 && (
            <div className="detail-section">
              <div className="detail-section-title">รายการอาหาร</div>

              <div className="detail-items">
                {/* Header */}
                <div className="detail-item-header">
                  <span>รายการ</span>
                  <div className="detail-item-macros">
                    <span>Cal</span>
                    <span>P</span>
                    <span>C</span>
                    <span>F</span>
                  </div>
                </div>

                {/* Each food item */}
                {items.map((item, i) => (
                  <div key={i} className="detail-item">
                    <div className="detail-item-left">
                      <div className="detail-item-name">{item.name}</div>
                      <div className="detail-item-portion">{item.portion}</div>
                    </div>
                    <div className="detail-item-macros">
                      <span className="detail-macro cal">{item.calories}</span>
                      <span className="detail-macro pro">{item.protein}g</span>
                      <span className="detail-macro carb">{item.carbs}g</span>
                      <span className="detail-macro fat">{item.fat}g</span>
                    </div>
                  </div>
                ))}

                {/* Total row */}
                <div className="detail-item total-row">
                  <div className="detail-item-left">
                    <div className="detail-item-name">รวมทั้งหมด</div>
                  </div>
                  <div className="detail-item-macros">
                    <span className="detail-macro cal total">{meal.total_calories}</span>
                    <span className="detail-macro pro total">{Number(meal.total_protein).toFixed(1)}g</span>
                    <span className="detail-macro carb total">{Number(meal.total_carbs).toFixed(1)}g</span>
                    <span className="detail-macro fat total">{Number(meal.total_fat).toFixed(1)}g</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Macro summary chips */}
          <div className="detail-chips">
            <div className="detail-chip" style={{ background: 'var(--color-accent-light)', color: 'var(--color-accent)' }}>
              <span className="detail-chip-value">{meal.total_calories}</span>
              <span className="detail-chip-label">kcal</span>
            </div>
            <div className="detail-chip" style={{ background: 'var(--color-protein-light)', color: 'var(--color-protein)' }}>
              <span className="detail-chip-value">{Number(meal.total_protein).toFixed(1)}g</span>
              <span className="detail-chip-label">โปรตีน</span>
            </div>
            <div className="detail-chip" style={{ background: 'var(--color-carbs-light)', color: 'var(--color-carbs)' }}>
              <span className="detail-chip-value">{Number(meal.total_carbs).toFixed(1)}g</span>
              <span className="detail-chip-label">คาร์บ</span>
            </div>
            <div className="detail-chip" style={{ background: 'var(--color-fat-light)', color: 'var(--color-fat)' }}>
              <span className="detail-chip-value">{Number(meal.total_fat).toFixed(1)}g</span>
              <span className="detail-chip-label">ไขมัน</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
