import { useState, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import { supabase } from '../supabase'

const placeTypes = ['الكل', 'مستشفى', 'دار مسنين', 'دار أيتام', 'مركز رعاية', 'جهة خيرية']
const placeIcons = { 'مستشفى': '🏥', 'دار مسنين': '🏠', 'دار أيتام': '🌱', 'مركز رعاية': '💙', 'جهة خيرية': '🤲', 'منزل': '🏡' }
const statusColors = { 'تحتاج زيارة': '#e74c3c', 'زيارة مجدولة': '#f39c12', 'مكتملة': '#27ae60' }

function MapPage({ user, profile }) {
  const [cases, setCases] = useState([])
  const [filter, setFilter] = useState('الكل')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(true)
  const [requestSent, setRequestSent] = useState(false)

  useEffect(() => {
    fetchCases()
  }, [])

  const fetchCases = async () => {
    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('role', 'مريض')
      .eq('status', 'active')
    setCases(data || [])
    setLoading(false)
  }

  const filtered = cases.filter(c =>
    (filter === 'الكل' || c.place_type === filter) &&
    (c.display_name?.includes(search) || c.place?.includes(search) || c.city?.includes(search) || c.governorate?.includes(search))
  )

  const handleRequestVisit = async (caseItem) => {
    if (!user || profile?.role !== 'متطوع') return
    const { error } = await supabase.from('visits').insert({
      volunteer_id: user.uid,
      patient_id: caseItem.id,
      status: 'pending',
      created_at: new Date().toISOString()
    })
    if (!error) {
      setRequestSent(true)
      setTimeout(() => setRequestSent(false), 3000)
      setSelected(null)
    }
  }

  const createIcon = (emoji) => L.divIcon({
    html: `<div style="font-size:24px;line-height:1">${emoji}</div>`,
    className: '',
    iconSize: [30, 30],
    iconAnchor: [15, 30]
  })

  return (
    <div>
      {requestSent && (
        <div style={{
          position: 'fixed', top: 80, left: '50%', transform: 'translateX(-50%)',
          background: '#27ae60', color: 'white', padding: '14px 28px',
          borderRadius: 14, fontWeight: 600, zIndex: 9999,
          boxShadow: '0 8px 24px rgba(39,174,96,0.3)'
        }}>✅ تم إرسال طلب الزيارة!</div>
      )}

      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 26, fontWeight: 900 }}>🗺️ خريطة الحالات</div>
        <div style={{ color: 'var(--text-light)', fontSize: 14, marginTop: 4 }}>اعثر على أقرب حالة تحتاج زيارة</div>
      </div>

      {/* Map */}
      <div style={{ borderRadius: 16, overflow: 'hidden', marginBottom: 24, border: '1px solid var(--border)', height: 380 }}>
        <MapContainer center={[26.8206, 30.8025]} zoom={6} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution='&copy; OpenStreetMap'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {filtered.map(c => c.lat && c.lng && (
            <Marker key={c.id} position={[c.lat, c.lng]} icon={createIcon(placeIcons[c.place_type] || '📍')}>
              <Popup>
                <div style={{ fontFamily: 'Cairo, sans-serif', direction: 'rtl', minWidth: 160 }}>
                  <div style={{ fontWeight: 700, marginBottom: 4 }}>{c.display_name || 'مستفيد'}</div>
                  <div style={{ fontSize: 12, color: '#666' }}>{c.place} - {c.city}</div>
                  <div style={{ fontSize: 12, marginTop: 4 }}>{c.need}</div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <input
            style={{ width: '100%', padding: '10px 16px 10px 42px', border: '1.5px solid var(--border)', borderRadius: 10, fontSize: 14 }}
            placeholder="ابحث باسم أو مكان أو مدينة..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }}>🔍</span>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {placeTypes.map(t => (
            <button key={t} onClick={() => setFilter(t)}
              style={{
                padding: '8px 18px', borderRadius: 25,
                border: `1.5px solid ${filter === t ? 'var(--teal)' : 'var(--border)'}`,
                background: filter === t ? 'var(--teal)' : 'white',
                color: filter === t ? 'white' : 'var(--text-light)',
                fontSize: 13, fontWeight: 600, cursor: 'pointer'
              }}>{t}</button>
          ))}
        </div>
      </div>

      {/* Cases Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 48, color: 'var(--text-light)' }}>⏳ جاري التحميل...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {filtered.map(c => (
            <div key={c.id} style={{
              background: 'white', borderRadius: 16, padding: 20,
              boxShadow: 'var(--shadow)', border: '1px solid var(--border)',
              borderRight: `4px solid ${statusColors[c.visit_status] || 'var(--teal)'}`,
              cursor: 'pointer', transition: 'all 0.25s'
            }}
              onClick={() => setSelected(c)}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-3px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700 }}>{c.display_name || 'مستفيد'}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-light)' }}>{c.governorate}</div>
                </div>
                <span style={{
                  padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                  background: (statusColors[c.visit_status] || '#0d7377') + '20',
                  color: statusColors[c.visit_status] || 'var(--teal)'
                }}>{c.visit_status || 'تحتاج زيارة'}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ fontSize: 13, color: 'var(--text-light)' }}>{placeIcons[c.place_type]} <strong style={{ color: 'var(--text)' }}>{c.place}</strong></div>
                <div style={{ fontSize: 13, color: 'var(--text-light)' }}>📍 {c.governorate} - {c.city}</div>
                {c.need && <div style={{ fontSize: 13, color: 'var(--text-light)' }}>❤️ {c.need}</div>}
              </div>
              {profile?.role === 'متطوع' && (
                <button onClick={e => { e.stopPropagation(); handleRequestVisit(c) }}
                  style={{ marginTop: 14, padding: '8px 16px', borderRadius: 10, border: 'none', background: 'var(--teal)', color: 'white', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                  طلب زيارة
                </button>
              )}
            </div>
          ))}
          {filtered.length === 0 && !loading && (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 48, color: 'var(--text-light)' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🔍</div>
              <div style={{ fontSize: 16, fontWeight: 600 }}>لا توجد نتائج</div>
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      {selected && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
          onClick={() => setSelected(null)}>
          <div style={{ background: 'white', borderRadius: 20, padding: 32, width: '90%', maxWidth: 480, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 20, fontWeight: 900, marginBottom: 20 }}>
              {placeIcons[selected.place_type]} {selected.display_name || 'مستفيد'}
            </div>
            {selected.story && (
              <div style={{ background: '#f8fafa', borderRadius: 12, padding: 16, marginBottom: 16, fontSize: 14, lineHeight: 1.8, color: 'var(--text)' }}>
                "{selected.story}"
              </div>
            )}
            {[
              ['المكان', selected.place],
              ['نوع المكان', selected.place_type],
              ['المحافظة', selected.governorate],
              ['المدينة', selected.city],
              ['الاحتياج', selected.need],
            ].filter(([, v]) => v).map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: '#f8fafa', borderRadius: 10, marginBottom: 8 }}>
                <span style={{ color: 'var(--text-light)', fontSize: 13 }}>{k}</span>
                <span style={{ fontWeight: 700, fontSize: 14 }}>{v}</span>
              </div>
            ))}
            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              {profile?.role === 'متطوع' && (
                <button onClick={() => handleRequestVisit(selected)}
                  style={{ flex: 1, padding: 12, borderRadius: 12, border: 'none', background: 'var(--teal)', color: 'white', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                  طلب زيارة
                </button>
              )}
              <button onClick={() => setSelected(null)}
                style={{ flex: 1, padding: 12, borderRadius: 12, border: '1.5px solid var(--border)', background: 'white', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default MapPage
