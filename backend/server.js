import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}))

app.use(express.json())

// Routes
import usersRouter from './routes/users.js'
import visitsRouter from './routes/visits.js'
import casesRouter from './routes/cases.js'

app.use('/api/users', usersRouter)
app.use('/api/visits', visitsRouter)
app.use('/api/cases', casesRouter)

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'وانس API تعمل بشكل صحيح 🤝',
    version: '1.0.0'
  })
})

app.listen(PORT, () => {
  console.log(`✅ وانس Backend يعمل على البورت ${PORT}`)
})
