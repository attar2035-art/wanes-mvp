import express from 'express'
import { supabase } from '../supabase.js'

const router = express.Router()

// GET كل المستخدمين (أدمن بس)
router.get('/', async (req, res) => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) return res.status(500).json({ error })
  res.json(data)
})

// GET مستخدم بالـ phone
router.get('/phone/:phone', async (req, res) => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('phone', req.params.phone)
    .single()
  if (error) return res.status(404).json({ error })
  res.json(data)
})

// POST إنشاء مستخدم جديد
router.post('/', async (req, res) => {
  const { data, error } = await supabase
    .from('users')
    .insert(req.body)
    .select()
    .single()
  if (error) return res.status(500).json({ error })
  res.json(data)
})

// PUT تحديث مستخدم
router.put('/:id', async (req, res) => {
  const { data, error } = await supabase
    .from('users')
    .update(req.body)
    .eq('id', req.params.id)
    .select()
    .single()
  if (error) return res.status(500).json({ error })
  res.json(data)
})

// PUT موافقة على مستخدم (أدمن)
router.put('/:id/approve', async (req, res) => {
  const { data, error } = await supabase
    .from('users')
    .update({ status: 'active', updated_at: new Date().toISOString() })
    .eq('id', req.params.id)
    .select()
    .single()
  if (error) return res.status(500).json({ error })
  res.json(data)
})

// PUT رفض مستخدم (أدمن)
router.put('/:id/reject', async (req, res) => {
  const { data, error } = await supabase
    .from('users')
    .update({ status: 'rejected', updated_at: new Date().toISOString() })
    .eq('id', req.params.id)
    .select()
    .single()
  if (error) return res.status(500).json({ error })
  res.json(data)
})

export default router
