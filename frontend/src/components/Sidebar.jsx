import { useNavigate, useLocation } from 'react-router-dom'

function Sidebar({ profile }) {
  const navigate = useNavigate()
  const location = useLocation()

  const getItems = () => {
    const base = [
      { path: '/map', icon: '🗺️', label: 'الخريطة' }
    ]

    if (profile?.role === 'أدمن') return [
      ...base,
      { path: '/admin', icon: '⚙️', label: 'لوحة الإدارة' },
      { path: '/profile', icon: '👤', label: 'بروفايلي' },
    ]

    if (profile?.role === 'متطوع') return [
      ...base,
      { path: '/volunteer', icon: '📋', label: 'زياراتي' },
      { path: '/profile', icon: '👤', label: 'بروفايلي' },
    ]

    if (profile?.role === 'مريض') return [
      ...base,
      { path: '/patient', icon: '📬', label: 'طلبات الزيارة' },
      { path: '/profile', icon: '👤', label: 'بروفايلي' },
    ]

    if (profile?.role === 'طبيب') return [
      ...base,
      { path: '/doctor', icon: '🩺', label: 'حالاتي' },
      { path: '/profile', icon: '👤', label: 'بروفايلي' },
    ]

    return base
  }

  return (
    <aside style={{
      width: 240,
      background: 'white',
      borderLeft: '1px solid var(--border)',
      padding: '24px 0',
      minHeight: 'calc(100vh - 64px)',
      display: 'flex',
      flexDirection: 'column',
      gap: 4
    }}>
      <div style={{ padding: '8px 16px 4px', fontSize: 11, fontWeight: 700, color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: 1 }}>
        القائمة
      </div>

      {getItems().map(item => (
        <div
          key={item.path}
          onClick={() => navigate(item.path)}
          style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '12px 20px',
            color: location.pathname === item.path ? 'var(--teal)' : 'var(--text-light)',
            cursor: 'pointer',
            fontSize: 14, fontWeight: 600,
            background: location.pathname === item.path ? 'linear-gradient(135deg, #e8f5f5, #d4edec)' : 'transparent',
            borderRight: location.pathname === item.path ? '3px solid var(--teal)' : '3px solid transparent',
            margin: '0 8px',
            borderRadius: 10,
            transition: 'all 0.2s'
          }}
          onMouseEnter={e => { if (location.pathname !== item.path) e.currentTarget.style.background = '#f0f9f8' }}
          onMouseLeave={e => { if (location.pathname !== item.path) e.currentTarget.style.background = 'transparent' }}
        >
          <span style={{ fontSize: 18, width: 24, textAlign: 'center' }}>{item.icon}</span>
          {item.label}
        </div>
      ))}

      <div style={{ marginTop: 'auto', padding: '16px 20px', borderTop: '1px solid var(--border)', fontSize: 11, color: '#999', textAlign: 'center' }}>
        وانس • {new Date().getFullYear()}<br />wanes.org
      </div>
    </aside>
  )
}

export default Sidebar
