import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { signOut } from 'firebase/auth'
import { auth } from '../firebase'

function Navbar({ user, profile }) {
  const navigate = useNavigate()
  const [showMenu, setShowMenu] = useState(false)

  const handleLogout = async () => {
    await signOut(auth)
    navigate('/')
  }

  return (
    <nav style={{
      background: 'linear-gradient(135deg, var(--teal-dark) 0%, var(--teal) 60%, var(--teal-light) 100%)',
      padding: '0 32px',
      height: 64,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      boxShadow: '0 2px 20px rgba(13,115,119,0.3)'
    }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }} onClick={() => navigate('/')}>
        <div style={{
          width: 40, height: 40,
          background: 'var(--gold)',
          borderRadius: 12,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 20
        }}>🤝</div>
        <div>
          <div style={{ color: 'white', fontSize: 22, fontWeight: 900 }}>وانس</div>
          <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11 }}>wanes.org</div>
        </div>
      </div>

      {/* User */}
      <div style={{ position: 'relative' }}>
        <div
          onClick={() => setShowMenu(!showMenu)}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: 'rgba(255,255,255,0.15)',
            border: '1px solid rgba(255,255,255,0.25)',
            borderRadius: 25, padding: '6px 16px 6px 8px',
            color: 'white', cursor: 'pointer'
          }}>
          <div style={{
            width: 30, height: 30, borderRadius: '50%',
            background: 'var(--gold)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 14, color: 'var(--teal-dark)', fontWeight: 700
          }}>
            {profile?.display_name?.[0] || '👤'}
          </div>
          <span style={{ fontSize: 13, fontWeight: 600 }}>
            {profile?.display_name || 'مستخدم'}
          </span>
          <span style={{ fontSize: 11, opacity: 0.7 }}>{profile?.role}</span>
        </div>

        {showMenu && (
          <div style={{
            position: 'absolute', top: 44, left: 0,
            background: 'white', borderRadius: 12,
            boxShadow: 'var(--shadow-hover)',
            overflow: 'hidden', minWidth: 160,
            border: '1px solid var(--border)'
          }}>
            <div onClick={() => { navigate('/profile'); setShowMenu(false) }}
              style={{ padding: '12px 16px', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}
              onMouseEnter={e => e.target.style.background = '#f0f9f8'}
              onMouseLeave={e => e.target.style.background = 'white'}>
              👤 بروفايلي
            </div>
            <div onClick={handleLogout}
              style={{ padding: '12px 16px', cursor: 'pointer', fontSize: 14, fontWeight: 600, color: '#e74c3c' }}
              onMouseEnter={e => e.target.style.background = '#fdecea'}
              onMouseLeave={e => e.target.style.background = 'white'}>
              🚪 تسجيل الخروج
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}

export default Navbar
