import { Server as SocketServer } from 'socket.io'

let io = null

export function initSocket(httpServer, corsOrigin = true) {
  io = new SocketServer(httpServer, {
    cors: {
      origin: corsOrigin,
      credentials: true
    }
  })

  io.on('connection', (socket) => {
    console.log(`[Socket.IO] Client connected: ${socket.id}`)

    socket.emit('connected', {
      service: 'helpdesk-pro-backend',
      socketId: socket.id,
      timestamp: new Date().toISOString()
    })

    socket.on('disconnect', () => {
      console.log(`[Socket.IO] Client disconnected: ${socket.id}`)
    })
  })

  return io
}

export function getIO() {
  return io
}

export function broadcast(event, payload) {
  if (io) {
    io.emit(event, payload)
    console.log(`[Socket.IO Broadcast] ${event}:`, payload?.ticketNumber || payload?.id || '')
  }
}
