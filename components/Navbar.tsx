'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Profile } from '@/types'
import '@/styles/navbar.css'

interface NavbarProps {
  profile: Profile | null
}

const navItems = [
  { href: '/', label: 'Dashboard', icon: '📊' },
  { href: '/food', label: 'Food', icon: '🍽️' },
  { href: '/profile', label: 'Profile', icon: '👤' },
]

export default function Navbar({ profile }: NavbarProps) {
  const pathname = usePathname()

  return (
    <>
      {/* Top bar */}
      <nav className="navbar">
        <div className="navbar-inner">
          <Link href="/" className="navbar-logo">
            Health<span>Track</span>
          </Link>

          {/* Desktop nav links */}
          <div className="navbar-nav">
            <Link href="/" className={`navbar-link ${pathname === '/' ? 'active' : ''}`}>
              Dashboard
            </Link>
            <Link href="/food" className={`navbar-link ${pathname === '/food' ? 'active' : ''}`}>
              Food
            </Link>
          </div>

          <div className="navbar-right">
            <Link href="/profile" className="navbar-avatar" title="Profile">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt={profile.name ?? 'Profile'} />
              ) : (
                <div className="navbar-avatar-placeholder">
                  {profile?.name?.charAt(0)?.toUpperCase() ?? 'U'}
                </div>
              )}
            </Link>
          </div>
        </div>
      </nav>

      {/* Bottom nav (mobile only) */}
      <nav className="bottom-nav">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`bottom-nav-item ${pathname === item.href ? 'active' : ''}`}
          >
            <span className="bottom-nav-icon">{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>
    </>
  )
}
