'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Profile } from '@/types'
import '@/styles/profile.css'

interface ProfileClientProps {
  profile: Profile | null
}

export default function ProfileClient({ profile }: ProfileClientProps) {
  const router = useRouter()
  const supabase = createClient()

  const [calLimit, setCalLimit] = useState(profile?.daily_calorie_limit ?? 2000)
  const [protLimit, setProtLimit] = useState(profile?.daily_protein_limit ?? 50)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile) return
    setSaving(true)
    setSaved(false)

    await supabase
      .from('profiles')
      .update({
        daily_calorie_limit: calLimit,
        daily_protein_limit: protLimit,
        updated_at: new Date().toISOString(),
      })
      .eq('id', profile.id)

    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
    router.refresh()
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="page-content">
      <div className="container">
        <div className="profile-header">
          <h1 className="page-title">โปรไฟล์</h1>
        </div>

        <div className="profile-user-card">
          <div className="profile-avatar">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt={profile.name ?? 'Avatar'} />
            ) : (
              <div className="profile-avatar-placeholder">
                {profile?.name?.charAt(0)?.toUpperCase() ?? 'U'}
              </div>
            )}
          </div>
          <div>
            <div className="profile-user-name">{profile?.name ?? 'ผู้ใช้งาน'}</div>
            <div className="profile-user-email">{profile?.email}</div>
          </div>
        </div>

        <form onSubmit={handleSave}>
          <div className="profile-settings-card">
            <div className="profile-settings-title">ตั้งค่าเป้าหมายรายวัน</div>

            <div className="profile-form-grid">
              <div className="form-group">
                <label className="form-label">แคลอรีต่อวัน (kcal)</label>
                <input
                  type="number"
                  className="form-input"
                  value={calLimit}
                  min={500}
                  max={5000}
                  step={50}
                  onChange={(e) => setCalLimit(Number(e.target.value))}
                />
                <p className="profile-hint">ค่าแนะนำ: 1,500–2,500 kcal/วัน</p>
              </div>

              <div className="form-group">
                <label className="form-label">โปรตีนต่อวัน (g)</label>
                <input
                  type="number"
                  className="form-input"
                  value={protLimit}
                  min={20}
                  max={300}
                  step={5}
                  onChange={(e) => setProtLimit(Number(e.target.value))}
                />
                <p className="profile-hint">ค่าแนะนำ: 0.8–2.0g × น้ำหนักตัว (kg)</p>
              </div>
            </div>

            <div className="profile-limits-preview">
              <div className="limit-preview-item cal">
                <div className="limit-preview-value">{calLimit.toLocaleString()}</div>
                <div className="limit-preview-label">kcal / วัน</div>
              </div>
              <div className="limit-preview-item prot">
                <div className="limit-preview-value">{protLimit}</div>
                <div className="limit-preview-label">g โปรตีน / วัน</div>
              </div>
            </div>

            <div className="divider" />

            <div className="profile-form-actions">
              {saved && (
                <span className="save-success">✓ บันทึกเรียบร้อย</span>
              )}
              <button
                type="submit"
                className="btn btn-primary"
                disabled={saving}
              >
                {saving ? <><span className="spinner"></span> กำลังบันทึก...</> : 'บันทึกการตั้งค่า'}
              </button>
            </div>
          </div>
        </form>

        <div className="sign-out-section">
          <div>
            <div className="sign-out-text">ออกจากระบบ</div>
            <div className="sign-out-sub">ออกจากบัญชี Google ของคุณ</div>
          </div>
          <button className="btn btn-danger" onClick={handleSignOut}>
            ออกจากระบบ
          </button>
        </div>
      </div>
    </div>
  )
}
