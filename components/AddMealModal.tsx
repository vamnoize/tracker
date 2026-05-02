'use client'

import { useState, useRef, useCallback } from 'react'
import { NutritionAnalysis } from '@/types'
import '@/styles/food.css'

interface AddMealModalProps {
  onClose: () => void
  onSave: (analysis: NutritionAnalysis, imageBase64: string) => Promise<void>
}

// Compress + resize image to max 1024px, JPEG 85% — keeps mobile photos under ~300KB
function compressImage(dataUrl: string, maxPx = 1024, quality = 0.85): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      const scale = Math.min(1, maxPx / Math.max(img.width, img.height))
      const w = Math.round(img.width * scale)
      const h = Math.round(img.height * scale)
      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      canvas.getContext('2d')!.drawImage(img, 0, 0, w, h)
      resolve(canvas.toDataURL('image/jpeg', quality))
    }
    img.src = dataUrl
  })
}

export default function AddMealModal({ onClose, onSave }: AddMealModalProps) {
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [imageBase64, setImageBase64] = useState<string | null>(null)
  const [dragover, setDragover] = useState(false)
  const [compressing, setCompressing] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState<NutritionAnalysis | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('กรุณาเลือกไฟล์รูปภาพเท่านั้น')
      return
    }
    setError(null)
    setAnalysis(null)
    setCompressing(true)

    const reader = new FileReader()
    reader.onload = async (e) => {
      const raw = e.target?.result as string
      const compressed = await compressImage(raw)
      setImagePreview(compressed)
      setImageBase64(compressed)
      setCompressing(false)
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
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? 'Analysis failed')
      }
      setAnalysis(await res.json())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง')
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

  const isLoading = compressing || analyzing

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
              <div className="upload-text">แตะเพื่อถ่ายรูปหรือเลือกรูปอาหาร</div>
              <div className="upload-sub">PNG, JPG, WEBP</div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                style={{ display: 'none' }}
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
              />
            </div>
          ) : (
            <div className="upload-preview">
              <img src={imagePreview} alt="Food preview" />
              {!isLoading && !analysis && (
                <button
                  className="upload-preview-remove"
                  onClick={() => { setImagePreview(null); setImageBase64(null); setAnalysis(null) }}
                >
                  ✕
                </button>
              )}
            </div>
          )}

          {error && (
            <p style={{ color: 'var(--color-danger)', fontSize: '13px', marginTop: '10px' }}>{error}</p>
          )}

          {compressing && (
            <div className="analyzing-state">
              <div className="spinner spinner-dark"></div>
              <span>กำลังประมวลผลรูป...</span>
            </div>
          )}

          {imagePreview && !analysis && !isLoading && (
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
