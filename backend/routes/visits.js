import express from 'express'
import { supabase } from '../supabase.js'

const router = express.Router()

// GET كل الزيارات
router.get('/', async (req, res) => {
  const { data, error } = await supabase
    .from('visits')
    .select(`
      *,
      volunteer:volunteer_id (display_name, phone),
      patient:patient_id (display_name, place, city, governorate)
    `)
    .order('created_at', { ascending: false })
  if (error) return res.status(500).json({ error })
  res.json(data)
})

// GET زيارات متطوع معين
router.get('/volunteer/:id', async (req, res) => {
  const { data, error } = await supabase
    .from('visits')
    .select(`
      *,
      patient:patient_id (display_name, place, city, governorate)
    `)
    .eq('volunteer_id', req.params.id)
    .order('created_at', { ascending: false })
  if (error) return res.status(500).json({ error })
  res.json(data)
})

// GET زيارات مريض معين
router.get('/patient/:id', async (req, res) => {
  const { data, error } = await supabase
    .from('visits')
    .select(`
      *,
      volunteer:volunteer_id (display_name, phone)
    `)
    .eq('patient_id', req.params.id)
    .order('created_at', { ascending: false })
  if (error) return res.status(500).json({ error })
  res.json(data)
})

// POST إنشاء زيارة جديدة
router.post('/', async (req, res) => {
  const { data, error } = await supabase
    .from('visits')
    .insert({
      ...req.body,
      status: 'pending',
      created_at: new Date().toISOString()
    })
    .select()
    .single()
  if (error) return res.status(500).json({ error })
  res.json(data)
})

// PUT تحديث حالة الزيارة
router.put('/:id/status', async (req, res) => {
  const { status } = req.body
  const { data, error } = await supabase
    .from('visits')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', req.params.id)
    .select()
    .single()
  if (error) return res.status(500).json({ error })
  res.json(data)
})

// PUT إتمام الزيارة مع ملاحظات
router.put('/:id/complete', async (req, res) => {
  const { notes } = req.body
  const { data, error } = await supabase
    .from('visits')
    .update({ 
      status: 'completed', 
      notes,
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', req.params.id)
    .select()
    .single()
  if (error) return res.status(500).json({ error })
  res.json(data)
})

export default router
