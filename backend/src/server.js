import http from 'node:http'
import express from 'express'
import { Server as SocketServer } from 'socket.io'
import healthRouter from './routes/health.routes.js'

const app = express()
const server = http.createServer(app)
const socketServer = new SocketServer(server, {
  cors: { origin: true, credentials: true },
})
const port = Number(process.env.PORT || 4000)

app.use(express.json())
app.get('/', (_request, response) => response.json({ service: 'helpdesk-pro-backend' }))
app.use('/api/health', healthRouter)

socketServer.on('connection', (socket) => {
  socket.emit('connected', { service: 'helpdesk-pro-backend' })
})

server.listen(port, () => {
  console.log(`Helpdesk API listening on http://localhost:${port}`)
})
