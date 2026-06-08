import { useState } from 'react'
import { supabase } from '../supabase'

const governorates = ["القاهرة", "الجيزة", "الإسكندرية", "الدقهلية", "الشرقية", "المنوفية", "البحيرة", "الإسماعيلية", "الغربية", "المنيا", "أسيوط", "سوهاج", "قنا", "الأقصر", "أسوان", "بورسعيد", "السويس", "دمياط", "الفيوم", "بني سويف", "كفر الشيخ", "مطروح", "الوادي الجديد", "شمال سيناء", "جنوب سيناء", "البحر الأحمر", "قليوبية"]

function ProfilePage({ user, profile, setProfile }) {
  const [form, setForm] = useState({
    display_name: profile?.display_name || '',
    story: profile?.story || '',
    need: profile?.need || '',
    governorate: profile?.governorate || '',
    city: profile?.city || '',
    place: profile?.place || '',
    place_type: profile?.place_type || '',
  })
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)

  const handleSave = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('users')
      .update(form)
      .eq('id', profile.id)
      .select()
      .single()

    if (!error) {
      setProfile(data)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    }
    setLoading(false)
  }

  const roleColors = {
    'أدمن': '#e74c3c',
    'طبيب': '#2980b9',
    'متطوع': '#27ae60',
    'مريض': '#8e44ad'
  }

  return (
    <div>
      {saved && (
        <div style={{
          position: 'fixed', top: 80, left: '50%', transform: 'translateX(-50%)',
          background: '#27ae60', color: 'white', padding: '14px 28px',
          borderRadius: 14, fontWeight: 600, zIndex: 9999
        }}>✅ تم حفظ التغييرات</div>
      )}

      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 26, fontWeight: 900 }}>بروفايلي 👤</div>
        <div style={{ color: 'var(--text-light)', fontSize: 14, marginTop: 4 }}>إدارة بياناتك الشخصية</div>
      </div>

      {/* Profile Header */}
      <div style={{
        background: 'linear-gradient(135deg, var(--teal-dark), var(--teal-light))',
        borderRadius: 16, padding: 32, color: 'white',
        display: 'flex', alignItems: 'center', gap: 20, marginBottom: 24
      }}>
        <div style={{
          width: 80, height: 80, borderRadius: '50%',
          background: 'rgba(255,255,255,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 32, border: '3px solid rgba(255,255,255,0.4)'
        }}>
          {profile?.display_name?.[0] || '👤'}
        </div>
        <div>
          <div style={{ fontSize: 22, fontWeight: 900 }}>
            {profile?.display_name || 'مستخدم'}
          </div>
          <div style={{ opacity: 0.8, fontSize: 14, marginTop: 4 }}>
            {profile?.phone}
          </div>
          <span style={{
            display: 'inline-block', marginTop: 8,
            background: 'rgba(255,255,255,0.2)',
            padding: '4px 14px', borderRadius: 20, fontSize: 13, fontWeight: 700
          }}>
            {profile?.role}
          </span>
        </div>
      </div>

      {/* Form */}
      <div style={{ background: 'white', borderRadius: 16, boxShadow: 'var(--shadow)', border: '1px solid var(--border)', overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontSize: 16, fontWeight: 700 }}>تعديل البيانات</div>
        </div>
        <div style={{ padding: 24 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

            <div style={{ gridColumn: '1/-1' }}>
              <label style={{ fontSize: 13, fontWeight: 700, display: 'block', marginBottom: 6 }}>الاسم المعروض</label>
              <input
                style={{ width: '100%', padding: '10px 14px', border: '1.5px solid var(--border)', borderRadius: 10, fontSize: 14 }}
                value={form.display_name}
                onChange={e => setForm({ ...form, display_name: e.target.value })}
                placeholder="اسمك أو اسم مستعار"
              />
            </div>

            {profile?.role === 'مريض' && (
              <>
                <div style={{ gridColumn: '1/-1' }}>
                  <label style={{ fontSize: 13, fontWeight: 700, display: 'block', marginBottom: 6 }}>قصتك واحتياجك ✍️</label>
                  <textarea
                    style={{ width: '100%', padding: '10px 14px', border: '1.5px solid var(--border)', borderRadius: 10, fontSize: 14, minHeight: 100, resize: 'vertical' }}
                    value={form.story}
                    onChange={e => setForm({ ...form, story: e.target.value })}
                    placeholder="اكتب قصتك واحتياجك..."
                  />
                </div>

                <div style={{ gridColumn: '1/-1' }}>
                  <label style={{ fontSize: 13, fontWeight: 700, display: 'block', marginBottom: 6 }}>نوع الاحتياج</label>
                  <input
                    style={{ width: '100%', padding: '10px 14px', border: '1.5px solid var(--border)', borderRadius: 10, fontSize: 14 }}
                    value={form.need}
                    onChange={e => setForm({ ...form, need: e.target.value })}
                    placeholder="مثال: رعاية مسنين، دعم نفسي..."
                  />
                </div>

                <div>
                  <label style={{ fontSize: 13, fontWeight: 700, display: 'block', marginBottom: 6 }}>المحافظة</label>
                  <select
                    style={{ width: '100%', padding: '10px 14px', border: '1.5px solid var(--border)', borderRadius: 10, fontSize: 14 }}
                    value={form.governorate}
                    onChange={e => setForm({ ...form, governorate: e.target.value })}>
                    <option value="">-- اختر --</option>
                    {governorates.map(g => <option key={g}>{g}</option>)}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: 13, fontWeight: 700, display: 'block', marginBottom: 6 }}>المدينة</label>
                  <input
                    style={{ width: '100%', padding: '10px 14px', border: '1.5px solid var(--border)', borderRadius: 10, fontSize: 14 }}
                    value={form.city}
                    onChange={e => setForm({ ...form, city: e.target.value })}
                    placeholder="مثال: مدينة نصر"
                  />
                </div>

                <div>
                  <label style={{ fontSize: 13, fontWeight: 700, display: 'block', marginBottom: 6 }}>نوع المكان</label>
                  <select
                    style={{ width: '100%', padding: '10px 14px', border: '1.5px solid var(--border)', borderRadius: 10, fontSize: 14 }}
                    value={form.place_type}
                    onChange={e => setForm({ ...form, place_type: e.target.value })}>
                    <option value="">-- اختر --</option>
                    {['مستشفى', 'دار مسنين', 'دار أيتام', 'مركز رعاية', 'جهة خيرية', 'منزل'].map(p => <option key={p}>{p}</option>)}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: 13, fontWeight: 700, display: 'block', marginBottom: 6 }}>اسم المكان</label>
                  <input
                    style={{ width: '100%', padding: '10px 14px', border: '1.5px solid var(--border)', borderRadius: 10, fontSize: 14 }}
                    value={form.place}
                    onChange={e => setForm({ ...form, place: e.target.value })}
                    placeholder="مثال: مستشفى النيل"
                  />
                </div>
              </>
            )}
          </div>

          <button
            onClick={handleSave}
            disabled={loading}
            style={{
              marginTop: 24, padding: '12px 32px', borderRadius: 12,
              border: 'none', background: 'var(--teal)', color: 'white',
              fontSize: 15, fontWeight: 700, cursor: 'pointer'
            }}>
            {loading ? '⏳ جاري الحفظ...' : '💾 حفظ التغييرات'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ProfilePage
