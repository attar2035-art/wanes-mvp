import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from './lib/db.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me';

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '5mb' }));
app.use(morgan('dev'));

function tokenFor(user) {
  return jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
}
async function auth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.replace('Bearer ', '');
  if (!token) return res.status(401).json({ message: 'يرجى تسجيل الدخول' });
  try {
    const data = jwt.verify(token, JWT_SECRET);
    const { rows } = await pool.query('SELECT id, full_name, phone, email, role, status FROM users WHERE id=$1', [data.id]);
    if (!rows[0]) return res.status(401).json({ message: 'المستخدم غير موجود' });
    req.user = rows[0];
    next();
  } catch {
    res.status(401).json({ message: 'جلسة غير صالحة' });
  }
}
function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) return res.status(403).json({ message: 'غير مصرح' });
    next();
  };
}

app.get('/api/health', (req, res) => res.json({ ok: true }));

app.post('/api/auth/register', async (req, res) => {
  const {
    full_name, phone, password, email, age, country, city, gender, role,
    bio, place_id, case_description, preferred_visit_times, preferred_visitor_gender,
    specialization, workplace
  } = req.body;

  if (!full_name || !phone || !password || !age || !city || !gender || !role) {
    return res.status(400).json({ message: 'بيانات التسجيل ناقصة' });
  }
  if (!['volunteer', 'patient', 'doctor', 'place_supervisor'].includes(role)) {
    return res.status(400).json({ message: 'نوع الحساب غير صحيح' });
  }
  if (role === 'patient' && !place_id) {
    return res.status(400).json({ message: 'يجب اختيار المكان' });
  }

  const exists = await pool.query('SELECT id FROM users WHERE phone=$1', [phone]);
  if (exists.rows[0]) return res.status(409).json({ message: 'رقم الجوال مسجل بالفعل' });

  const hash = await bcrypt.hash(password, 10);
  const userResult = await pool.query(
    `INSERT INTO users (full_name, phone, password_hash, email, age, country, city, gender, role, status)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'active')
     RETURNING id, full_name, phone, email, role, status`,
    [full_name, phone, hash, email || null, age, country || 'مصر', city, gender, role]
  );
  const user = userResult.rows[0];

  if (role === 'volunteer') {
    await pool.query('INSERT INTO volunteer_profiles (user_id, bio) VALUES ($1,$2)', [user.id, bio || '']);
  }
  if (role === 'doctor') {
    await pool.query('INSERT INTO doctor_profiles (user_id, specialization, workplace, bio) VALUES ($1,$2,$3,$4)', [user.id, specialization || '', workplace || '', bio || '']);
  }
  if (role === 'patient') {
    await pool.query(
      `INSERT INTO patient_profiles (user_id, place_id, case_description, preferred_visit_times, preferred_visitor_gender, current_status)
       VALUES ($1,$2,$3,$4,$5,'أرحب بالزيارات')`,
      [user.id, place_id, case_description || '', preferred_visit_times || '', preferred_visitor_gender || 'any']
    );
  }

  res.status(201).json({ user, token: tokenFor(user) });
});

app.post('/api/auth/login', async (req, res) => {
  const { phone, password } = req.body;
  const { rows } = await pool.query('SELECT * FROM users WHERE phone=$1', [phone]);
  const user = rows[0];
  if (!user) return res.status(401).json({ message: 'بيانات الدخول غير صحيحة' });
  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) return res.status(401).json({ message: 'بيانات الدخول غير صحيحة' });
  const safeUser = { id:user.id, full_name:user.full_name, phone:user.phone, email:user.email, role:user.role, status:user.status };
  res.json({ user: safeUser, token: tokenFor(safeUser) });
});

app.get('/api/places', async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM places ORDER BY id DESC');
  res.json(rows);
});

app.get('/api/cases', async (req, res) => {
  const { rows } = await pool.query(`
    SELECT pp.id, u.full_name, u.age, u.city, u.gender, pp.case_description, pp.preferred_visit_times,
           p.name AS place_name, p.map_link
    FROM patient_profiles pp
    JOIN users u ON u.id=pp.user_id
    LEFT JOIN places p ON p.id=pp.place_id
    ORDER BY pp.id DESC
  `);
  res.json(rows);
});

