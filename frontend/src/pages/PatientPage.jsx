import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

function PatientPage({ user, profile }) {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [notif, setNotif] = useState('')

  useEffect(() => {
    fetchRequests()
  }, [])

  const fetchRequests = async () => {
    const { data } = await supabase
      .from('visits')
      .select(`
        *,
        volunteer:volunteer_id (
          display_name,
          phone
        )
      `)
      .eq('patient_id', profile.id)
      .order('created_at', { ascending: false })
    setRequests(data || [])
    setLoading(false)
  }

  const respond = async (id, action) => {
    const { error } = await supabase
      .from('visits')
      .update({ status: action, updated_at: new Date().toISOString() })
      .eq('id', id)
    if (!error) {
      setRequests(requests.map(r => r.id === id ? { ...r, status: action } : r))
      showNotif(action === 'approved' ? '✅ تم قبول طلب الزيارة' : '❌ تم رفض طلب الزيارة')
    }
  }

  const showNotif = (msg) => {
    setNotif(msg)
    setTimeout(() => setNotif(''), 3000)
  }

  const statusStyle = (status) => ({
    approved: { bg: '#e8f8f0', color: '#27ae60', label: '✅ مقبولة' },
    rejected: { bg: '#fdecea', color: '#e74c3c', label: '❌ مرفوضة' },
    pending: { bg: '#fff8e7', color: '#f39c12', label: '⏳ في الانتظار' },
    completed: { bg: '#e8f5f5', color: '#0d7377', label: '✅ مكتملة' },
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
        <div style={{ fontSize: 26, fontWeight: 900 }}>لوحة المريض / المستفيد</div>
        <div style={{ color: 'var(--text-light)', fontSize: 14, marginTop: 4 }}>مرحباً {profile?.display_name || 'مستفيد'}</div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 28 }}>
        {[
          { num: requests.filter(r => r.status === 'pending').length, label: 'طلبات معلقة', icon: '⏳', color: '#fff8e7' },
          { num: requests.filter(r => r.status === 'approved').length, label: 'زيارات مقبولة', icon: '✅', color: '#e8f8f0' },
          { num: requests.filter(r => r.status === 'completed').length, label: 'زيارات مكتملة', icon: '🎉', color: '#e8f5f5' },
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

      {/* Requests */}
      <div style={{ background: 'white', borderRadius: 16, boxShadow: 'var(--shadow)', border: '1px solid var(--border)', overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontSize: 16, fontWeight: 700 }}>طلبات الزيارة الواردة</div>
        </div>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 48, color: 'var(--text-light)' }}>⏳ جاري التحميل...</div>
        ) : requests.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 48 }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📭</div>
            <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-light)' }}>لا توجد طلبات حالياً</div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['المتطوع', 'التاريخ', 'الموعد', 'الحالة', 'الإجراء'].map(h => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'right', fontSize: 12, fontWeight: 700, color: 'var(--text-light)', background: '#f8fafa', borderBottom: '1px solid var(--border)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {requests.map(r => {
                  const s = statusStyle(r.status)
                  return (
                    <tr key={r.id} style={{ borderBottom: '1px solid #f0f4f3' }}>
                      <td style={{ padding: '14px 16px', fontWeight: 700 }}>👤 {r.volunteer?.display_name || 'متطوع'}</td>
                      <td style={{ padding: '14px 16px', color: 'var(--text-light)' }}>{r.visit_date || '-'}</td>
                      <td style={{ padding: '14px 16px', color: 'var(--text-light)' }}>{r.visit_time || '-'}</td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{ background: s.bg, color: s.color, padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>{s.label}</span>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        {r.status === 'pending' && (
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button onClick={() => respond(r.id, 'approved')}
                              style={{ padding: '6px 14px', borderRadius: 8, border: 'none', background: '#e8f8f0', color: '#27ae60', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                              قبول
                            </button>
                            <button onClick={() => respond(r.id, 'rejected')}
                              style={{ padding: '6px 14px', borderRadius: 8, border: 'none', background: '#fdecea', color: '#e74c3c', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                              رفض
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default PatientPage
