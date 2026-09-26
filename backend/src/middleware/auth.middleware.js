import jwt from 'jsonwebtoken'
import { store } from '../services/store.service.js'

const JWT_SECRET = process.env.JWT_SECRET || 'helpdesk-pro-super-secret-jwt-key-2026'

export function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      department: user.department || (user.departmentRecord ? user.departmentRecord.name : '')
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  )
}

export function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication token is missing or invalid'
      }
    })
  }

  const token = authHeader.split(' ')[1]
  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    const user = store.findUserById(decoded.id) || decoded
    req.user = user
    next()
  } catch (err) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_TOKEN',
        message: 'Your session has expired. Please sign in again.'
      }
    })
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' }
      })
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: `Access denied. Requires one of: [${roles.join(', ')}]`
        }
      })
    }

    next()
  }
}
