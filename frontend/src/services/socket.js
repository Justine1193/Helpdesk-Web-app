import { io } from 'socket.io-client'

const SOCKET_URL = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace('/api', '')
  : 'http://localhost:4000'

let socket = null

export function getSocket() {
  if (!socket) {
    socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    })

    socket.on('connect', () => {
      console.log('[Socket.IO Client] Connected to real-time server')
    })

    socket.on('connect_error', (error) => {
      console.warn('[Socket.IO Client] Connection issue:', error.message)
    })
  }

  return socket
}
