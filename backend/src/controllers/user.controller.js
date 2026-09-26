import { store } from '../services/store.service.js'

export async function getUsers(req, res, next) {
  try {
    const users = store.listUsers()
    res.json({ success: true, data: users })
  } catch (err) {
    next(err)
  }
}

export async function updateUserRole(req, res, next) {
  try {
    const { role, department } = req.body
    const updated = store.updateUser(req.params.id, { role, department })
    const { passwordHash, ...safeUser } = updated
    res.json({ success: true, data: safeUser })
  } catch (err) {
    next(err)
  }
}
