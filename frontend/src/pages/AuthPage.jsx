import { useState } from 'react'
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth'
import { auth } from '../firebase'
import { supabase } from '../supabase'

const governorates = ["القاهرة", "الجيزة", "الإسكندرية", "الدقهلية", "الشرقية", "المنوفية", "البحيرة", "الإسماعيلية", "الغربية", "المنيا", "أسيوط", "سوهاج", "قنا", "الأقصر", "أسوان", "بورسعيد", "السويس", "دمياط", "الفيوم", "بني سويف", "كفر الشيخ", "مطروح", "الوادي الجديد", "شمال سيناء", "جنوب سيناء", "البحر الأحمر", "قليوبية"]

function AuthPage({ onLogin }) {
  const [step, setStep] = useState('phone')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [role, setRole] = useState('مريض')
  const [profile, setProfile] = useState({ display_name: '', story: '', need: '', governorate: '', city: '', place: '', place_type: 'مستشفى' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [confirmationResult, setConfirmationResult] = useState(null)

  const setupRecaptcha = () => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
        callback: () => {}
      })
    }
  }

  const handleSendOtp = async () => {
    setError('')
    setLoading(true)
    try {
      setupRecaptcha()
      const phoneNumber = '+20' + phone.replace(/^0/, '')
      const result = await signInWithPhoneNumber(auth, phoneNumber, window.recaptchaVerifier)
      setConfirmationResult(result)
      setStep('otp')
    } catch (err) {
      setError('خطأ في إرسال الكود، تحقق من الرقم')
      window.recaptchaVerifier = null
    }
    setLoading(false)
  }

  const handleVerify = async () => {
    setError('')
    setLoading(true)
    try {
      const code = otp.join('')
      const result = await confirmationResult.confirm(code)
      const firebaseUser = result.user

      // تحقق لو المستخدم موجود في Supabase
      const { data: existingUser } = await supabase
        .from('users')
        .select('*')
        .eq('phone', firebaseUser.phoneNumber)
        .single()

      if (existingUser) {
        // مستخدم موجود - دخول مباشر
        onLogin(firebaseUser, existingUser)
      } else {
        // مستخدم جديد - اختيار الدور
        setStep('role')
      }
    } catch (err) {
      setError('كود خاطئ، حاول مرة أخرى')
    }
    setLoading(false)
  }

  const handleRoleNext = () => {
    if (role === 'مريض') {
      setStep('profile')
    } else {
      setStep('password')
    }
  }

  const handleProfileSubmit = async (password) => {
    setLoading(true)
    try {
      const firebaseUser = auth.currentUser
      const { data, error } = await supabase
        .from('users')
        .insert({
          phone: firebaseUser.phoneNumber,
          role,
          display_name: profile.display_name || 'مستفيد',
          story: profile.story,
          need: profile.need,
          governorate: profile.governorate,
          city: profile.city,
          place: profile.place,
          place_type: profile.place_type,
          password_hash: password,
          status: role === 'مريض' ? 'active' : 'pending',
          country: 'مصر',
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error
      onLogin(firebaseUser, data)
    } catch (err) {
      setError('خطأ في إنشاء الحساب')
    }
    setLoading(false)
  }

  const handleOtpChange = (i, val) => {
    if (!/^\d?$/.test(val)) return
    const next = [...otp]
    next[i] = val
    setOtp(next)
    if (val && i < 5) document.getElementById(`otp-${i + 1}`)?.focus()
  }

  const handleOtpKey = (i, e) => {
    if (e.key === 'Backspace' && !otp[i] && i > 0) document.getElementById(`otp-${i - 1}`)?.focus()
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, var(--teal-dark) 0%, var(--teal) 50%, var(--teal-light) 100%)',
      position: 'relative', overflow: 'hidden'
    }}>
      <div id="recaptcha-container" />

      {/* Background circles */}
      {[
        { w: 320, h: 320, t: -120, r: -120 },
        { w: 200, h: 200, b: -60, l: -60 },
        { w: 150, h: 150, t: '40%', l: '10%' }
      ].map((c, i) => (
        <div key={i} style={{
          position: 'absolute', borderRadius: '50%',
          background: 'rgba(255,255,255,0.05)',
          width: c.w, height: c.h,
          top: c.t, right: c.r, bottom: c.b, left: c.l
        }} />
      ))}

      <div style={{
        background: 'white', borderRadius: 24, padding: 40,
        width: '90%', maxWidth: 440,
        boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
        position: 'relative', zIndex: 1,
        maxHeight: '90vh', overflowY: 'auto'
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{
            width: 72, height: 72,
            background: 'linear-gradient(135deg, var(--teal), var(--teal-light))',
            borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 32, margin: '0 auto 12px',
            boxShadow: '0 8px 24px rgba(13,115,119,0.3)'
          }}>🤝</div>
          <div style={{ fontSize: 28, fontWeight: 900, color: 'var(--text)' }}>وانس</div>
          <div style={{ color: 'var(--text-light)', fontSize: 14, marginTop: 4 }}>منصة عالمية لزيارة المرضى والمحتاجين</div>
        </div>

        {error && (
          <div style={{ background: '#fdecea', color: '#e74c3c', padding: '10px 14px', borderRadius: 10, marginBottom: 16, fontSize: 13, fontWeight: 600 }}>
            ⚠️ {error}
          </div>
        )}

        {/* STEP: Phone */}
        {step === 'phone' && (
          <>
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 18, fontWeight: 900, marginBottom: 6 }}>أدخل رقم هاتفك 📱</div>
              <div style={{ fontSize: 13, color: 'var(--text-light)' }}>هنبعتلك كود تحقق على رقمك</div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 13, fontWeight: 700, display: 'block', marginBottom: 6 }}>رقم الهاتف</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <div style={{ background: '#f0f4f3', border: '1.5px solid var(--border)', borderRadius: 10, padding: '10px 14px', fontSize: 14, fontWeight: 700, color: 'var(--text-light)' }}>
                  🇪🇬 +20
                </div>
                <input
                  style={{ flex: 1, padding: '10px 14px', border: '1.5px solid var(--border)', borderRadius: 10, fontSize: 14 }}
                  placeholder="01xxxxxxxxx"
                  value={phone}
                  onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 11))}
                  maxLength={11}
                />
              </div>
            </div>
            <button
              onClick={handleSendOtp}
              disabled={phone.length < 10 || loading}
              style={{
                width: '100%', padding: 13, borderRadius: 12, border: 'none',
                background: phone.length < 10 ? '#ccc' : 'var(--teal)',
                color: 'white', fontSize: 15, fontWeight: 700
              }}>
              {loading ? '⏳ جاري الإرسال...' : 'إرسال كود التحقق 📱'}
            </button>
          </>
        )}

        {/* STEP: OTP */}
        {step === 'otp' && (
          <>
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 18, fontWeight: 900, marginBottom: 6 }}>كود التحقق 🔐</div>
              <div style={{ fontSize: 13, color: 'var(--text-light)' }}>
                تم الإرسال إلى <strong style={{ color: 'var(--teal)' }}>+20 {phone}</strong>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 20, direction: 'ltr' }}>
              {otp.map((d, i) => (
                <input key={i} id={`otp-${i}`}
                  style={{
                    width: 46, height: 54, textAlign: 'center', fontSize: 22, fontWeight: 900,
                    border: '2px solid ' + (d ? 'var(--teal)' : 'var(--border)'),
                    borderRadius: 12, outline: 'none',
                    background: d ? '#e8f5f5' : 'white'
                  }}
                  maxLength={1} value={d}
                  onChange={e => handleOtpChange(i, e.target.value)}
                  onKeyDown={e => handleOtpKey(i, e)}
                />
              ))}
            </div>
            <button
              onClick={handleVerify}
              disabled={otp.join('').length < 6 || loading}
              style={{
                width: '100%', padding: 13, borderRadius: 12, border: 'none',
                background: otp.join('').length < 6 ? '#ccc' : 'var(--teal)',
                color: 'white', fontSize: 15, fontWeight: 700, marginBottom: 12
              }}>
              {loading ? '⏳ جاري التحقق...' : 'تحقق ✓'}
            </button>
            <button onClick={() => { setStep('phone'); setOtp(['', '', '', '', '', '']) }}
              style={{ width: '100%', background: 'none', border: 'none', color: 'var(--text-light)', fontSize: 13, cursor: 'pointer' }}>
              ← تغيير رقم الهاتف
            </button>
          </>
        )}

        {/* STEP: Role */}
        {step === 'role' && (
          <>
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 18, fontWeight: 900, marginBottom: 6 }}>أهلاً بك في وانس! 🎉</div>
              <div style={{ fontSize: 13, color: 'var(--text-light)' }}>اختار دورك في المنصة</div>
            </div>
            {[
              { id: 'مريض', icon: '🏥', title: 'مريض / مستفيد', desc: 'أحتاج زيارات ودعم', color: '#8e44ad', note: 'يظهر فوراً' },
              { id: 'متطوع', icon: '🤝', title: 'متطوع', desc: 'أريد زيارة المحتاجين', color: '#27ae60', note: 'يحتاج موافقة' },
              { id: 'طبيب', icon: '🩺', title: 'طبيب', desc: 'أقدم رعاية طبية', color: '#2980b9', note: 'يحتاج موافقة' },
            ].map(r => (
              <div key={r.id} onClick={() => setRole(r.id)}
                style={{
                  padding: '14px 16px', border: `2px solid ${role === r.id ? r.color : 'var(--border)'}`,
                  borderRadius: 14, cursor: 'pointer',
                  background: role === r.id ? r.color + '10' : 'white',
                  display: 'flex', alignItems: 'center', gap: 14, marginBottom: 10
                }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: r.color + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>{r.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{r.title}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-light)' }}>{r.desc}</div>
                </div>
                <div style={{ fontSize: 11, color: r.id === 'مريض' ? '#27ae60' : '#f39c12', fontWeight: 700, background: r.id === 'مريض' ? '#e8f8f0' : '#fff8e7', padding: '3px 8px', borderRadius: 8 }}>{r.note}</div>
              </div>
            ))}
            <button onClick={handleRoleNext}
              style={{ width: '100%', padding: 13, borderRadius: 12, border: 'none', background: 'var(--teal)', color: 'white', fontSize: 15, fontWeight: 700, marginTop: 8 }}>
              متابعة ←
            </button>
          </>
        )}

        {/* STEP: Profile (مريض) */}
        {step === 'profile' && (
          <>
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 18, fontWeight: 900, marginBottom: 6 }}>أكمل بروفايلك 📝</div>
              <div style={{ fontSize: 13, color: 'var(--text-light)' }}>بياناتك ستظهر للمتطوعين على الخريطة 🔒</div>
            </div>
            {[
              { label: 'الاسم المعروض (اختياري)', key: 'display_name', type: 'input', placeholder: 'اسم مستعار أو اتركه فارغاً' },
              { label: 'قصتك واحتياجك ✍️', key: 'story', type: 'textarea', placeholder: 'اكتب قصتك واحتياجك من الزيارات...' },
              { label: 'المحافظة', key: 'governorate', type: 'select', options: governorates },
              { label: 'المدينة', key: 'city', type: 'input', placeholder: 'مثال: مدينة نصر' },
              { label: 'نوع المكان', key: 'place_type', type: 'select', options: ['مستشفى', 'دار مسنين', 'دار أيتام', 'مركز رعاية', 'جهة خيرية', 'منزل'] },
              { label: 'اسم المكان', key: 'place', type: 'input', placeholder: 'مثال: مستشفى النيل' },
            ].map(f => (
              <div key={f.key} style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 13, fontWeight: 700, display: 'block', marginBottom: 6 }}>{f.label}</label>
                {f.type === 'textarea' ? (
                  <textarea
                    style={{ width: '100%', padding: '10px 14px', border: '1.5px solid var(--border)', borderRadius: 10, fontSize: 14, minHeight: 80, resize: 'vertical' }}
                    placeholder={f.placeholder}
                    value={profile[f.key]}
                    onChange={e => setProfile({ ...profile, [f.key]: e.target.value })}
                  />
                ) : f.type === 'select' ? (
                  <select
                    style={{ width: '100%', padding: '10px 14px', border: '1.5px solid var(--border)', borderRadius: 10, fontSize: 14 }}
                    value={profile[f.key]}
                    onChange={e => setProfile({ ...profile, [f.key]: e.target.value })}>
                    <option value="">-- اختر --</option>
                    {f.options.map(o => <option key={o}>{o}</option>)}
                  </select>
                ) : (
                  <input
                    style={{ width: '100%', padding: '10px 14px', border: '1.5px solid var(--border)', borderRadius: 10, fontSize: 14 }}
                    placeholder={f.placeholder}
                    value={profile[f.key]}
                    onChange={e => setProfile({ ...profile, [f.key]: e.target.value })}
                  />
                )}
              </div>
            ))}
            <PasswordStep onSubmit={handleProfileSubmit} loading={loading} />
          </>
        )}

        {/* STEP: Password (متطوع / طبيب) */}
        {step === 'password' && (
          <PasswordStep onSubmit={handleProfileSubmit} loading={loading} isNew={true} role={role} />
        )}
      </div>
    </div>
  )
}

