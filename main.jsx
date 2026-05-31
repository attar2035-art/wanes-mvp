import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Link, Navigate, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './styles.css';

const API = import.meta.env.VITE_API_URL || '';

function getToken() {
  return localStorage.getItem('wanes_token');
}
function setAuth(data) {
  localStorage.setItem('wanes_token', data.token);
  localStorage.setItem('wanes_user', JSON.stringify(data.user));
}
function getUser() {
  try { return JSON.parse(localStorage.getItem('wanes_user') || 'null'); } catch { return null; }
}
function logout() {
  localStorage.removeItem('wanes_token');
  localStorage.removeItem('wanes_user');
  window.location.href = '/';
}
const api = axios.create({ baseURL: API });
api.interceptors.request.use(config => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

function Layout({ children }) {
  const user = getUser();
  return (
    <>
      <header className="topbar">
        <Link className="brand" to="/">ونس</Link>
        <nav>
          <Link to="/cases">الحالات</Link>
          <Link to="/places">الأماكن</Link>
          {user?.role === 'volunteer' && <Link to="/volunteer">لوحتي</Link>}
          {user?.role === 'patient' && <Link to="/patient">حسابي</Link>}
          {user?.role === 'doctor' && <Link to="/doctor">الطبيب</Link>}
          {user?.role === 'place_supervisor' && <Link to="/supervisor">المكان</Link>}
          {user?.role === 'admin' && <Link to="/admin">لوحة الأدمن</Link>}
          {user ? <button onClick={logout}>خروج</button> : <Link to="/login">دخول</Link>}
        </nav>
      </header>
      <main className="container">{children}</main>
    </>
  );
}

function Home() {
  return <Layout>
    <section className="hero">
      <h1>ونس</h1>
      <p>منصة خيرية تربط المرضى والمستفيدين بالزوار والمتطوعين والأطباء للدعم الإنساني والزيارات.</p>
      <div className="actions">
        <Link className="btn" to="/register">إنشاء حساب</Link>
        <Link className="btn ghost" to="/cases">تصفح الحالات</Link>
      </div>
    </section>
  </Layout>
}

function Register() {
  const [places, setPlaces] = useState([]);
  const [form, setForm] = useState({
    full_name: '', phone: '', password: '', email: '', age: '', country: 'مصر',
    city: '', gender: 'male', role: 'volunteer', bio: '',
    place_id: '', case_description: '', preferred_visit_times: '', preferred_visitor_gender: 'any',
    specialization: '', workplace: ''
  });
  const [msg, setMsg] = useState('');
  const nav = useNavigate();
  useEffect(() => { api.get('/api/places').then(r => setPlaces(r.data)); }, []);
  const submit = async e => {
    e.preventDefault();
    try {
      const { data } = await api.post('/api/auth/register', form);
      setAuth(data);
      nav(data.user.role === 'admin' ? '/admin' : '/cases');
    } catch (err) {
      setMsg(err.response?.data?.message || 'فشل التسجيل');
    }
  };
  return <Layout>
    <div className="card">
      <h2>إنشاء حساب</h2>
      {msg && <p className="error">{msg}</p>}
      <form onSubmit={submit} className="form">
        <input placeholder="الاسم الكامل" value={form.full_name} onChange={e=>setForm({...form, full_name:e.target.value})} required />
        <input placeholder="رقم الجوال" value={form.phone} onChange={e=>setForm({...form, phone:e.target.value})} required />
        <input placeholder="كلمة المرور" type="password" value={form.password} onChange={e=>setForm({...form, password:e.target.value})} required />
        <input placeholder="الإيميل اختياري" value={form.email} onChange={e=>setForm({...form, email:e.target.value})} />
        <input placeholder="العمر" type="number" value={form.age} onChange={e=>setForm({...form, age:e.target.value})} required />
        <input placeholder="الدولة" value={form.country} onChange={e=>setForm({...form, country:e.target.value})} required />
        <input placeholder="المدينة" value={form.city} onChange={e=>setForm({...form, city:e.target.value})} required />
        <select value={form.gender} onChange={e=>setForm({...form, gender:e.target.value})}>
          <option value="male">ذكر</option>
          <option value="female">أنثى</option>
          <option value="child">طفل</option>
        </select>
        <select value={form.role} onChange={e=>setForm({...form, role:e.target.value})}>
          <option value="volunteer">زائر / متطوع</option>
          <option value="patient">مريض / مستفيد</option>
          <option value="doctor">طبيب</option>
          <option value="place_supervisor">مشرف مكان</option>
        </select>

        {form.role === 'volunteer' && <textarea placeholder="نبذة قصيرة" value={form.bio} onChange={e=>setForm({...form, bio:e.target.value})} />}
        {form.role === 'doctor' && <>
          <input placeholder="التخصص" value={form.specialization} onChange={e=>setForm({...form, specialization:e.target.value})} />
          <input placeholder="جهة العمل" value={form.workplace} onChange={e=>setForm({...form, workplace:e.target.value})} />
          <textarea placeholder="نبذة تعريفية" value={form.bio} onChange={e=>setForm({...form, bio:e.target.value})} />
        </>}
        {form.role === 'patient' && <>
          <select value={form.place_id} onChange={e=>setForm({...form, place_id:e.target.value})} required>
            <option value="">اختر المكان</option>
            {places.map(p => <option key={p.id} value={p.id}>{p.name} - {p.city}</option>)}
          </select>
          <textarea placeholder="وصف الحالة" value={form.case_description} onChange={e=>setForm({...form, case_description:e.target.value})} required />
          <input placeholder="مواعيد الزيارة المناسبة" value={form.preferred_visit_times} onChange={e=>setForm({...form, preferred_visit_times:e.target.value})} />
          <select value={form.preferred_visitor_gender} onChange={e=>setForm({...form, preferred_visitor_gender:e.target.value})}>
            <option value="any">أي زائر</option>
            <option value="male">ذكر</option>
            <option value="female">أنثى</option>
          </select>
        </>}
        <button className="btn">تسجيل</button>
      </form>
    </div>
  </Layout>
}

function Login() {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState('');
  const nav = useNavigate();
  const submit = async e => {
    e.preventDefault();
    try {
      const { data } = await api.post('/api/auth/login', { phone, password });
      setAuth(data);
      nav(data.user.role === 'admin' ? '/admin' : '/cases');
    } catch (err) {
      setMsg(err.response?.data?.message || 'فشل الدخول');
    }
  };
  return <Layout>
    <div className="card narrow">
      <h2>تسجيل الدخول</h2>
      {msg && <p className="error">{msg}</p>}
      <form onSubmit={submit} className="form">
        <input placeholder="رقم الجوال" value={phone} onChange={e=>setPhone(e.target.value)} required />
        <input placeholder="كلمة المرور" type="password" value={password} onChange={e=>setPassword(e.target.value)} required />
        <button className="btn">دخول</button>
        <Link to="/register">ليس لديك حساب؟</Link>
      </form>
    </div>
  </Layout>
}

function Cases() {
  const [cases, setCases] = useState([]);
  useEffect(() => { api.get('/api/cases').then(r => setCases(r.data)); }, []);
  return <Layout>
    <h2>الحالات</h2>
    <div className="grid">
      {cases.map(c => <div className="case" key={c.id}>
        <h3>{c.full_name}</h3>
        <p>{c.age} سنة - {c.city}</p>
        <p>{c.place_name}</p>
        <p>{c.case_description}</p>
        <Link className="btn small" to={`/cases/${c.id}`}>عرض التفاصيل</Link>
      </div>)}
    </div>
  </Layout>
}

function CaseDetails() {
  const id = location.pathname.split('/').pop();
  const [c, setC] = useState(null);
  const [form, setForm] = useState({ requested_date: '', requested_time: '', message: '' });
  const [msg, setMsg] = useState('');
  useEffect(() => { api.get(`/api/cases/${id}`).then(r => setC(r.data)); }, [id]);
  const requestVisit = async e => {
    e.preventDefault();
    try {
      await api.post('/api/visits', { patient_id: id, ...form });
      setMsg('تم إرسال طلب الزيارة بنجاح');
    } catch (err) {
      setMsg(err.response?.data?.message || 'لم نتمكن من إرسال الطلب');
    }
  };
  if (!c) return <Layout><p>جاري التحميل...</p></Layout>;
  return <Layout>
    <div className="card">
      <h2>{c.full_name}</h2>
      <p>{c.age} سنة - {c.city}</p>
      <p><strong>المكان:</strong> {c.place_name}</p>
      <p>{c.case_description}</p>
      <p>مواعيد مناسبة: {c.preferred_visit_times || 'غير محدد'}</p>
      {c.map_link && <a className="btn ghost" href={c.map_link} target="_blank">فتح الخريطة</a>}
      <hr/>
      <h3>طلب زيارة</h3>
      {msg && <p className={msg.includes('نجاح') ? 'success' : 'error'}>{msg}</p>}
      <form onSubmit={requestVisit} className="form">
        <input type="date" value={form.requested_date} onChange={e=>setForm({...form, requested_date:e.target.value})} required />
        <input type="time" value={form.requested_time} onChange={e=>setForm({...form, requested_time:e.target.value})} required />
        <textarea placeholder="رسالة قصيرة" value={form.message} onChange={e=>setForm({...form, message:e.target.value})} />
        <button className="btn">طلب الزيارة</button>
      </form>
    </div>
  </Layout>
}

function Places() {
  const [places, setPlaces] = useState([]);
  useEffect(() => { api.get('/api/places').then(r => setPlaces(r.data)); }, []);
  return <Layout>
    <h2>الأماكن</h2>
    <div className="grid">
      {places.map(p => <div className="case" key={p.id}>
        <h3>{p.name}</h3>
        <p>{p.type} - {p.city}</p>
        <p>{p.address}</p>
        {p.map_link && <a className="btn small" href={p.map_link} target="_blank">الخريطة</a>}
      </div>)}
    </div>
  </Layout>
}

function Protected({ roles, children }) {
  const user = getUser();
  if (!user) return <Navigate to="/login" />;
  if (roles && !roles.includes(user.role)) return <Layout><p className="error">غير مصرح</p></Layout>;
  return children;
}

function Admin() {
  const [data, setData] = useState({ users: [], places: [], patients: [], visits: [] });
  const [place, setPlace] = useState({ name:'', type:'hospital', country:'مصر', city:'', address:'', phone:'', map_link:'', description:'' });
  const load = () => Promise.all([
    api.get('/api/admin/users'), api.get('/api/admin/places'), api.get('/api/admin/patients'), api.get('/api/admin/visits')
  ]).then(([users, places, patients, visits]) => setData({ users: users.data, places: places.data, patients: patients.data, visits: visits.data }));
  useEffect(() => { load(); }, []);
  const addPlace = async e => {
    e.preventDefault();
    await api.post('/api/admin/places', place);
    setPlace({ name:'', type:'hospital', country:'مصر', city:'', address:'', phone:'', map_link:'', description:'' });
    load();
  };
  const updateVisit = async (id, status) => { await api.patch(`/api/admin/visits/${id}`, { status }); load(); };
  return <Layout>
    <h2>لوحة الأدمن</h2>
    <div className="stats">
      <b>المستخدمون: {data.users.length}</b>
      <b>الأماكن: {data.places.length}</b>
      <b>المرضى: {data.patients.length}</b>
      <b>طلبات الزيارة: {data.visits.length}</b>
    </div>

    <section className="card">
      <h3>إضافة مكان</h3>
      <form className="form" onSubmit={addPlace}>
        <input placeholder="اسم المكان" value={place.name} onChange={e=>setPlace({...place,name:e.target.value})} required />
        <select value={place.type} onChange={e=>setPlace({...place,type:e.target.value})}>
          <option value="hospital">مستشفى</option>
          <option value="orphanage">دار أيتام</option>
          <option value="elderly_home">دار مسنين</option>
          <option value="shelter">ملجأ</option>
          <option value="care_center">مركز رعاية</option>
        </select>
        <input placeholder="المدينة" value={place.city} onChange={e=>setPlace({...place,city:e.target.value})} required />
        <input placeholder="العنوان" value={place.address} onChange={e=>setPlace({...place,address:e.target.value})} />
        <input placeholder="الهاتف" value={place.phone} onChange={e=>setPlace({...place,phone:e.target.value})} />
        <input placeholder="رابط Google Maps" value={place.map_link} onChange={e=>setPlace({...place,map_link:e.target.value})} />
        <textarea placeholder="وصف" value={place.description} onChange={e=>setPlace({...place,description:e.target.value})} />
        <button className="btn">إضافة</button>
      </form>
    </section>

    <section className="card"><h3>طلبات الزيارة</h3>
      {data.visits.map(v => <div className="row" key={v.id}>
        <span>{v.volunteer_name} يريد زيارة {v.patient_name} يوم {v.requested_date} {v.requested_time} - {v.status}</span>
        <button onClick={()=>updateVisit(v.id,'approved')}>قبول</button>
        <button onClick={()=>updateVisit(v.id,'rejected')}>رفض</button>
      </div>)}
    </section>

    <section className="card"><h3>المرضى</h3>{data.patients.map(p=><div className="row" key={p.id}>{p.full_name} - {p.place_name}</div>)}</section>
    <section className="card"><h3>الأماكن</h3>{data.places.map(p=><div className="row" key={p.id}>{p.name} - {p.city}</div>)}</section>
    <section className="card"><h3>المستخدمون</h3>{data.users.map(u=><div className="row" key={u.id}>{u.full_name} - {u.phone} - {u.role}</div>)}</section>
  </Layout>
}

function SimpleDashboard({ title }) {
  const user = getUser();
  return <Layout><div className="card"><h2>{title}</h2><p>مرحبًا {user?.full_name}</p><Link className="btn" to="/cases">تصفح الحالات</Link></div></Layout>
}

function App() {
  return <BrowserRouter>
    <Routes>
      <Route path="/" element={<Home/>} />
      <Route path="/login" element={<Login/>} />
      <Route path="/register" element={<Register/>} />
      <Route path="/cases" element={<Cases/>} />
      <Route path="/cases/:id" element={<CaseDetails/>} />
      <Route path="/places" element={<Places/>} />
      <Route path="/admin" element={<Protected roles={['admin']}><Admin/></Protected>} />
      <Route path="/volunteer" element={<Protected roles={['volunteer']}><SimpleDashboard title="لوحة المتطوع"/></Protected>} />
      <Route path="/patient" element={<Protected roles={['patient']}><SimpleDashboard title="حساب المريض"/></Protected>} />
      <Route path="/doctor" element={<Protected roles={['doctor']}><SimpleDashboard title="حساب الطبيب"/></Protected>} />
      <Route path="/supervisor" element={<Protected roles={['place_supervisor']}><SimpleDashboard title="حساب مشرف المكان"/></Protected>} />
    </Routes>
  </BrowserRouter>
}

createRoot(document.getElementById('root')).render(<App />);