app.get('/api/cases/:id', async (req, res) => {
  const { rows } = await pool.query(`
    SELECT pp.id, u.full_name, u.age, u.city, u.gender, pp.case_description, pp.preferred_visit_times, pp.preferred_visitor_gender,
           p.name AS place_name, p.city AS place_city, p.address, p.map_link
    FROM patient_profiles pp
    JOIN users u ON u.id=pp.user_id
    LEFT JOIN places p ON p.id=pp.place_id
    WHERE pp.id=$1
  `, [req.params.id]);
  if (!rows[0]) return res.status(404).json({ message: 'الحالة غير موجودة' });
  res.json(rows[0]);
});

app.post('/api/visits', auth, requireRole('volunteer'), async (req, res) => {
  const { patient_id, requested_date, requested_time, message } = req.body;
  if (!patient_id || !requested_date || !requested_time) return res.status(400).json({ message: 'بيانات طلب الزيارة ناقصة' });

  const volunteer = await pool.query('SELECT id FROM volunteer_profiles WHERE user_id=$1', [req.user.id]);
  if (!volunteer.rows[0]) return res.status(403).json({ message: 'يجب تسجيل الدخول كمتطوع لطلب الزيارة' });

  const patient = await pool.query('SELECT id FROM patient_profiles WHERE id=$1', [patient_id]);
  if (!patient.rows[0]) return res.status(404).json({ message: 'الحالة غير موجودة' });

  const { rows } = await pool.query(
    `INSERT INTO visit_requests (volunteer_id, patient_id, requested_date, requested_time, message, status)
     VALUES ($1,$2,$3,$4,$5,'pending') RETURNING *`,
    [volunteer.rows[0].id, patient_id, requested_date, requested_time, message || '']
  );
  res.status(201).json(rows[0]);
});

app.get('/api/admin/users', auth, requireRole('admin'), async (req, res) => {
  const { rows } = await pool.query('SELECT id, full_name, phone, email, age, country, city, gender, role, status, created_at FROM users ORDER BY id DESC');
  res.json(rows);
});
app.get('/api/admin/places', auth, requireRole('admin'), async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM places ORDER BY id DESC');
  res.json(rows);
});
app.post('/api/admin/places', auth, requireRole('admin'), async (req, res) => {
  const { name, type, country, city, address, phone, map_link, description } = req.body;
  const { rows } = await pool.query(
    `INSERT INTO places (name, type, country, city, address, phone, map_link, description)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
    [name, type, country || 'مصر', city, address || '', phone || '', map_link || '', description || '']
  );
  res.status(201).json(rows[0]);
});
app.get('/api/admin/patients', auth, requireRole('admin'), async (req, res) => {
  const { rows } = await pool.query(`
    SELECT pp.id, u.full_name, u.phone, u.age, u.city, pp.case_description, p.name AS place_name
    FROM patient_profiles pp JOIN users u ON u.id=pp.user_id LEFT JOIN places p ON p.id=pp.place_id
    ORDER BY pp.id DESC
  `);
  res.json(rows);
});
app.get('/api/admin/visits', auth, requireRole('admin'), async (req, res) => {
  const { rows } = await pool.query(`
    SELECT vr.*, vu.full_name AS volunteer_name, pu.full_name AS patient_name
    FROM visit_requests vr
    JOIN volunteer_profiles vp ON vp.id=vr.volunteer_id
    JOIN users vu ON vu.id=vp.user_id
    JOIN patient_profiles pp ON pp.id=vr.patient_id
    JOIN users pu ON pu.id=pp.user_id
    ORDER BY vr.id DESC
  `);
  res.json(rows);
});
app.patch('/api/admin/visits/:id', auth, requireRole('admin'), async (req, res) => {
  const { status } = req.body;
  if (!['pending','approved','rejected','completed','cancelled'].includes(status)) return res.status(400).json({ message:'حالة غير صحيحة' });
  const { rows } = await pool.query('UPDATE visit_requests SET status=$1 WHERE id=$2 RETURNING *', [status, req.params.id]);
  res.json(rows[0]);
});

app.use(express.static('dist'));
app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) return res.status(404).json({ message: 'API route not found' });
  res.sendFile(process.cwd() + '/dist/index.html');
});

app.listen(PORT, () => console.log(`Wanes server running on ${PORT}`));
