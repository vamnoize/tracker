'use client'

import { useState, useRef, useCallback } from 'react'
import { NutritionAnalysis } from '@/types'
import '@/styles/food.css'

interface AddMealModalProps {
  onClose: () => void
  onSave: (analysis: NutritionAnalysis, imageBase64: string) => Promise<void>
}

export default function AddMealModal({ onClose, onSave }: AddMealModalProps) {
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [imageBase64, setImageBase64] = useState<string | null>(null)
  const [dragover, setDragover] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState<NutritionAnalysis | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('กรุณาเลือกไฟล์รูปภาพเท่านั้น')
      return
    }
    const reader = new FileReader()
    reader.onload = (e) => {
      const result = e.target?.result as string
      setImagePreview(result)
      setImageBase64(result)
      setAnalysis(null)
      setError(null)
    }
    reader.readAsDataURL(file)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragover(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }, [handleFile])

  const handleAnalyze = async () => {
    if (!imageBase64) return
    setError(null)
    setAnalyzing(true)

    try {
      const res = await fetch('/api/analyze-food', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64 }),
      })
      if (!res.ok) throw new Error('Analysis failed')
      setAnalysis(await res.json())
    } catch {
      setError('เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง')
    } finally {
      setAnalyzing(false)
    }
  }

  const handleSave = async () => {
    if (!analysis || !imageBase64) return
    setSaving(true)
    try {
      await onSave(analysis, imageBase64)
      onClose()
    } catch {
      setError('บันทึกไม่สำเร็จ กรุณาลองใหม่')
      setSaving(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2 className="modal-title">เพิ่มมื้ออาหาร</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          {!imagePreview ? (
            <div
              className={`upload-area ${dragover ? 'dragover' : ''}`}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragover(true) }}
              onDragLeave={() => setDragover(false)}
              onDrop={handleDrop}
            >
              <div className="upload-icon">📷</div>
              <div className="upload-text">คลิกหรือลากรูปอาหารมาวางที่นี่</div>
              <div className="upload-sub">PNG, JPG, WEBP</div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
              />
            </div>
          ) : (
            <div className="upload-preview">
              <img src={imagePreview} alt="Food preview" />
              <button
                className="upload-preview-remove"
                onClick={() => { setImagePreview(null); setImageBase64(null); setAnalysis(null) }}
              >
                ✕
              </button>
            </div>
          )}

          {error && (
            <p style={{ color: 'var(--color-danger)', fontSize: '13px', marginTop: '10px' }}>{error}</p>
          )}

          {imagePreview && !analysis && !analyzing && (
            <button
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '14px', justifyContent: 'center' }}
              onClick={handleAnalyze}
            >
              วิเคราะห์สารอาหารด้วย AI
            </button>
          )}

          {analyzing && (
            <div className="analyzing-state">
              <div className="spinner spinner-dark"></div>
              <span>AI กำลังวิเคราะห์อาหาร...</span>
            </div>
          )}

          {analysis && (
            <div className="analysis-result">
              <div className="analysis-result-title">ผลการวิเคราะห์</div>

              {analysis.food_items.map((item, i) => (
                <div key={i} className="analysis-food-item">
                  <div>
                    <div className="analysis-food-name">{item.name}</div>
                    <div className="analysis-food-portion">{item.portion}</div>
                  </div>
                  <div className="analysis-food-macros">
                    <span style={{ color: 'var(--color-accent)', fontWeight: 600 }}>{item.calories} kcal</span>
                    <span style={{ color: 'var(--color-protein)' }}>P {item.protein}g</span>
                    <span style={{ color: 'var(--color-carbs)' }}>C {item.carbs}g</span>
                    <span style={{ color: 'var(--color-fat)' }}>F {item.fat}g</span>
                  </div>
                </div>
              ))}

              <div className="analysis-total">
                <span className="analysis-total-label">รวมทั้งหมด</span>
                <div className="analysis-total-values">
                  <span style={{ color: 'var(--color-accent)' }}>{analysis.total_calories} kcal</span>
                  <span style={{ color: 'var(--color-protein)' }}>P {analysis.total_protein}g</span>
                  <span style={{ color: 'var(--color-carbs)' }}>C {analysis.total_carbs}g</span>
                  <span style={{ color: 'var(--color-fat)' }}>F {analysis.total_fat}g</span>
                </div>
              </div>

              {analysis.analysis_text && (
                <p className="analysis-text">{analysis.analysis_text}</p>
              )}

              <button
                className="btn btn-primary btn-lg"
                style={{ width: '100%', marginTop: '16px', justifyContent: 'center' }}
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? <><span className="spinner"></span> กำลังบันทึก...</> : 'บันทึกมื้ออาหาร'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
