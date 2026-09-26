import bcrypt from 'bcrypt'
import { store } from '../services/store.service.js'
import { generateToken } from '../middleware/auth.middleware.js'

export async function login(req, res, next) {
  try {
    const { email, password } = req.body
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: { code: 'BAD_REQUEST', message: 'Email and password are required' }
      })
    }

    const user = store.findUserByEmail(email)
    if (!user) {
      return res.status(401).json({
        success: false,
        error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' }
      })
    }

    const isValid = await bcrypt.compare(password, user.passwordHash)
    if (!isValid) {
      return res.status(401).json({
        success: false,
        error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' }
      })
    }

    const token = generateToken(user)
    const { passwordHash, ...safeUser } = user

    res.json({
      success: true,
      data: {
        token,
        user: safeUser
      }
    })
  } catch (err) {
    next(err)
  }
}

export async function register(req, res, next) {
  try {
    const { name, email, password, role, department } = req.body
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        error: { code: 'BAD_REQUEST', message: 'Name, email, and password are required' }
      })
    }

    const newUser = store.createUser({
      name,
      email,
      password,
      role: role || 'USER',
      department: department || 'Product Design'
    })

    const token = generateToken(newUser)
    const { passwordHash, ...safeUser } = newUser

    res.status(201).json({
      success: true,
      data: {
        token,
        user: safeUser
      }
    })
  } catch (err) {
    next(err)
  }
}

export async function getMe(req, res) {
  const { passwordHash, ...safeUser } = req.user
  res.json({
    success: true,
    data: {
      user: safeUser
    }
  })
}
