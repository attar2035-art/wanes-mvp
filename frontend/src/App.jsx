import { useState, useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from './firebase'
import { supabase } from './supabase'
import AuthPage from './pages/AuthPage'
import MapPage from './pages/MapPage'
import VolunteerPage from './pages/VolunteerPage'
import PatientPage from './pages/PatientPage'
import AdminPage from './pages/AdminPage'
import DoctorPage from './pages/DoctorPage'
import ProfilePage from './pages/ProfilePage'
import Navbar from './components/Navbar'
import Sidebar from './components/Sidebar'

function App() {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const { data } = await supabase
          .from('users')
          .select('*')
          .eq('phone', firebaseUser.phoneNumber)
          .single()
        setUser(firebaseUser)
        setProfile(data)
      } else {
        setUser(null)
        setProfile(null)
      }
      setLoading(false)
    })
    return () => unsubscribe()
  }, [])

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg)' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🤝</div>
        <div style={{ fontSize: 20, fontWeight: 900, color: 'var(--teal)' }}>وانس</div>
      </div>
    </div>
  )

  return (
    <div className="app">
      {!user ? (
        <Routes>
          <Route path="*" element={<AuthPage onLogin={(u, p) => { setUser(u); setProfile(p) }} />} />
        </Routes>
      ) : (
        <>
          <Navbar user={user} profile={profile} />
          <div style={{ display: 'flex' }}>
            <Sidebar profile={profile} />
            <main style={{ flex: 1, padding: 32, minHeight: 'calc(100vh - 64px)', overflowY: 'auto' }}>
              <Routes>
                <Route path="/" element={<MapPage user={user} profile={profile} />} />
                <Route path="/map" element={<MapPage user={user} profile={profile} />} />
                <Route path="/volunteer" element={profile?.role === 'متطوع' ? <VolunteerPage user={user} profile={profile} /> : <Navigate to="/" />} />
                <Route path="/patient" element={profile?.role === 'مريض' ? <PatientPage user={user} profile={profile} /> : <Navigate to="/" />} />
                <Route path="/admin" element={profile?.role === 'أدمن' ? <AdminPage user={user} profile={profile} /> : <Navigate to="/" />} />
                <Route path="/doctor" element={profile?.role === 'طبيب' ? <DoctorPage user={user} profile={profile} /> : <Navigate to="/" />} />
                <Route path="/profile" element={<ProfilePage user={user} profile={profile} setProfile={setProfile} />} />
                <Route path="*" element={<Navigate to="/" />} />
              </Routes>
            </main>
          </div>
        </>
      )}
    </div>
  )
}

export default App
