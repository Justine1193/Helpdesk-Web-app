import http from 'node:http'
import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'

dotenv.config()

import { initSocket } from './lib/socket.js'
import { errorHandler } from './middleware/error.middleware.js'
import authRouter from './routes/auth.routes.js'
import ticketRouter from './routes/ticket.routes.js'
import assetRouter from './routes/asset.routes.js'
import userRouter from './routes/user.routes.js'
import reportRouter from './routes/report.routes.js'
import healthRouter from './routes/health.routes.js'

const app = express()
const server = http.createServer(app)

const clientOrigin = process.env.CLIENT_URL || 'http://localhost:5173'

// Enable CORS
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl) or matching client
      if (!origin || origin.startsWith('http://localhost') || origin === clientOrigin) {
        callback(null, true)
      } else {
        callback(null, true)
      }
    },
    credentials: true
  })
)

app.use(express.json())

// Initialize Socket.IO
initSocket(server, true)

// Base API index & health check
app.get('/', (_req, res) => res.json({ service: 'helpdesk-pro-backend', status: 'online' }))
app.use('/api/health', healthRouter)

// Mount API Route Handlers
app.use('/api/auth', authRouter)
app.use('/api/tickets', ticketRouter)
app.use('/api/assets', assetRouter)
app.use('/api/users', userRouter)
app.use('/api/reports', reportRouter)

// Centralized error handling
app.use(errorHandler)

const port = Number(process.env.PORT || 4000)

server.listen(port, () => {
  console.log(`[HelpDesk Pro] API and WebSocket server listening on http://localhost:${port}`)
})
