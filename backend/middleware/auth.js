import admin from 'firebase-admin'
import dotenv from 'dotenv'

dotenv.config()

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    })
  })
}

// Middleware للتحقق من التوكن
export const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'غير مصرح' })
  }

  const token = authHeader.split('Bearer ')[1]
  try {
    const decoded = await admin.auth().verifyIdToken(token)
    req.user = decoded
    next()
  } catch (err) {
    return res.status(401).json({ error: 'توكن غير صالح' })
  }
}

// Middleware للتحقق من دور الأدمن
export const verifyAdmin = async (req, res, next) => {
  await verifyToken(req, res, async () => {
    const { supabase } = await import('../supabase.js')
    const { data } = await supabase
      .from('users')
      .select('role')
      .eq('phone', req.user.phone_number)
      .single()

    if (data?.role !== 'أدمن') {
      return res.status(403).json({ error: 'غير مسموح' })
    }
    next()
  })
}

export default { verifyToken, verifyAdmin }