function PasswordStep({ onSubmit, loading, isNew, role }) {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [err, setErr] = useState('')

  const handleSubmit = () => {
    if (password.length < 6) { setErr('كلمة المرور أقل من 6 أحرف'); return }
    if (password !== confirm) { setErr('كلمتا المرور غير متطابقتين'); return }
    onSubmit(password)
  }

  return (
    <div style={{ marginTop: 16 }}>
      <div style={{ fontSize: 16, fontWeight: 900, marginBottom: 16 }}>
        {isNew ? `إنشاء كلمة مرور 🔑` : 'أنشئ كلمة مرور للدخول القادم'}
      </div>
      {isNew && role && (
        <div style={{ background: '#fff8e7', border: '1px solid #f5d08a', borderRadius: 10, padding: 10, marginBottom: 12, fontSize: 13, color: '#8a6d00' }}>
          ⚠️ سيتم مراجعة حسابك من الأدمن قبل التفعيل
        </div>
      )}
      {err && <div style={{ color: '#e74c3c', fontSize: 13, marginBottom: 8 }}>⚠️ {err}</div>}
      <input
        type="password"
        style={{ width: '100%', padding: '10px 14px', border: '1.5px solid var(--border)', borderRadius: 10, fontSize: 14, marginBottom: 10 }}
        placeholder="كلمة المرور (6 أحرف على الأقل)"
        value={password}
        onChange={e => setPassword(e.target.value)}
      />
      <input
        type="password"
        style={{ width: '100%', padding: '10px 14px', border: '1.5px solid var(--border)', borderRadius: 10, fontSize: 14, marginBottom: 16 }}
        placeholder="تأكيد كلمة المرور"
        value={confirm}
        onChange={e => setConfirm(e.target.value)}
      />
      <button onClick={handleSubmit} disabled={loading}
        style={{ width: '100%', padding: 13, borderRadius: 12, border: 'none', background: 'var(--teal)', color: 'white', fontSize: 15, fontWeight: 700 }}>
        {loading ? '⏳ جاري الإنشاء...' : 'ابدأ في وانس 🚀'}
      </button>
    </div>
  )
}

export default AuthPage
