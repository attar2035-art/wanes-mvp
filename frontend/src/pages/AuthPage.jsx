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
  const [addingFor, setAddingFor] = useState('self') // 'self' or 'other'
  const [otherProfile, setOtherProfile] = useState({ display_name: '', story: '', need: '', governorate: '', city: '', place: '', place_type: 'مستشفى' })
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
        setError('الحساب غير موجود')
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
    if (role === 'مريض') setStep('addingFor')
    else setStep('profile')
  }

  const handleAddingForNext = () => {
    if (addingFor === 'other') setStep('otherProfile')
    else setStep('profile')
  }

  const handleSubmit = async () => {
    setError('')
    setLoading(true)
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password)
      const firebaseUser = result.user

      // إنشاء حساب المستخدم الأساسي
      const userProfile = addingFor === 'self' ? profile : { display_name: email.split('@')[0], story: '', need: '', governorate: '', city: '', place: '', place_type: '' }

      const { data, error: dbError } = await supabase
        .from('users')
        .insert({
          email,
          phone: null,
          role,
          display_name: userProfile.display_name || email.split('@')[0],
          story: userProfile.story || '',
          need: userProfile.need || '',
          governorate: userProfile.governorate || '',
          city: userProfile.city || '',
          place: userProfile.place || '',
          place_type: userProfile.place_type || '',
          status: 'active',
          country: 'مصر',
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      if (dbError) throw dbError

      // لو بيضيف مريض آخر
      if (addingFor === 'other' && role === 'مريض') {
        await supabase.from('users').insert({
          email: null,
          phone: null,
          role: 'مريض',
          display_name: otherProfile.display_name || 'مستفيد',
          story: otherProfile.story || '',
          need: otherProfile.need || '',
          governorate: otherProfile.governorate || '',
          city: otherProfile.city || '',
          place: otherProfile.place || '',
          place_type: otherProfile.place_type || '',
          status: 'active',
          country: 'مصر',
          added_by: data.id,
          created_at: new Date().toISOString()
        })
      }

      onLogin(firebaseUser, data)
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') {
        setError('الإيميل مستخدم بالفعل')
      } else {
        setError('خطأ: ' + err.message)
      }
    }
    setLoading(false)
  }

  const inputStyle = { width: '100%', padding: '10px 14px', border: '1.5px solid var(--border)', borderRadius: 10, fontSize: 14, fontFamily: 'Cairo, sans-serif', direction: 'rtl', marginBottom: 12 }
  const btnStyle = { width: '100%', padding: 13, borderRadius: 12, border: 'none', background: 'var(--teal)', color: 'white', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'Cairo, sans-serif' }
  const labelStyle = { fontSize: 13, fontWeight: 700, display: 'block', marginBottom: 6 }

  const ProfileForm = ({ data, setData, title }) => (
    <>
      <div style={{ fontSize: 18, fontWeight: 900, marginBottom: 6 }}>{title}</div>
      <div style={{ fontSize: 13, color: 'var(--text-light)', marginBottom: 16 }}>ستظهر هذه البيانات للمتطوعين على الخريطة 🔒</div>
      {[
        { label: 'الاسم المعروض (اختياري)', key: 'display_name', type: 'input', placeholder: 'اسم مستعار' },
        { label: 'القصة والاحتياج ✍️', key: 'story', type: 'textarea', placeholder: 'اكتب القصة والاحتياج...' },
        { label: 'نوع الاحتياج', key: 'need', type: 'input', placeholder: 'مثال: رعاية مسنين' },
        { label: 'المحافظة', key: 'governorate', type: 'select', options: governorates },
        { label: 'المدينة', key: 'city', type: 'input', placeholder: 'مثال: مدينة نصر' },
        { label: 'نوع المكان', key: 'place_type', type: 'select', options: ['مستشفى', 'دار مسنين', 'دار أيتام', 'مركز رعاية', 'جهة خيرية', 'منزل'] },
        { label: 'اسم المكان', key: 'place', type: 'input', placeholder: 'مثال: مستشفى النيل' },
      ].map(f => (
        <div key={f.key} style={{ marginBottom: 12 }}>
          <label style={labelStyle}>{f.label}</label>
          {f.type === 'textarea' ? (
            <textarea style={{ ...inputStyle, minHeight: 70, resize: 'vertical' }} placeholder={f.placeholder} value={data[f.key]} onChange={e => setData({ ...data, [f.key]: e.target.value })} />
          ) : f.type === 'select' ? (
            <select style={inputStyle} value={data[f.key]} onChange={e => setData({ ...data, [f.key]: e.target.value })}>
              <option value="">-- اختر --</option>
              {f.options.map(o => <option key={o}>{o}</option>)}
            </select>
          ) : (
            <input style={inputStyle} placeholder={f.placeholder} value={data[f.key]} onChange={e => setData({ ...data, [f.key]: e.target.value })} />
          )}
        </div>
      ))}
    </>
  )

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, var(--teal-dark) 0%, var(--teal) 50%, var(--teal-light) 100%)', position: 'relative', overflow: 'hidden' }}>
      {[{ w: 320, h: 320, t: -120, r: -120 }, { w: 200, h: 200, b: -60, l: -60 }].map((c, i) => (
        <div key={i} style={{ position: 'absolute', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', width: c.w, height: c.h, top: c.t, right: c.r, bottom: c.b, left: c.l }} />
      ))}

      <div style={{ background: 'white', borderRadius: 24, padding: 40, width: '90%', maxWidth: 480, boxShadow: '0 20px 60px rgba(0,0,0,0.2)', position: 'relative', zIndex: 1, maxHeight: '90vh', overflowY: 'auto' }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ width: 64, height: 64, background: 'linear-gradient(135deg, var(--teal), var(--teal-light))', borderRadius: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, margin: '0 auto 10px' }}>🤝</div>
          <div style={{ fontSize: 26, fontWeight: 900, color: 'var(--text)' }}>وانس</div>
          <div style={{ color: 'var(--text-light)', fontSize: 13 }}>منصة عالمية لزيارة المرضى والمحتاجين</div>
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
            <div style={{ fontSize: 18, fontWeight: 900, marginBottom: 16 }}>أهلاً بعودتك! 👋</div>
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
            <div style={{ fontSize: 18, fontWeight: 900, marginBottom: 16 }}>إنشاء حساب جديد ✨</div>
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
            <div style={{ fontSize: 18, fontWeight: 900, marginBottom: 6 }}>اختار دورك 🎯</div>
            <div style={{ fontSize: 13, color: 'var(--text-light)', marginBottom: 16 }}>ما هو دورك في منصة وانس؟</div>
            {[
              { id: 'مريض', icon: '🏥', title: 'مريض / مستفيد', desc: 'أحتاج زيارات ودعم', color: '#8e44ad' },
              { id: 'متطوع', icon: '🤝', title: 'متطوع', desc: 'أريد زيارة المحتاجين', color: '#27ae60' },
              { id: 'طبيب', icon: '🩺', title: 'طبيب', desc: 'أقدم رعاية طبية', color: '#2980b9' },
              { id: 'مشرف', icon: '👔', title: 'مشرف', desc: 'أشرف على الزيارات', color: '#e67e22' },
            ].map(r => (
              <div key={r.id} onClick={() => setRole(r.id)} style={{ padding: '12px 16px', border: `2px solid ${role === r.id ? r.color : 'var(--border)'}`, borderRadius: 14, cursor: 'pointer', background: role === r.id ? r.color + '10' : 'white', display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                <div style={{ width: 42, height: 42, borderRadius: 12, background: r.color + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>{r.icon}</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{r.title}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-light)' }}>{r.desc}</div>
                </div>
              </div>
            ))}
            <button onClick={handleRoleNext} style={btnStyle}>متابعة ←</button>
          </>
        )}

        {/* ADDING FOR - self or other */}
        {step === 'addingFor' && (
          <>
            <div style={{ fontSize: 18, fontWeight: 900, marginBottom: 6 }}>من تضيفه؟ 👥</div>
            <div style={{ fontSize: 13, color: 'var(--text-light)', marginBottom: 16 }}>هل تسجل لنفسك أم لشخص آخر؟</div>
            {[
              { id: 'self', icon: '👤', title: 'أنا المريض', desc: 'أسجل لنفسي', color: '#0d7377' },
              { id: 'other', icon: '👨', title: 'أضيف شخص آخر', desc: 'أهل، قريب، صديق يحتاج زيارات', color: '#8e44ad' },
            ].map(a => (
              <div key={a.id} onClick={() => setAddingFor(a.id)} style={{ padding: '14px 16px', border: `2px solid ${addingFor === a.id ? a.color : 'var(--border)'}`, borderRadius: 14, cursor: 'pointer', background: addingFor === a.id ? a.color + '10' : 'white', display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12 }}>
                <div style={{ width: 48, height: 48, borderRadius: 14, background: a.color + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>{a.icon}</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{a.title}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-light)' }}>{a.desc}</div>
                </div>
              </div>
            ))}
            <button onClick={handleAddingForNext} style={btnStyle}>متابعة ←</button>
          </>
        )}

        {/* PROFILE - self */}
        {step === 'profile' && (
          <>
            <ProfileForm
              data={profile}
              setData={setProfile}
              title={addingFor === 'self' ? 'أكمل بروفايلك 📝' : 'بياناتك الشخصية 👤'}
            />
            <button onClick={handleSubmit} disabled={loading} style={btnStyle}>
              {loading ? '⏳ جاري الإنشاء...' : 'ابدأ في وانس 🚀'}
            </button>
          </>
        )}

        {/* OTHER PROFILE */}
        {step === 'otherProfile' && (
          <>
            <ProfileForm
              data={otherProfile}
              setData={setOtherProfile}
              title='بيانات الشخص المحتاج 🏥'
            />
            <button onClick={handleSubmit} disabled={loading} style={btnStyle}>
              {loading ? '⏳ جاري الإنشاء...' : 'إضافة وبدء وانس 🚀'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}

export default AuthPage
