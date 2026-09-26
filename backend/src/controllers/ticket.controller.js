import { store } from '../services/store.service.js'

export async function getTickets(req, res, next) {
  try {
    const { status, priority, search } = req.query
    const tickets = store.listTickets({
      role: req.user.role,
      userId: req.user.id,
      status,
      priority,
      search
    })

    res.json({
      success: true,
      data: tickets
    })
  } catch (err) {
    next(err)
  }
}

export async function getTicketById(req, res, next) {
  try {
    const ticket = store.getTicketById(req.params.id)
    if (!ticket) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Ticket not found' }
      })
    }

    // Role check: USER can only view their own tickets
    if (req.user.role === 'USER' && ticket.creatorId !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'You do not have permission to view this ticket' }
      })
    }

    res.json({
      success: true,
      data: ticket
    })
  } catch (err) {
    next(err)
  }
}

export async function createTicket(req, res, next) {
  try {
    const { title, description, category, priority, assetId } = req.body
    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        error: { code: 'BAD_REQUEST', message: 'Ticket title is required' }
      })
    }

    const ticket = store.createTicket({
      title,
      description: description || 'No additional details provided.',
      category: category || 'General',
      priority: priority || 'MEDIUM',
      assetId,
      user: req.user
    })

    res.status(201).json({
      success: true,
      data: ticket
    })
  } catch (err) {
    next(err)
  }
}

export async function updateTicket(req, res, next) {
  try {
    const { status, priority } = req.body
    const ticket = store.updateTicket(req.params.id, { status, priority }, req.user)
    res.json({
      success: true,
      data: ticket
    })
  } catch (err) {
    next(err)
  }
}

export async function assignTicket(req, res, next) {
  try {
    const { technicianId } = req.body
    if (!technicianId) {
      return res.status(400).json({
        success: false,
        error: { code: 'BAD_REQUEST', message: 'technicianId is required' }
      })
    }

    const ticket = store.assignTicket(req.params.id, technicianId, req.user)
    res.json({
      success: true,
      data: ticket
    })
  } catch (err) {
    next(err)
  }
}

export async function addComment(req, res, next) {
  try {
    const { message, isInternal } = req.body
    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        error: { code: 'BAD_REQUEST', message: 'Comment message cannot be empty' }
      })
    }

    // Only Technicians and Admins can post internal notes
    const internalFlag = isInternal && (req.user.role === 'TECHNICIAN' || req.user.role === 'ADMIN')

    const comment = store.addComment(req.params.id, req.user, message, internalFlag)
    res.status(201).json({
      success: true,
      data: comment
    })
  } catch (err) {
    next(err)
  }
}

export async function resolveTicket(req, res, next) {
  try {
    const { notes } = req.body
    const ticket = store.resolveTicket(req.params.id, req.user, notes)
    res.json({
      success: true,
      data: ticket
    })
  } catch (err) {
    next(err)
  }
}

export async function rateTicket(req, res, next) {
  try {
    const { rating, feedback } = req.body
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        error: { code: 'BAD_REQUEST', message: 'Rating must be a number between 1 and 5' }
      })
    }

    const ticket = store.rateTicket(req.params.id, req.user, rating, feedback)
    res.json({
      success: true,
      data: ticket
    })
  } catch (err) {
    next(err)
  }
}
