import { Router } from 'express'
import {
  getTickets,
  getTicketById,
  createTicket,
  updateTicket,
  assignTicket,
  addComment,
  resolveTicket,
  rateTicket
} from '../controllers/ticket.controller.js'
import { requireAuth, requireRole } from '../middleware/auth.middleware.js'

const router = Router()

router.use(requireAuth)

router.get('/', getTickets)
router.post('/', createTicket)
router.get('/:id', getTicketById)
router.patch('/:id', updateTicket)
router.post('/:id/assign', requireRole('ADMIN'), assignTicket)
router.post('/:id/comments', addComment)
router.post('/:id/resolve', requireRole('TECHNICIAN', 'ADMIN'), resolveTicket)
router.post('/:id/rate', rateTicket)

export default router
