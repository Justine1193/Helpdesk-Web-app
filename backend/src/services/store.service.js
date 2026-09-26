import bcrypt from 'bcrypt'
import { broadcast } from '../lib/socket.js'

class StoreService {
  constructor() {
    this.departments = [
      { id: 'dept-1', name: 'Product Design' },
      { id: 'dept-2', name: 'IT Operations' },
      { id: 'dept-3', name: 'Engineering' },
      { id: 'dept-4', name: 'Finance & Ops' },
      { id: 'dept-5', name: 'Human Resources' }
    ]

    const passwordHash = bcrypt.hashSync('password123', 10)

    this.users = [
      {
        id: 'usr-admin',
        name: 'Alex Morgan',
        email: 'alex.morgan@northstar.internal',
        passwordHash,
        role: 'ADMIN',
        departmentId: 'dept-2',
        department: 'Platform Administration',
        initials: 'AM',
        createdAt: new Date('2026-01-10T08:00:00Z').toISOString()
      },
      {
        id: 'usr-tech-1',
        name: 'Jordan Lee',
        email: 'jordan.lee@northstar.internal',
        passwordHash,
        role: 'TECHNICIAN',
        departmentId: 'dept-2',
        department: 'IT Operations',
        initials: 'JL',
        createdAt: new Date('2026-01-12T08:00:00Z').toISOString()
      },
      {
        id: 'usr-tech-2',
        name: 'Sam Rivera',
        email: 'sam.rivera@northstar.internal',
        passwordHash,
        role: 'TECHNICIAN',
        departmentId: 'dept-2',
        department: 'IT Operations',
        initials: 'SR',
        createdAt: new Date('2026-02-01T08:00:00Z').toISOString()
      },
      {
        id: 'usr-user-1',
        name: 'Maya Chen',
        email: 'maya.chen@northstar.internal',
        passwordHash,
        role: 'USER',
        departmentId: 'dept-1',
        department: 'Product Design',
        initials: 'MC',
        createdAt: new Date('2026-02-15T08:00:00Z').toISOString()
      },
      {
        id: 'usr-user-2',
        name: 'Noah Williams',
        email: 'noah.williams@northstar.internal',
        passwordHash,
        role: 'USER',
        departmentId: 'dept-3',
        department: 'Engineering',
        initials: 'NW',
        createdAt: new Date('2026-03-01T08:00:00Z').toISOString()
      },
      {
        id: 'usr-user-3',
        name: 'Priya Shah',
        email: 'priya.shah@northstar.internal',
        passwordHash,
        role: 'USER',
        departmentId: 'dept-4',
        department: 'Finance & Ops',
        initials: 'PS',
        createdAt: new Date('2026-03-05T08:00:00Z').toISOString()
      }
    ]

    this.assets = [
      {
        id: 'ast-1',
        assetTag: 'LT-0091',
        type: 'Laptop',
        brand: 'Apple',
        model: 'MacBook Pro 14-inch M3',
        serialNumber: 'SN-APPL-98124',
        status: 'IN_USE',
        assignedTo: 'Maya Chen',
        departmentId: 'dept-1',
        department: 'Product Design',
        condition: 'Good',
        createdAt: new Date('2026-01-15T09:00:00Z').toISOString()
      },
      {
        id: 'ast-2',
        assetTag: 'MN-0138',
        type: 'Monitor',
        brand: 'Dell',
        model: 'UltraSharp 27 4K U2723QE',
        serialNumber: 'SN-DELL-55219',
        status: 'IN_USE',
        assignedTo: 'Noah Williams',
        departmentId: 'dept-3',
        department: 'Engineering',
        condition: 'Good',
        createdAt: new Date('2026-02-10T10:00:00Z').toISOString()
      },
      {
        id: 'ast-3',
        assetTag: 'LT-0087',
        type: 'Laptop',
        brand: 'Lenovo',
        model: 'ThinkPad X1 Carbon Gen 11',
        serialNumber: 'SN-LNVO-44102',
        status: 'AVAILABLE',
        assignedTo: 'Unassigned',
        departmentId: 'dept-2',
        department: 'IT Operations',
        condition: 'Needs review',
        createdAt: new Date('2026-03-01T11:00:00Z').toISOString()
      }
    ]

    this.tickets = [
      {
        id: 'tkt-1048',
        ticketNumber: 'HD-1048',
        title: 'VPN access drops every 20 minutes',
        description:
          'The corporate WireGuard VPN disconnects consistently every 20 minutes when working from home. Reconnecting works temporarily.',
        category: 'Network',
        priority: 'HIGH',
        status: 'IN_PROGRESS',
        creatorId: 'usr-user-1',
        creatorName: 'Maya Chen',
        creatorInitials: 'MC',
        department: 'Product Design',
        technicianId: 'usr-tech-1',
        technicianName: 'Jordan Lee',
        assetId: 'ast-1',
        rating: null,
        feedback: null,
        updated: '12 min ago',
        createdAt: new Date(Date.now() - 3600000).toISOString(),
        updatedAt: new Date(Date.now() - 720000).toISOString(),
        comments: [
          {
            id: 'cmt-1',
            author: 'Maya Chen',
            initials: 'MC',
            role: 'Employee',
            isInternal: false,
            body: 'I tested with my home router rebooted, but the drop persists.',
            createdAt: new Date(Date.now() - 2400000).toISOString(),
            time: '40 min ago'
          },
          {
            id: 'cmt-2',
            author: 'Jordan Lee',
            initials: 'JL',
            role: 'Technician',
            isInternal: false,
            body: 'I am checking the gateway connection logs and will test a new profile with you shortly.',
            createdAt: new Date(Date.now() - 720000).toISOString(),
            time: '12 min ago'
          },
          {
            id: 'cmt-3',
            author: 'Jordan Lee',
            initials: 'JL',
            role: 'Technician',
            isInternal: true,
            body: 'Internal Note: MTU size configuration mismatch identified on endpoint cluster 4.',
            createdAt: new Date(Date.now() - 600000).toISOString(),
            time: '10 min ago'
          }
        ]
      },
      {
        id: 'tkt-1047',
        ticketNumber: 'HD-1047',
        title: 'New starter needs laptop and account setup',
        description:
          'Please prepare a laptop and the standard account access for our new Senior Designer joining next Monday.',
        category: 'Hardware',
        priority: 'MEDIUM',
        status: 'OPEN',
        creatorId: 'usr-admin',
        creatorName: 'Oliver Grant',
        creatorInitials: 'OG',
        department: 'Product Design',
        technicianId: null,
        technicianName: 'Unassigned',
        assetId: null,
        rating: null,
        feedback: null,
        updated: '36 min ago',
        createdAt: new Date(Date.now() - 2160000).toISOString(),
        updatedAt: new Date(Date.now() - 2160000).toISOString(),
        comments: []
      },
      {
        id: 'tkt-1046',
        ticketNumber: 'HD-1046',
        title: 'Cannot open quarterly finance report',
        description:
          'The quarterly finance forecast spreadsheet shows an Access Denied 403 error even though I could open the previous version.',
        category: 'Access',
        priority: 'HIGH',
        status: 'WAITING_FOR_USER',
        creatorId: 'usr-user-3',
        creatorName: 'Priya Shah',
        creatorInitials: 'PS',
        department: 'Finance & Ops',
        technicianId: 'usr-tech-2',
        technicianName: 'Sam Rivera',
        assetId: null,
        rating: null,
        feedback: null,
        updated: '1 hr ago',
        createdAt: new Date(Date.now() - 7200000).toISOString(),
        updatedAt: new Date(Date.now() - 3600000).toISOString(),
        comments: [
          {
            id: 'cmt-4',
            author: 'Sam Rivera',
            initials: 'SR',
            role: 'Technician',
            isInternal: false,
            body: 'Could you confirm whether the error appears in the desktop app and web portal?',
            createdAt: new Date(Date.now() - 3600000).toISOString(),
            time: '1 hr ago'
          }
        ]
      },
      {
        id: 'tkt-1045',
        ticketNumber: 'HD-1045',
        title: 'Replace cracked monitor at desk 4B',
        description:
          'The external monitor at desk 4B has a visible crack across the lower-right LCD panel.',
        category: 'Hardware',
        priority: 'LOW',
        status: 'RESOLVED',
        creatorId: 'usr-user-2',
        creatorName: 'Noah Williams',
        creatorInitials: 'NW',
        department: 'Engineering',
        technicianId: 'usr-tech-1',
        technicianName: 'Jordan Lee',
        assetId: 'ast-2',
        rating: 5,
        feedback: 'Replaced in under two hours, wonderful work!',
        updated: 'Yesterday',
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        updatedAt: new Date(Date.now() - 43200000).toISOString(),
        comments: [
          {
            id: 'cmt-5',
            author: 'Jordan Lee',
            initials: 'JL',
            role: 'Technician',
            isInternal: false,
            body: 'Replacement monitor installed. Please let us know if anything else is needed.',
            createdAt: new Date(Date.now() - 43200000).toISOString(),
            time: 'Yesterday'
          }
        ]
      }
    ]

    this.maintenances = [
      {
        id: 'mnt-1',
        assetId: 'ast-1',
        technicianId: 'usr-tech-1',
        technicianName: 'Jordan Lee',
        type: 'OS Security Patch & Firmware Update',
        notes: 'Updated macOS to 15.1, renewed enterprise profile certificates.',
        performedAt: new Date(Date.now() - 172800000).toISOString(),
        nextDueAt: new Date(Date.now() + 7776000000).toISOString()
      }
    ]

    this.auditLogs = [
      {
        id: 'aud-1',
        userName: 'Alex Morgan',
        action: 'assigned HD-1048 to Jordan Lee',
        time: '12 min ago',
        createdAt: new Date(Date.now() - 720000).toISOString()
      },
      {
        id: 'aud-2',
        userName: 'Jordan Lee',
        action: 'changed HD-1046 status to Waiting for User',
        time: '28 min ago',
        createdAt: new Date(Date.now() - 1680000).toISOString()
      },
      {
        id: 'aud-3',
        userName: 'Alex Morgan',
        action: 'added Sam Rivera as a technician',
        time: '2 hr ago',
        createdAt: new Date(Date.now() - 7200000).toISOString()
      },
      {
        id: 'aud-4',
        userName: 'Maya Chen',
        action: 'rated HD-1045 five stars',
        time: 'Yesterday',
        createdAt: new Date(Date.now() - 86400000).toISOString()
      }
    ]
  }

