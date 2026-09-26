import { Router } from 'express'
import { getUsers, updateUserRole } from '../controllers/user.controller.js'
import { requireAuth, requireRole } from '../middleware/auth.middleware.js'

const router = Router()

router.use(requireAuth)
router.use(requireRole('ADMIN'))

router.get('/', getUsers)
router.patch('/:id', updateUserRole)

export default router
