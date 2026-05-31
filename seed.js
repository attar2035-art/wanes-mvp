import bcrypt from 'bcryptjs';
import { pool } from '../lib/db.js';

async function upsertAdmin() {
  const hash = await bcrypt.hash('123456Ee', 10);
  await pool.query(`
    INSERT INTO users (full_name, phone, password_hash, email, age, country, city, gender, role, status)
    VALUES ('عبد الرحمن الأدمن', '01000000000', $1, 'ceo@hawafel.com', 48, 'مصر', 'القاهرة', 'male', 'admin', 'active')
    ON CONFLICT (phone) DO UPDATE SET password_hash=$1, role='admin', status='active', email='ceo@hawafel.com'
  `, [hash]);
}

async function seedPlaces() {
  const places = [
    ['مستشفى 57357','hospital','القاهرة','السيدة زينب، القاهرة','19057','https://maps.google.com/?q=مستشفى+57357+القاهرة','مستشفى أطفال متخصص'],
    ['مستشفى الناس','hospital','القليوبية','شبرا الخيمة، القليوبية','16863','https://maps.google.com/?q=مستشفى+الناس+شبرا+الخيمة','مستشفى خيري'],
    ['مستشفى أبو الريش','hospital','القاهرة','المنيرة، القاهرة','','https://maps.google.com/?q=مستشفى+أبو+الريش+للأطفال','مستشفى أطفال'],
    ['مستشفى بهية','hospital','الجيزة','الشيخ زايد، الجيزة','16602','https://maps.google.com/?q=مستشفى+بهية+الشيخ+زايد','مستشفى دعم وعلاج'],
    ['دار أيتام الأورمان','orphanage','الجيزة','الجيزة، مصر','','https://maps.google.com/?q=دار+أيتام+الأورمان+الجيزة','دار أيتام'],
    ['دار مسنين السلام','elderly_home','القاهرة','القاهرة، مصر','','https://maps.google.com/?q=دار+مسنين+السلام+القاهرة','دار رعاية مسنين']
  ];
  for (const p of places) {
    await pool.query(`
      INSERT INTO places (name,type,country,city,address,phone,map_link,description)
      VALUES ($1,$2,'مصر',$3,$4,$5,$6,$7)
      ON CONFLICT DO NOTHING
    `, p);
  }
}

async function seedDemoUsers() {
  const patientHash = await bcrypt.hash('123456Ee', 10);
  const volunteerHash = await bcrypt.hash('123456Ee', 10);
  const place = await pool.query('SELECT id FROM places LIMIT 1');
  const placeId = place.rows[0]?.id;
  if (!placeId) return;

  const patient = await pool.query(`
    INSERT INTO users (full_name, phone, password_hash, age, country, city, gender, role, status)
    VALUES ('أحمد محمد', '01111111111', $1, 41, 'مصر', 'القاهرة', 'male', 'patient', 'active')
    ON CONFLICT (phone) DO UPDATE SET role='patient'
    RETURNING id
  `, [patientHash]);
  await pool.query(`
    INSERT INTO patient_profiles (user_id, place_id, case_description, preferred_visit_times, preferred_visitor_gender, current_status)
    VALUES ($1,$2,'يحتاج إلى زيارة ودعم معنوي أثناء فترة العلاج','من 5 مساء إلى 8 مساء','any','أرحب بالزيارات')
    ON CONFLICT (user_id) DO NOTHING
  `, [patient.rows[0].id, placeId]);

  const volunteer = await pool.query(`
    INSERT INTO users (full_name, phone, password_hash, age, country, city, gender, role, status)
    VALUES ('محمد المتطوع', '01222222222', $1, 33, 'مصر', 'القاهرة', 'male', 'volunteer', 'active')
    ON CONFLICT (phone) DO UPDATE SET role='volunteer'
    RETURNING id
  `, [volunteerHash]);
  await pool.query('INSERT INTO volunteer_profiles (user_id,bio) VALUES ($1,$2) ON CONFLICT (user_id) DO NOTHING', [volunteer.rows[0].id, 'أحب زيارة المرضى وتقديم الدعم المعنوي']);
}

await upsertAdmin();
await seedPlaces();
await seedDemoUsers();

console.log('Database seeded');
await pool.end();
