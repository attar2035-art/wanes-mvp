import { useState } from 'react'
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '../firebase'
import { supabase } from '../supabase'

const governorates = ["القاهرة", "الجيزة", "الإسكندرية", "الدقهلية", "الشرقية", "المنوفية", "البحيرة", "الإسماعيلية", "الغربية", "المنيا", "أسيوط", "سوهاج", "قنا", "الأقصر", "أسوان", "بورسعيد", "السويس", "دمياط", "الفيوم", "بني سويف", "كفر الشيخ", "مطروح", "الوادي الجديد", "شمال سيناء", "جنوب سيناء", "البحر الأحمر", "قليوبية"]

function AuthPage({ onLogin }) {
  const [mode, setMode] = useState('login')
  const [step, setStep] = useState('credentials')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [role, setRole] = useState('مريض')
  const [profile, setProfile] = useState({ display_name: '', story: '', need: '', governorate: '', city: '', place: '', place_type: 'مستشفى' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async () => {
    setError('')
    setLoading(true)
    try {
      const result = await signInWithEmailAndPassword(auth, email, password)
      const { data: existingUser } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single()
      if (existingUser) {
        onLogin(result.user, existingUser)
      } else {
        setError('الحساب غير موجود في قاعدة البيانات')
      }
    } catch (err) {
      setError('إيميل أو كلمة مرور خاطئة')
    }
    setLoading(false)
  }

  const handleRegisterNext = () => {
    setError('')
    if (!email || !password) { setError('أدخل الإيميل وكلمة المرور'); return }
    if (password.length < 6) { setError('كلمة المرور أقل من 6 أحرف'); return }
    if (password !== confirmPassword) { setError('كلمتا المرور غير متطابقتين'); return }
    setStep('role')
  }

  const handleRoleNext = () => {
    if (role === 'مريض') setStep('profile')
    else handleSubmit()
  }

  const handleSubmit = async () => {
    setError('')
    setLoading(true)
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password)
      const firebaseUser = result.user
      const { data, error: dbError } = await supabase
        .from('users')
        .insert({
          email,
          phone: '',
          role,
          display_name: profile.display_name || email.split('@')[0],
          story: profile.story || '',
          need: profile.need || '',
          governorate: profile.governorate || '',
          city: profile.city || '',
          place: profile.place || '',
          place_type: profile.place_type || '',
          status: role === 'مريض' ? 'active' : 'pending',
          country: 'مصر',
          created_at: new Date().toISOString()
        })
        .select()
        .single()
      if (dbError) throw dbError
      onLogin(firebaseUser, data)
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') {
        setError('الإيميل مستخدم بالفعل')
      } else {
        setError('خطأ في إنشاء الحساب: ' + err.message)
      }
    }
    setLoading(false)
  }

  const inputStyle = { width: '100%', padding: '10px 14px', border: '1.5px solid var(--border)', borderRadius: 10, fontSize: 14, fontFamily: 'Cairo, sans-serif', direction: 'rtl', marginBottom: 12 }
  const btnStyle = { width: '100%', padding: 13, borderRadius: 12, border: 'none', background: 'var(--teal)', color: 'white', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'Cairo, sans-serif' }
  const labelStyle = { fontSize: 13, fontWeight: 700, display: 'block', marginBottom: 6 }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, var(--teal-dark) 0%, var(--teal) 50%, var(--teal-light) 100%)', position: 'relative', overflow: 'hidden' }}>
      {[{ w: 320, h: 320, t: -120, r: -120 }, { w: 200, h: 200, b: -60, l: -60 }].map((c, i) => (
        <div key={i} style={{ position: 'absolute', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', width: c.w, height: c.h, top: c.t, right: c.r, bottom: c.b, left: c.l }} />
      ))}

      <div style={{ background: 'white', borderRadius: 24, padding: 40, width: '90%', maxWidth: 440, boxShadow: '0 20px 60px rgba(0,0,0,0.2)', position: 'relative', zIndex: 1, maxHeight: '90vh', overflowY: 'auto' }}>
        
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ width: 72, height: 72, background: 'linear-gradient(135deg, var(--teal), var(--teal-light))', borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, margin: '0 auto 12px', boxShadow: '0 8px 24px rgba(13,115,119,0.3)' }}>🤝</div>
          <div style={{ fontSize: 28, fontWeight: 900, color: 'var(--text)' }}>وانس</div>
          <div style={{ color: 'var(--text-light)', fontSize: 14, marginTop: 4 }}>منصة عالمية لزيارة المرضى والمحتاجين</div>
        </div>

        {/* Tabs */}
        {step === 'credentials' && (
          <div style={{ display: 'flex', gap: 8, background: '#f0f4f3', borderRadius: 12, padding: 4, marginBottom: 24 }}>
            {['login', 'register'].map(m => (
              <button key={m} onClick={() => { setMode(m); setError('') }}
                style={{ flex: 1, padding: 10, borderRadius: 10, border: 'none', background: mode === m ? 'white' : 'transparent', color: mode === m ? 'var(--teal)' : 'var(--text-light)', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'Cairo, sans-serif', boxShadow: mode === m ? 'var(--shadow)' : 'none' }}>
                {m === 'login' ? 'تسجيل الدخول' : 'حساب جديد'}
              </button>
            ))}
          </div>
        )}

        {error && <div style={{ background: '#fdecea', color: '#e74c3c', padding: '10px 14px', borderRadius: 10, marginBottom: 16, fontSize: 13, fontWeight: 600 }}>⚠️ {error}</div>}

        {/* LOGIN */}
        {mode === 'login' && step === 'credentials' && (
          <>
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 18, fontWeight: 900, marginBottom: 6 }}>أهلاً بعودتك! 👋</div>
            </div>
            <label style={labelStyle}>البريد الإلكتروني</label>
            <input style={inputStyle} type="email" placeholder="example@email.com" value={email} onChange={e => setEmail(e.target.value)} />
            <label style={labelStyle}>كلمة المرور</label>
            <input style={inputStyle} type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} />
            <button onClick={handleLogin} disabled={!email || !password || loading} style={{ ...btnStyle, background: !email || !password ? '#ccc' : 'var(--teal)' }}>
              {loading ? '⏳ جاري الدخول...' : 'دخول →'}
            </button>
          </>
        )}

        {/* REGISTER - credentials */}
        {mode === 'register' && step === 'credentials' && (
          <>
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 18, fontWeight: 900, marginBottom: 6 }}>إنشاء حساب جديد ✨</div>
            </div>
            <label style={labelStyle}>البريد الإلكتروني</label>
            <input style={inputStyle} type="email" placeholder="example@email.com" value={email} onChange={e => setEmail(e.target.value)} />
            <label style={labelStyle}>كلمة المرور</label>
            <input style={inputStyle} type="password" placeholder="6 أحرف على الأقل" value={password} onChange={e => setPassword(e.target.value)} />
            <label style={labelStyle}>تأكيد كلمة المرور</label>
            <input style={inputStyle} type="password" placeholder="أعد كتابة كلمة المرور" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
            <button onClick={handleRegisterNext} disabled={!email || !password || loading} style={{ ...btnStyle, background: !email || !password ? '#ccc' : 'var(--teal)' }}>
              متابعة ←
            </button>
          </>
        )}

        {/* ROLE */}
        {step === 'role' && (
          <>
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 18, fontWeight: 900, marginBottom: 6 }}>اختار دورك 🎯</div>
              <div style={{ fontSize: 13, color: 'var(--text-light)' }}>ما هو دورك في منصة وانس؟</div>
            </div>
            {[
              { id: 'مريض', icon: '🏥', title: 'مريض / مستفيد', desc: 'أحتاج زيارات ودعم', color: '#8e44ad', note: 'يظهر فوراً' },
              { id: 'متطوع', icon: '🤝', title: 'متطوع', desc: 'أريد زيارة المحتاجين', color: '#27ae60', note: 'يحتاج موافقة' },
              { id: 'طبيب', icon: '🩺', title: 'طبيب', desc: 'أقدم رعاية طبية', color: '#2980b9', note: 'يحتاج موافقة' },
            ].map(r => (
              <div key={r.id} onClick={() => setRole(r.id)} style={{ padding: '14px 16px', border: `2px solid ${role === r.id ? r.color : 'var(--border)'}`, borderRadius: 14, cursor: 'pointer', background: role === r.id ? r.color + '10' : 'white', display: 'flex', alignItems: 'center', gap: 14, marginBottom: 10 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: r.color + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>{r.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{r.title}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-light)' }}>{r.desc}</div>
                </div>
                <div style={{ fontSize: 11, color: r.id === 'مريض' ? '#27ae60' : '#f39c12', fontWeight: 700, background: r.id === 'مريض' ? '#e8f8f0' : '#fff8e7', padding: '3px 8px', borderRadius: 8 }}>{r.note}</div>
              </div>
            ))}
            <button onClick={handleRoleNext} disabled={loading} style={btnStyle}>
              {loading ? '⏳ جاري الإنشاء...' : 'متابعة ←'}
            </button>
          </>
        )}

        {/* PROFILE */}
        {step === 'profile' && (
          <>
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 18, fontWeight: 900, marginBottom: 6 }}>أكمل بروفايلك 📝</div>
              <div style={{ fontSize: 13, color: 'var(--text-light)' }}>بياناتك ستظهر للمتطوعين على الخريطة 🔒</div>
            </div>
            {[
              { label: 'الاسم المعروض (اختياري)', key: 'display_name', type: 'input', placeholder: 'اسم مستعار أو اتركه فارغاً' },
              { label: 'قصتك واحتياجك ✍️', key: 'story', type: 'textarea', placeholder: 'اكتب قصتك واحتياجك...' },
              { label: 'نوع الاحتياج', key: 'need', type: 'input', placeholder: 'مثال: رعاية مسنين، دعم نفسي' },
              { label: 'المحافظة', key: 'governorate', type: 'select', options: governorates },
              { label: 'المدينة', key: 'city', type: 'input', placeholder: 'مثال: مدينة نصر' },
              { label: 'نوع المكان', key: 'place_type', type: 'select', options: ['مستشفى', 'دار مسنين', 'دار أيتام', 'مركز رعاية', 'جهة خيرية', 'منزل'] },
              { label: 'اسم المكان', key: 'place', type: 'input', placeholder: 'مثال: مستشفى النيل' },
            ].map(f => (
              <div key={f.key} style={{ marginBottom: 12 }}>
                <label style={labelStyle}>{f.label}</label>
                {f.type === 'textarea' ? (
                  <textarea style={{ ...inputStyle, minHeight: 70, resize: 'vertical' }} placeholder={f.placeholder} value={profile[f.key]} onChange={e => setProfile({ ...profile, [f.key]: e.target.value })} />
                ) : f.type === 'select' ? (
                  <select style={inputStyle} value={profile[f.key]} onChange={e => setProfile({ ...profile, [f.key]: e.target.value })}>
                    <option value="">-- اختر --</option>
                    {f.options.map(o => <option key={o}>{o}</option>)}
                  </select>
                ) : (
                  <input style={inputStyle} placeholder={f.placeholder} value={profile[f.key]} onChange={e => setProfile({ ...profile, [f.key]: e.target.value })} />
                )}
              </div>
            ))}
            <button onClick={handleSubmit} disabled={loading} style={btnStyle}>
              {loading ? '⏳ جاري الإنشاء...' : 'ابدأ في وانس 🚀'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}

export default AuthPage
