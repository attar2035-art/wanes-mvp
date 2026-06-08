import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

function VolunteerPage({ user, profile }) {
  const [visits, setVisits] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [cases, setCases] = useState([])
  const [form, setForm] = useState({ patient_id: '', visit_date: '', visit_time: '', notes: '' })
  const [notif, setNotif] = useState('')

  useEffect(() => {
    fetchVisits()
    fetchCases()
  }, [])

  const fetchVisits = async () => {
    const { data } = await supabase
      .from('visits')
      .select(`
        *,
        patient:patient_id (
          display_name,
          place,
          city,
          governorate
        )
      `)
      .eq('volunteer_id', user.uid)
      .order('created_at', { ascending: false })
    setVisits(data || [])
    setLoading(false)
  }

  const fetchCases = async () => {
    const { data } = await supabase
      .from('users')
      .select('id, display_name, city, governorate, place')
      .eq('role', 'مريض')
      .eq('status', 'active')
    setCases(data || [])
  }

  const submitVisit = async () => {
    const { error } = await supabase
      .from('visits')
      .insert({
        volunteer_id: user.uid,
        patient_id: form.patient_id,
        visit_date: form.visit_date,
        visit_time: form.visit_time,
        notes: form.notes,
        status: 'pending',
        created_at: new Date().toISOString()
      })
    if (!error) {
      showNotif('✅ تم إرسال طلب الزيارة! في انتظار موافقة المريض')
      setShowForm(false)
      setForm({ patient_id: '', visit_date: '', visit_time: '', notes: '' })
      fetchVisits()
    }
  }

  const showNotif = (msg) => {
    setNotif(msg)
    setTimeout(() => setNotif(''), 3000)
  }

  const statusStyle = (status) => ({
    pending: { bg: '#fff8e7', color: '#f39c12', label: '⏳ في الانتظار' },
    approved: { bg: '#e8f8f0', color: '#27ae60', label: '✅ مقبولة' },
    rejected: { bg: '#fdecea', color: '#e74c3c', label: '❌ مرفوضة' },
    completed: { bg: '#e8f5f5', color: '#0d7377', label: '✅ مكتملة' },
  }[status] || { bg: '#f0f4f3', color: '#999', label: status })

  return (
    <div>
      {notif && (
        <div style={{
          position: 'fixed', top: 80, left: '50%', transform: 'translateX(-50%)',
          background: '#27ae60', color: 'white', padding: '14px 28px',
          borderRadius: 14, fontWeight: 600, zIndex: 9999
        }}>{notif}</div>
      )}

      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 26, fontWeight: 900 }}>لوحة المتطوع</div>
        <div style={{ color: 'var(--text-light)', fontSize: 14, marginTop: 4 }}>مرحباً {profile?.display_name}، شكراً على تطوعك 💚</div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 28 }}>
        {[
          { num: visits.length, label: 'إجمالي زياراتي', icon: '📋', color: '#e8f5f5' },
          { num: visits.filter(v => v.status === 'pending').length, label: 'في الانتظار', icon: '⏳', color: '#fff8e7' },
          { num: visits.filter(v => v.status === 'completed').length, label: 'مكتملة', icon: '✅', color: '#e8f8f0' },
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

      {/* Visits Table */}
      <div style={{ background: 'white', borderRadius: 16, boxShadow: 'var(--shadow)', border: '1px solid var(--border)', overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 16, fontWeight: 700 }}>زياراتي</div>
          <button onClick={() => setShowForm(true)}
            style={{ padding: '8px 20px', borderRadius: 10, border: 'none', background: 'var(--teal)', color: 'white', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
            + طلب زيارة جديدة
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 48, color: 'var(--text-light)' }}>⏳ جاري التحميل...</div>
        ) : visits.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 48 }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📋</div>
            <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-light)' }}>لا توجد زيارات بعد</div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['الحالة', 'المكان', 'التاريخ', 'الوقت', 'الحالة', 'ملاحظات'].map(h => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'right', fontSize: 12, fontWeight: 700, color: 'var(--text-light)', background: '#f8fafa', borderBottom: '1px solid var(--border)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visits.map(v => {
                  const s = statusStyle(v.status)
                  return (
                    <tr key={v.id} style={{ borderBottom: '1px solid #f0f4f3' }}>
                      <td style={{ padding: '14px 16px', fontWeight: 700 }}>{v.patient?.display_name || 'مستفيد'}</td>
                      <td style={{ padding: '14px 16px', color: 'var(--text-light)', fontSize: 13 }}>{v.patient?.place} - {v.patient?.city}</td>
                      <td style={{ padding: '14px 16px', color: 'var(--text-light)' }}>{v.visit_date || '-'}</td>
                      <td style={{ padding: '14px 16px', color: 'var(--text-light)' }}>{v.visit_time || '-'}</td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{ background: s.bg, color: s.color, padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>{s.label}</span>
                      </td>
                      <td style={{ padding: '14px 16px', color: '#999', fontSize: 13 }}>{v.notes || '-'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
          onClick={() => setShowForm(false)}>
          <div style={{ background: 'white', borderRadius: 20, padding: 32, width: '90%', maxWidth: 480 }}
            onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 20, fontWeight: 900, marginBottom: 20 }}>طلب زيارة جديدة</div>

            {/* Flow */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24 }}>
              {['طلب المتطوع', 'موافقة المريض', 'تأكيد الزيارة'].map((s, i) => (
                <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
                  <div style={{ textAlign: 'center', flex: 1 }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: i === 0 ? 'var(--teal)' : '#e0e0e0', color: i === 0 ? 'white' : '#999', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 4px', fontSize: 14, fontWeight: 700 }}>{i + 1}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-light)' }}>{s}</div>
                  </div>
                  {i < 2 && <div style={{ flex: 1, height: 2, background: '#e0e0e0' }} />}
                </div>
              ))}
            </div>

            {[
              { label: 'اختر الحالة', key: 'patient_id', type: 'select' },
              { label: 'التاريخ', key: 'visit_date', type: 'date' },
              { label: 'الوقت', key: 'visit_time', type: 'time' },
              { label: 'ملاحظات (اختياري)', key: 'notes', type: 'textarea' },
            ].map(f => (
              <div key={f.key} style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 13, fontWeight: 700, display: 'block', marginBottom: 6 }}>{f.label}</label>
                {f.type === 'select' ? (
                  <select
                    style={{ width: '100%', padding: '10px 14px', border: '1.5px solid var(--border)', borderRadius: 10, fontSize: 14 }}
                    value={form[f.key]}
                    onChange={e => setForm({ ...form, [f.key]: e.target.value })}>
                    <option value="">-- اختر --</option>
                    {cases.map(c => <option key={c.id} value={c.id}>{c.display_name || 'مستفيد'} - {c.city}</option>)}
                  </select>
                ) : f.type === 'textarea' ? (
                  <textarea
                    style={{ width: '100%', padding: '10px 14px', border: '1.5px solid var(--border)', borderRadius: 10, fontSize: 14, minHeight: 70, resize: 'vertical' }}
                    value={form[f.key]}
                    onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                  />
                ) : (
                  <input
                    type={f.type}
                    style={{ width: '100%', padding: '10px 14px', border: '1.5px solid var(--border)', borderRadius: 10, fontSize: 14 }}
                    value={form[f.key]}
                    onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                  />
                )}
              </div>
            ))}

            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button onClick={submitVisit}
                disabled={!form.patient_id || !form.visit_date}
                style={{ flex: 1, padding: 12, borderRadius: 12, border: 'none', background: !form.patient_id ? '#ccc' : 'var(--teal)', color: 'white', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                إرسال الطلب
              </button>
              <button onClick={() => setShowForm(false)}
                style={{ flex: 1, padding: 12, borderRadius: 12, border: '1.5px solid var(--border)', background: 'white', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default VolunteerPage
