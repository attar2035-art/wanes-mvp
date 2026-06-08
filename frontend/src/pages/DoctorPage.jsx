import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

function DoctorPage({ user, profile }) {
  const [patients, setPatients] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPatients()
  }, [])

  const fetchPatients = async () => {
    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('role', 'مريض')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
    setPatients(data || [])
    setLoading(false)
  }

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 26, fontWeight: 900 }}>لوحة الطبيب 🩺</div>
        <div style={{ color: 'var(--text-light)', fontSize: 14, marginTop: 4 }}>
          مرحباً {profile?.display_name}
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 28 }}>
        {[
          { num: patients.length, label: 'إجمالي الحالات', icon: '🏥', color: '#e8f5f5' },
          { num: patients.filter(p => p.place_type === 'مستشفى').length, label: 'في المستشفيات', icon: '🏨', color: '#e8f0ff' },
          { num: patients.filter(p => p.place_type === 'دار مسنين').length, label: 'دور المسنين', icon: '🏠', color: '#fff8e7' },
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

      {/* Patients */}
      <div style={{ background: 'white', borderRadius: 16, boxShadow: 'var(--shadow)', border: '1px solid var(--border)', overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontSize: 16, fontWeight: 700 }}>قائمة الحالات</div>
        </div>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 48, color: 'var(--text-light)' }}>⏳ جاري التحميل...</div>
        ) : patients.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 48 }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🏥</div>
            <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-light)' }}>لا توجد حالات حالياً</div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['الاسم', 'الاحتياج', 'المكان', 'المحافظة', 'القصة'].map(h => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'right', fontSize: 12, fontWeight: 700, color: 'var(--text-light)', background: '#f8fafa', borderBottom: '1px solid var(--border)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {patients.map(p => (
                  <tr key={p.id} style={{ borderBottom: '1px solid #f0f4f3' }}>
                    <td style={{ padding: '14px 16px', fontWeight: 700 }}>{p.display_name || 'مستفيد'}</td>
                    <td style={{ padding: '14px 16px', color: 'var(--text-light)' }}>{p.need || '-'}</td>
                    <td style={{ padding: '14px 16px', color: 'var(--text-light)' }}>{p.place || '-'}</td>
                    <td style={{ padding: '14px 16px', color: 'var(--text-light)' }}>{p.governorate} - {p.city}</td>
                    <td style={{ padding: '14px 16px', color: '#999', fontSize: 13, maxWidth: 200 }}>
                      {p.story ? p.story.slice(0, 60) + (p.story.length > 60 ? '...' : '') : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default DoctorPage
