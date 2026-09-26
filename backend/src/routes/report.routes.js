import { Router } from 'express'
import { getDashboardReport, getAuditLogs } from '../controllers/report.controller.js'
import { requireAuth, requireRole } from '../middleware/auth.middleware.js'

const router = Router()

router.use(requireAuth)

router.get('/dashboard', getDashboardReport)
router.get('/audit-logs', requireRole('ADMIN'), getAuditLogs)

export default router