  // --- USER METHODS ---
  findUserByEmail(email) {
    return this.users.find((u) => u.email.toLowerCase() === email.toLowerCase().trim())
  }

  findUserById(id) {
    return this.users.find((u) => u.id === id)
  }

  createUser({ name, email, password, role = 'USER', department = 'Product Design' }) {
    const existing = this.findUserByEmail(email)
    if (existing) {
      throw new Error('A user with this email address already exists.')
    }

    const passwordHash = bcrypt.hashSync(password, 10)
    const initials = name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)

    const newUser = {
      id: `usr-${Date.now()}`,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      passwordHash,
      role,
      department,
      initials,
      createdAt: new Date().toISOString()
    }

    this.users.push(newUser)
    this.addAuditLog(newUser.name, `registered a new account with role ${role}`)
    return newUser
  }

  listUsers() {
    return this.users.map(({ passwordHash, ...user }) => user)
  }

  updateUser(id, data) {
    const user = this.findUserById(id)
    if (!user) throw new Error('User not found')
    Object.assign(user, data)
    return user
  }

  // --- TICKET METHODS ---
  listTickets({ role, userId, status, priority, search }) {
    let list = [...this.tickets]

    if (role === 'USER' && userId) {
      list = list.filter((t) => t.creatorId === userId)
    } else if (role === 'TECHNICIAN' && userId) {
      // Technicians see their assigned tickets + unassigned open queue
      list = list.filter((t) => t.technicianId === userId || t.status === 'OPEN')
    }

    if (status && status !== 'All tickets' && status !== 'ALL') {
      const normalizedStatus = status.toUpperCase().replace(/\s+/g, '_')
      list = list.filter(
        (t) =>
          t.status.toUpperCase() === normalizedStatus ||
          t.status.toLowerCase() === status.toLowerCase()
      )
    }

    if (priority && priority !== 'ALL') {
      list = list.filter((t) => t.priority.toUpperCase() === priority.toUpperCase())
    }

    if (search) {
      const q = search.toLowerCase()
      list = list.filter(
        (t) =>
          t.ticketNumber.toLowerCase().includes(q) ||
          t.title.toLowerCase().includes(q) ||
          t.category.toLowerCase().includes(q) ||
          t.creatorName.toLowerCase().includes(q) ||
          (t.technicianName && t.technicianName.toLowerCase().includes(q))
      )
    }

    return list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  }

  getTicketById(id) {
    return (
      this.tickets.find(
        (t) => t.id === id || t.ticketNumber.toLowerCase() === id.toLowerCase()
      ) || null
    )
  }

  createTicket({ title, description, category = 'General', priority = 'MEDIUM', assetId, user }) {
    const nextNumber = 1049 + this.tickets.length
    const ticketNumber = `HD-${nextNumber}`
    const initials = user.name
      ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
      : 'US'

    const newTicket = {
      id: `tkt-${nextNumber}`,
      ticketNumber,
      title: title.trim(),
      description: description.trim(),
      category,
      priority: priority.toUpperCase(),
      status: 'OPEN',
      creatorId: user.id,
      creatorName: user.name,
      creatorInitials: initials,
      department: user.department || 'Product Design',
      technicianId: null,
      technicianName: 'Unassigned',
      assetId: assetId || null,
      rating: null,
      feedback: null,
      updated: 'Just now',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      comments: []
    }

    this.tickets.unshift(newTicket)
    this.addAuditLog(user.name, `created ticket ${ticketNumber}: ${title}`)

    // Real-time broadcast to all connected clients
    broadcast('ticket:created', newTicket)

    return newTicket
  }

  updateTicket(id, data, user) {
    const ticket = this.getTicketById(id)
    if (!ticket) throw new Error('Ticket not found')

    if (data.status && data.status !== ticket.status) {
      ticket.status = data.status.toUpperCase().replace(/\s+/g, '_')
      ticket.updated = 'Just now'
      ticket.updatedAt = new Date().toISOString()
      this.addAuditLog(user.name, `changed ${ticket.ticketNumber} status to ${ticket.status}`)
    }

    if (data.priority) {
      ticket.priority = data.priority.toUpperCase()
    }

    broadcast('ticket:updated', ticket)
    return ticket
  }

  assignTicket(id, technicianId, adminUser) {
    const ticket = this.getTicketById(id)
    if (!ticket) throw new Error('Ticket not found')

    const tech = this.findUserById(technicianId)
    if (!tech) throw new Error('Technician not found')

    ticket.technicianId = tech.id
    ticket.technicianName = tech.name
    if (ticket.status === 'OPEN') {
      ticket.status = 'ASSIGNED'
    }
    ticket.updated = 'Just now'
    ticket.updatedAt = new Date().toISOString()

    this.addAuditLog(
      adminUser.name,
      `assigned ${ticket.ticketNumber} to ${tech.name}`
    )

    broadcast('ticket:assigned', {
      ticketId: ticket.id,
      ticketNumber: ticket.ticketNumber,
      technicianId: tech.id,
      technicianName: tech.name,
      status: ticket.status
    })

    broadcast('ticket:updated', ticket)
    return ticket
  }

  addComment(ticketId, user, message, isInternal = false) {
    const ticket = this.getTicketById(ticketId)
    if (!ticket) throw new Error('Ticket not found')

    const newComment = {
      id: `cmt-${Date.now()}`,
      author: user.name,
      initials: user.initials || 'U',
      role: user.role === 'TECHNICIAN' ? 'Technician' : user.role === 'ADMIN' ? 'Admin' : 'You',
      isInternal,
      body: message.trim(),
      createdAt: new Date().toISOString(),
      time: 'Just now'
    }

    ticket.comments.push(newComment)
    ticket.updated = 'Just now'
    ticket.updatedAt = new Date().toISOString()

    broadcast('ticket:comment', {
      ticketId: ticket.id,
      ticketNumber: ticket.ticketNumber,
      comment: newComment
    })

    return newComment
  }

  resolveTicket(id, technicianUser, notes) {
    const ticket = this.getTicketById(id)
    if (!ticket) throw new Error('Ticket not found')

    ticket.status = 'RESOLVED'
    ticket.updated = 'Just now'
    ticket.updatedAt = new Date().toISOString()

    if (notes && notes.trim()) {
      this.addComment(id, technicianUser, notes.trim(), false)
    }

    this.addAuditLog(technicianUser.name, `marked ${ticket.ticketNumber} as Resolved`)
    broadcast('ticket:updated', ticket)
    return ticket
  }

  rateTicket(id, user, rating, feedback) {
    const ticket = this.getTicketById(id)
    if (!ticket) throw new Error('Ticket not found')

    ticket.rating = Number(rating)
    ticket.feedback = feedback?.trim() || null
    ticket.status = 'CLOSED'
    ticket.updated = 'Just now'
    ticket.updatedAt = new Date().toISOString()

    this.addAuditLog(user.name, `rated ${ticket.ticketNumber} ${rating} stars and closed it`)
    broadcast('ticket:updated', ticket)
    return ticket
  }

  // --- ASSETS & MAINTENANCE ---
  listAssets({ status, department }) {
    let list = [...this.assets]
    if (status && status !== 'ALL') {
      list = list.filter((a) => a.status === status)
    }
    if (department && department !== 'ALL') {
      list = list.filter((a) => a.department === department)
    }
    return list
  }

  createAsset(data, user) {
    const nextTag = `AST-${100 + this.assets.length}`
    const newAsset = {
      id: `ast-${Date.now()}`,
      assetTag: data.assetTag || nextTag,
      type: data.type || 'Equipment',
      brand: data.brand || 'Generic',
      model: data.model || '',
      serialNumber: data.serialNumber || `SN-${Date.now()}`,
      status: data.status || 'AVAILABLE',
      assignedTo: data.assignedTo || 'Unassigned',
      department: data.department || 'IT Operations',
      condition: data.condition || 'Good',
      createdAt: new Date().toISOString()
    }
    this.assets.push(newAsset)
    this.addAuditLog(user.name, `registered new asset ${newAsset.assetTag} (${newAsset.model})`)
    return newAsset
  }

  // --- DASHBOARD REPORTS & AUDIT LOGS ---
  getDashboardStats(role, userId) {
    const totalTickets = this.tickets.length
    const openTickets = this.tickets.filter((t) => t.status === 'OPEN').length
    const inProgressTickets = this.tickets.filter(
      (t) => t.status === 'IN_PROGRESS' || t.status === 'ASSIGNED' || t.status === 'WAITING_FOR_USER'
    ).length
    const resolvedTickets = this.tickets.filter(
      (t) => t.status === 'RESOLVED' || t.status === 'CLOSED'
    ).length

    const userOpen = this.tickets.filter((t) => t.creatorId === userId && t.status !== 'CLOSED').length
    const techAssigned = this.tickets.filter((t) => t.technicianId === userId).length

    return {
      totalTickets,
      openTickets,
      inProgressTickets,
      resolvedTickets,
      slaRate: '99.4%',
      avgResolution: '2h 14m',
      userSatisfaction: '4.8 / 5',
      userOpen,
      techAssigned,
      ticketsByStatus: {
        open: openTickets,
        inProgress: inProgressTickets,
        resolved: resolvedTickets
      }
    }
  }

  addAuditLog(userName, action) {
    const log = {
      id: `aud-${Date.now()}`,
      userName,
      action,
      time: 'Just now',
      createdAt: new Date().toISOString()
    }
    this.auditLogs.unshift(log)
    if (this.auditLogs.length > 50) this.auditLogs.pop()
    return log
  }

  listAuditLogs() {
    return this.auditLogs
  }
}

export const store = new StoreService()
