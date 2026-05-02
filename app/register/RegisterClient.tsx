'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import '@/styles/login.css'

export default function RegisterClient() {
  const supabase = createClient()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password.length < 8) {
      setError('รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร')
      return
    }
    if (password !== confirm) {
      setError('รหัสผ่านไม่ตรงกัน')
      return
    }

    setLoading(true)

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (signUpError) {
      setError(signUpError.message === 'User already registered'
        ? 'อีเมลนี้มีบัญชีอยู่แล้ว กรุณาเข้าสู่ระบบ'
        : 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง')
      setLoading(false)
      return
    }

    // If email confirmation is disabled in Supabase, session exists immediately
    if (data.session) {
      await supabase.from('profiles').upsert({
        id: data.user!.id,
        email,
        name,
      }, { onConflict: 'id', ignoreDuplicates: true })

      window.location.href = '/'
      return
    }

    setDone(true)
    setLoading(false)
  }

  if (done) {
    return (
      <div className="login-page">
        <div className="login-card">
          <div className="login-logo">Health<span>Track</span></div>
          <div className="login-success" style={{ marginTop: '24px' }}>
            <strong>สมัครสมาชิกสำเร็จ!</strong><br />
            กรุณาตรวจสอบอีเมล <strong>{email}</strong><br />
            และคลิกลิงก์เพื่อยืนยันบัญชีของคุณ
          </div>
          <p className="login-switch">
            <Link href="/login">กลับหน้าเข้าสู่ระบบ</Link>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">Health<span>Track</span></div>
        <p className="login-tagline">สร้างบัญชีใหม่</p>

        <form className="login-form" onSubmit={handleRegister}>
          {error && <div className="login-error">{error}</div>}

          <div className="form-group">
            <label className="form-label">ชื่อ</label>
            <input
              type="text"
              className="form-input"
              placeholder="ชื่อของคุณ"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoComplete="name"
            />
          </div>

          <div className="form-group">
            <label className="form-label">อีเมล</label>
            <input
              type="email"
              className="form-input"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label className="form-label">รหัสผ่าน</label>
            <input
              type="password"
              className="form-input"
              placeholder="อย่างน้อย 8 ตัวอักษร"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
            />
          </div>

          <div className="form-group">
            <label className="form-label">ยืนยันรหัสผ่าน</label>
            <input
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              autoComplete="new-password"
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary login-submit"
            disabled={loading}
          >
            {loading ? <><span className="spinner"></span> กำลังสมัคร...</> : 'สมัครสมาชิก'}
          </button>
        </form>

        <p className="login-switch">
          มีบัญชีอยู่แล้ว?{' '}
          <Link href="/login">เข้าสู่ระบบ</Link>
        </p>
      </div>
    </div>
  )
}
