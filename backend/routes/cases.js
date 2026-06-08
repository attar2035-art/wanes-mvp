import express from 'express'
import { supabase } from '../supabase.js'

const router = express.Router()

// GET كل الحالات (مرضى نشطين)
router.get('/', async (req, res) => {
  const { governorate, place_type, city } = req.query
  
  let query = supabase
    .from('users')
    .select('id, display_name, story, need, governorate, city, place, place_type, visit_status, lat, lng, created_at')
    .eq('role', 'مريض')
    .eq('status', 'active')

  if (governorate) query = query.eq('governorate', governorate)
  if (place_type) query = query.eq('place_type', place_type)
  if (city) query = query.eq('city', city)

  const { data, error } = await query.order('created_at', { ascending: false })
  if (error) return res.status(500).json({ error })
  res.json(data)
})

// GET حالة واحدة
router.get('/:id', async (req, res) => {
  const { data, error } = await supabase
    .from('users')
    .select('id, display_name, story, need, governorate, city, place, place_type, visit_status, lat, lng')
    .eq('id', req.params.id)
    .eq('role', 'مريض')
    .single()
  if (error) return res.status(404).json({ error })
  res.json(data)
})

// GET إحصائيات
router.get('/stats/overview', async (req, res) => {
  const { data: patients } = await supabase
    .from('users')
    .select('id, place_type, visit_status, governorate')
    .eq('role', 'مريض')
    .eq('status', 'active')

  const { data: visits } = await supabase
    .from('visits')
    .select('id, status')

  const stats = {
    total_patients: patients?.length || 0,
    total_visits: visits?.length || 0,
    pending_visits: visits?.filter(v => v.status === 'pending').length || 0,
    completed_visits: visits?.filter(v => v.status === 'completed').length || 0,
    by_place_type: {},
    by_governorate: {}
  }

  patients?.forEach(p => {
    stats.by_place_type[p.place_type] = (stats.by_place_type[p.place_type] || 0) + 1
    stats.by_governorate[p.governorate] = (stats.by_governorate[p.governorate] || 0) + 1
  })

  res.json(stats)
})

export default router
