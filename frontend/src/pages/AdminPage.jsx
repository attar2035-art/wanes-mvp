import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

function AdminPage({ user, profile }) {
  const [tab, setTab] = useState('overview')
  const [users, setUsers] = useState([])
  const [visits, setVisits] = useState([])
  const [loading, setLoading] = useState(true)
  const [notif, setNotif] = useState('')

  useEffect(() => {
    fetchUsers()
    fetchVisits()
  }, [])

  const fetchUsers = async () => {
    const { data } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })
    setUsers(data || [])
    setLoading(false)
  }

  const fetchVisits = async () => {
    const { data } = await supabase
      .from('visits')
      .select(`
        *,
        volunteer:volunteer_id (display_name),
        patient:patient_id (display_name, place, city)
      `)
      .order('created_at', { ascending: false })
    setVisits(data || [])
  }

  const approveUser = async (id) => {
    await supabase.from('users').update({ status: 'active' }).eq('id', id)
    setUsers(users.map(u => u.id === id ? { ...u, status: 'active' } : u))
    showNotif('✅ تم تفعيل الحساب')
  }

  const rejectUser = async (id) => {
    await supabase.from('users').update({ status: 'rejected' }).eq('id', id)
    setUsers(users.map(u => u.id === id ? { ...u, status: 'rejected' } : u))
    showNotif('❌ تم رفض الحساب')
  }

  const showNotif = (msg) => {
    setNotif(msg)
    setTimeout(() => setNotif(''), 3000)
  }

  const pending = users.filter(u => u.status === 'pending')
  const patients = users.filter(u => u.role === 'مريض')
  const volunteers = users.filter(u => u.role === 'متطوع')
  const doctors = users.filter(u => u.role === 'طبيب')

  const tabs = [
    { id: 'overview', icon: '📊', label: 'نظرة عامة' },
    { id: 'users', icon: '👥', label: 'المستخدمون', badge: pending.length },
    { id: 'patients', icon: '🏥', label: 'المرضى' },
    { id: 'visits', icon: '📋', label: 'الزيارات' },
  ]

  const roleColors = { 'أدمن': '#e74c3c', 'طبيب': '#2980b9', 'متطوع': '#27ae60', 'مريض': '#8e44ad' }
  const statusStyle = (status) => ({
    active: { bg: '#e8f8f0', color: '#27ae60', label: '✅ مفعّل' },
    pending: { bg: '#fff8e7', color: '#f39c12', label: '⏳ معلق' },
    rejected: { bg: '#fdecea', color: '#e74c3c', label: '❌ مرفوض' },
  }[status] || { bg: '#f0f4f3', color: '#999', label: status })

  return (
    <div>
      {notif && (
        <div style={{
          position: 'fixed', top: 80, left: '50%', transform: 'translateX(-50%)',
          background: notif.includes('✅') ? '#27ae60' : '#e74c3c',
          color: 'white', padding: '14px 28px', borderRadius: 14,
          fontWeight: 600, zIndex: 9999
        }}>{notif}</div>
      )}

      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 26, fontWeight: 900 }}>لوحة الإدارة ⚙️</div>
        <div style={{ color: 'var(--text-light)', fontSize: 14, marginTop: 4 }}>إدارة شاملة لمنصة وانس</div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, background: '#f0f4f3', borderRadius: 12, padding: 4, marginBottom: 24 }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{
              flex: 1, padding: 10, borderRadius: 10, border: 'none',
              background: tab === t.id ? 'white' : 'transparent',
              color: tab === t.id ? 'var(--teal)' : 'var(--text-light)',
              fontSize: 13, fontWeight: 700, cursor: 'pointer',
              boxShadow: tab === t.id ? 'var(--shadow)' : 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
            }}>
            {t.icon} {t.label}
            {t.badge > 0 && (
              <span style={{ background: '#e74c3c', color: 'white', borderRadius: 12, padding: '2px 7px', fontSize: 11 }}>{t.badge}</span>
            )}
          </button>
        ))}
      </div>

      {/* Overview */}
      {tab === 'overview' && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
            {[
              { num: patients.length, label: 'المرضى', icon: '🏥', color: '#e8f5f5' },
              { num: volunteers.length, label: 'المتطوعون', icon: '🤝', color: '#e8f8f0' },
              { num: doctors.length, label: 'الأطباء', icon: '🩺', color: '#e8f0ff' },
              { num: pending.length, label: 'طلبات معلقة', icon: '⏳', color: '#fdecea' },
            ].map((s, i) => (
              <div key={i} style={{ background: 'white', borderRadius: 16, padding: '20px 24px', boxShadow: 'var(--shadow)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ width: 52, height: 52, borderRadius: 14, background: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>{s.icon}</div>
                <div>
                  <div style={{ fontSize: 28, fontWeight: 900 }}>{s.num}</div>
                  <div style={{ fontSize: 13, color: 'var(--text-light)' }}>{s.label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Pending approvals */}
          {pending.length > 0 && (
            <div style={{ background: 'white', borderRadius: 16, boxShadow: 'var(--shadow)', border: '1px solid var(--border)', overflow: 'hidden' }}>
              <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)' }}>
                <div style={{ fontSize: 16, fontWeight: 700 }}>⚠️ طلبات تحتاج موافقة</div>
              </div>
              <div style={{ padding: 24 }}>
                {pending.map(u => (
                  <div key={u.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #f0f4f3' }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>{u.display_name || 'مستخدم'}</div>
                      <div style={{ fontSize: 12, color: '#999' }}>{u.role} • {u.phone} • {new Date(u.created_at).toLocaleDateString('ar')}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => approveUser(u.id)}
                        style={{ padding: '6px 16px', borderRadius: 8, border: 'none', background: '#e8f8f0', color: '#27ae60', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                        قبول
                      </button>
                      <button onClick={() => rejectUser(u.id)}
                        style={{ padding: '6px 16px', borderRadius: 8, border: 'none', background: '#fdecea', color: '#e74c3c', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                        رفض
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Users */}
      {tab === 'users' && (
        <div style={{ background: 'white', borderRadius: 16, boxShadow: 'var(--shadow)', border: '1px solid var(--border)', overflow: 'hidden' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: 16, fontWeight: 700 }}>إدارة المستخدمين</div>
            {pending.length > 0 && <span style={{ background: '#e74c3c', color: 'white', borderRadius: 12, padding: '3px 10px', fontSize: 12, fontWeight: 700 }}>{pending.length} معلق</span>}
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['الاسم', 'الهاتف', 'الدور', 'الحالة', 'تاريخ التسجيل', 'الإجراء'].map(h => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'right', fontSize: 12, fontWeight: 700, color: 'var(--text-light)', background: '#f8fafa', borderBottom: '1px solid var(--border)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map(u => {
                  const s = statusStyle(u.status)
                  return (
                    <tr key={u.id} style={{ borderBottom: '1px solid #f0f4f3' }}>
                      <td style={{ padding: '14px 16px', fontWeight: 700 }}>{u.display_name || 'مستخدم'}</td>
                      <td style={{ padding: '14px 16px', color: 'var(--text-light)', fontSize: 13 }}>{u.phone}</td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{ background: (roleColors[u.role] || '#999') + '20', color: roleColors[u.role] || '#999', padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>{u.role}</span>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{ background: s.bg, color: s.color, padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>{s.label}</span>
                      </td>
                      <td style={{ padding: '14px 16px', color: 'var(--text-light)', fontSize: 13 }}>{new Date(u.created_at).toLocaleDateString('ar')}</td>
                      <td style={{ padding: '14px 16px' }}>
                        {u.status === 'pending' && (
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button onClick={() => approveUser(u.id)}
                              style={{ padding: '5px 12px', borderRadius: 8, border: 'none', background: '#e8f8f0', color: '#27ae60', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>قبول</button>
                            <button onClick={() => rejectUser(u.id)}
                              style={{ padding: '5px 12px', borderRadius: 8, border: 'none', background: '#fdecea', color: '#e74c3c', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>رفض</button>
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Patients */}
      {tab === 'patients' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {patients.map(p => (
            <div key={p.id} style={{ background: 'white', borderRadius: 16, padding: 20, boxShadow: 'var(--shadow)', border: '1px solid var(--border)' }}>
              <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 8 }}>{p.display_name || 'مستفيد'}</div>
              <div style={{ fontSize: 13, color: 'var(--text-light)', marginBottom: 4 }}>📍 {p.governorate} - {p.city}</div>
              <div style={{ fontSize: 13, color: 'var(--text-light)', marginBottom: 4 }}>🏥 {p.place}</div>
              {p.story && <div style={{ fontSize: 13, color: 'var(--text)', marginTop: 10, padding: 10, background: '#f8fafa', borderRadius: 10, lineHeight: 1.7 }}>"{p.story}"</div>}
            </div>
          ))}
        </div>
      )}

      {/* Visits */}
      {tab === 'visits' && (
        <div style={{ background: 'white', borderRadius: 16, boxShadow: 'var(--shadow)', border: '1px solid var(--border)', overflow: 'hidden' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ fontSize: 16, fontWeight: 700 }}>متابعة الزيارات</div>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['المتطوع', 'المريض', 'المكان', 'التاريخ', 'الحالة'].map(h => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'right', fontSize: 12, fontWeight: 700, color: 'var(--text-light)', background: '#f8fafa', borderBottom: '1px solid var(--border)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visits.map(v => {
                  const s = ({
                    pending: { bg: '#fff8e7', color: '#f39c12', label: '⏳ معلقة' },
                    approved: { bg: '#e8f8f0', color: '#27ae60', label: '✅ مقبولة' },
                    completed: { bg: '#e8f5f5', color: '#0d7377', label: '✅ مكتملة' },
                    rejected: { bg: '#fdecea', color: '#e74c3c', label: '❌ مرفوضة' },
                  }[v.status] || { bg: '#f0f4f3', color: '#999', label: v.status })
                  return (
                    <tr key={v.id} style={{ borderBottom: '1px solid #f0f4f3' }}>
                      <td style={{ padding: '14px 16px', fontWeight: 700 }}>{v.volunteer?.display_name || '-'}</td>
                      <td style={{ padding: '14px 16px' }}>{v.patient?.display_name || '-'}</td>
                      <td style={{ padding: '14px 16px', color: 'var(--text-light)', fontSize: 13 }}>{v.patient?.place} - {v.patient?.city}</td>
                      <td style={{ padding: '14px 16px', color: 'var(--text-light)' }}>{v.visit_date || '-'}</td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{ background: s.bg, color: s.color, padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>{s.label}</span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminPage
