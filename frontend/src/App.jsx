import React, { useState, useEffect, useCallback } from 'react'
import {
  BrowserRouter,
  NavLink,
  Route,
  Routes,
  useLocation,
  useNavigate,
  Navigate
} from 'react-router-dom'
import {
  Shield,
  HelpCircle,
  LogOut,
  Bell,
  Search,
  Plus,
  LayoutDashboard,
  Ticket,
  Boxes,
  BarChart3,
  Users,
  ScrollText,
  Settings,
  Star,
  Check,
  Send,
  UserCheck,
  RefreshCw,
  Radio
} from 'lucide-react'
import Login from './pages/Login.jsx'
import {
  authService,
  ticketService,
  assetService,
  userService,
  reportService
} from './services/api.js'
import { getSocket } from './services/socket.js'
import './App.css'

const navigation = [
  { label: 'Overview', to: '/', roles: ['USER', 'TECHNICIAN', 'ADMIN'], icon: LayoutDashboard },
  { label: 'My tickets', to: '/tickets', roles: ['USER'], icon: Ticket },
  { label: 'Work queue', to: '/queue', roles: ['TECHNICIAN'], icon: Ticket },
  { label: 'All tickets', to: '/tickets', roles: ['ADMIN'], icon: Ticket },
  { label: 'Assets', to: '/assets', roles: ['ADMIN', 'TECHNICIAN'], icon: Boxes },
  { label: 'Reports', to: '/reports', roles: ['ADMIN'], icon: BarChart3 },
  { label: 'People', to: '/people', roles: ['ADMIN'], icon: Users },
  { label: 'Audit log', to: '/audit', roles: ['ADMIN'], icon: ScrollText }
]

function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const token = localStorage.getItem('helpdesk_auth_token')
      const savedUser = localStorage.getItem('helpdesk_auth_user')
      if (token && savedUser) {
        return JSON.parse(savedUser)
      }
      return null
    } catch {
      return null
    }
  })

  const [tickets, setTickets] = useState([])
  const [assets, setAssets] = useState([])
  const [users, setUsers] = useState([])
  const [auditLogs, setAuditLogs] = useState([])
  const [dashboardStats, setDashboardStats] = useState(null)
  const [isLoadingTickets, setIsLoadingTickets] = useState(false)
  const [showNewTicket, setShowNewTicket] = useState(false)
  const [isSocketConnected, setIsSocketConnected] = useState(false)

  // Fetch tickets from backend API
  const refreshTickets = useCallback(async () => {
    if (!currentUser) return
    setIsLoadingTickets(true)
    try {
      const data = await ticketService.getTickets()
      setTickets(data)
    } catch (err) {
      console.error('Failed to load tickets from backend:', err)
    } finally {
      setIsLoadingTickets(false)
    }
  }, [currentUser])

  // Fetch ancillary data
  const refreshAllData = useCallback(async () => {
    if (!currentUser) return
    refreshTickets()
    try {
      const [assetsData, statsData] = await Promise.all([
        assetService.getAssets().catch(() => []),
        reportService.getDashboardStats().catch(() => null)
      ])
      setAssets(assetsData)
      setDashboardStats(statsData)

      if (currentUser.role === 'ADMIN') {
        const [usersData, logsData] = await Promise.all([
          userService.getUsers().catch(() => []),
          reportService.getAuditLogs().catch(() => [])
        ])
        setUsers(usersData)
        setAuditLogs(logsData)
      }
    } catch (e) {
      console.error('Ancillary data load error', e)
    }
  }, [currentUser, refreshTickets])

  useEffect(() => {
    if (currentUser) {
      refreshAllData()
    }
  }, [currentUser, refreshAllData])

  // Real-time Socket.IO Listeners
  useEffect(() => {
    const socket = getSocket()

    const onConnect = () => setIsSocketConnected(true)
    const onDisconnect = () => setIsSocketConnected(false)

    const onTicketCreated = (newTicket) => {
      setTickets((prev) => {
        if (prev.some((t) => t.id === newTicket.id || t.ticketNumber === newTicket.ticketNumber)) {
          return prev
        }
        return [newTicket, ...prev]
      })
    }

    const onTicketUpdated = (updatedTicket) => {
      setTickets((prev) =>
        prev.map((t) =>
          t.id === updatedTicket.id || t.ticketNumber === updatedTicket.ticketNumber
            ? { ...t, ...updatedTicket }
            : t
        )
      )
    }

    const onTicketComment = ({ ticketId, ticketNumber, comment }) => {
      setTickets((prev) =>
        prev.map((t) => {
          if (t.id === ticketId || t.ticketNumber === ticketNumber) {
            const comments = t.comments || []
            if (comments.some((c) => c.id === comment.id)) return t
            return {
              ...t,
              comments: [...comments, comment],
              updated: 'Just now'
            }
          }
          return t
        })
      )
    }

    socket.on('connect', onConnect)
    socket.on('disconnect', onDisconnect)
    socket.on('ticket:created', onTicketCreated)
    socket.on('ticket:updated', onTicketUpdated)
    socket.on('ticket:comment', onTicketComment)

    return () => {
      socket.off('connect', onConnect)
      socket.off('disconnect', onDisconnect)
      socket.off('ticket:created', onTicketCreated)
      socket.off('ticket:updated', onTicketUpdated)
      socket.off('ticket:comment', onTicketComment)
    }
  }, [])

  const handleLoginSuccess = (user) => {
    setCurrentUser(user)
  }

  const handleLogout = () => {
    authService.logout()
    setCurrentUser(null)
  }

  const handleRoleSwitch = async (newRole) => {
    const demo = DEMO_USERS.find((u) => u.role === newRole)
    if (demo) {
      try {
        const result = await authService.login(demo.email, demo.password)
        setCurrentUser(result.user)
      } catch {
        setCurrentUser(demo)
      }
    } else if (currentUser) {
      setCurrentUser({ ...currentUser, role: newRole })
    }
  }

  const handleCreateTicket = async (ticketData) => {
    try {
      const created = await ticketService.createTicket(ticketData)
      setTickets((prev) => [created, ...prev])
      setShowNewTicket(false)
    } catch (err) {
      alert(`Error creating ticket: ${err.message}`)
    }
  }

  const handleAddComment = async (ticketId, message, isInternal = false) => {
    try {
      const newComment = await ticketService.addComment(ticketId, message, isInternal)
      setTickets((prev) =>
        prev.map((t) =>
          t.id === ticketId || t.ticketNumber === ticketId
            ? {
                ...t,
                comments: [...(t.comments || []), newComment],
                updated: 'Just now'
              }
            : t
        )
      )
    } catch (err) {
      alert(`Error adding comment: ${err.message}`)
    }
  }

  const handleStatusChange = async (ticketId, newStatus) => {
    try {
      const updated = await ticketService.updateTicket(ticketId, { status: newStatus })
      setTickets((prev) =>
        prev.map((t) => (t.id === ticketId || t.ticketNumber === ticketId ? { ...t, ...updated } : t))
      )
    } catch (err) {
      alert(`Error updating status: ${err.message}`)
    }
  }

  const handleAssignTechnician = async (ticketId, technicianId) => {
    try {
      const updated = await ticketService.assignTicket(ticketId, technicianId)
      setTickets((prev) =>
        prev.map((t) => (t.id === ticketId || t.ticketNumber === ticketId ? { ...t, ...updated } : t))
      )
    } catch (err) {
      alert(`Error assigning technician: ${err.message}`)
    }
  }

  const handleResolveTicket = async (ticketId, notes) => {
    try {
      const updated = await ticketService.resolveTicket(ticketId, notes)
      setTickets((prev) =>
        prev.map((t) => (t.id === ticketId || t.ticketNumber === ticketId ? { ...t, ...updated } : t))
      )
    } catch (err) {
      alert(`Error resolving ticket: ${err.message}`)
    }
  }

  const handleRateTicket = async (ticketId, rating, feedback) => {
    try {
      const updated = await ticketService.rateTicket(ticketId, rating, feedback)
      setTickets((prev) =>
        prev.map((t) => (t.id === ticketId || t.ticketNumber === ticketId ? { ...t, ...updated } : t))
      )
    } catch (err) {
      alert(`Error submitting rating: ${err.message}`)
    }
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={
            currentUser ? (
              <Navigate to="/" replace />
            ) : (
              <Login onLoginSuccess={handleLoginSuccess} />
            )
          }
        />

        <Route
          path="/*"
          element={
            !currentUser ? (
              <Navigate to="/login" replace />
            ) : (
              <AppShell
                user={currentUser}
                isSocketConnected={isSocketConnected}
                onRoleSwitch={handleRoleSwitch}
                onLogout={handleLogout}
              >
                <Routes>
                  <Route
                    path="/"
                    element={
                      <Overview
                        user={currentUser}
                        tickets={tickets}
                        stats={dashboardStats}
                        onNewTicket={() => setShowNewTicket(true)}
                        onRefresh={refreshAllData}
                      />
                    }
                  />
                  <Route
                    path="/tickets"
                    element={
                      <TicketList
                        user={currentUser}
                        role={currentUser.role}
                        tickets={tickets}
                        isLoading={isLoadingTickets}
                        onNewTicket={() => setShowNewTicket(true)}
                      />
                    }
                  />
                  <Route
                    path="/tickets/:ticketId"
                    element={
                      <TicketDetail
                        user={currentUser}
                        tickets={tickets}
                        users={users}
                        onComment={handleAddComment}
                        onStatusChange={handleStatusChange}
                        onAssign={handleAssignTechnician}
                        onResolve={handleResolveTicket}
                        onRate={handleRateTicket}
                      />
                    }
                  />
                  <Route
                    path="/queue"
                    element={
                      <TicketList
                        user={currentUser}
                        role="TECHNICIAN"
                        tickets={tickets}
                        isLoading={isLoadingTickets}
                        onNewTicket={() => setShowNewTicket(true)}
                      />
                    }
                  />
                  <Route path="/assets" element={<Assets assets={assets} />} />
                  <Route path="/reports" element={<Reports stats={dashboardStats} />} />
                  <Route path="/people" element={<People users={users} />} />
                  <Route path="/audit" element={<AuditLog logs={auditLogs} />} />
                  <Route
                    path="/settings"
                    element={<SettingsPage user={currentUser} onLogout={handleLogout} />}
                  />
                  <Route
                    path="*"
                    element={
                      <Overview
                        user={currentUser}
                        tickets={tickets}
                        stats={dashboardStats}
                        onNewTicket={() => setShowNewTicket(true)}
                        onRefresh={refreshAllData}
                      />
                    }
                  />
                </Routes>
              </AppShell>
            )
          }
        />
      </Routes>

      {showNewTicket && (
        <NewTicketModal
          user={currentUser}
          assets={assets}
          onClose={() => setShowNewTicket(false)}
          onCreate={handleCreateTicket}
        />
      )}
    </BrowserRouter>
  )
}

function AppShell({ user, isSocketConnected, onRoleSwitch, onLogout, children }) {
  const location = useLocation()
  const navigate = useNavigate()
  const role = user?.role || 'USER'
  const pageTitle =
    location.pathname === '/'
      ? 'Overview'
      : navigation.find((item) => item.to === location.pathname)?.label || 'Overview'
  const visibleNavigation = navigation.filter((item) => item.roles.includes(role))

  return (
    <div className="app-frame">
      <aside className="sidebar">
        <div className="brand" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
          <span className="brand-mark">+</span>
          <span>
            northstar<span className="brand-dot">.</span>
          </span>
        </div>
        <div className="workspace-label">
          <span>IT SERVICE DESK</span>
          <span
            title={isSocketConnected ? 'Real-time WebSocket Live' : 'Connecting to WebSocket...'}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              color: isSocketConnected ? '#4ade80' : '#f59e0b',
              fontSize: '9px',
              marginLeft: 'auto'
            }}
          >
            <Radio size={10} className="animate-pulse" />
            {isSocketConnected ? 'LIVE' : 'SYNCING'}
          </span>
        </div>
        <nav className="nav-list" aria-label="Main navigation">
          {visibleNavigation.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={`${item.label}-${item.to}`}
                to={item.to}
                className={({ isActive }) =>
                  `nav-item ${
                    isActive && (item.to === '/' || location.pathname !== '/') ? 'active' : ''
                  }`
                }
              >
                <span className="nav-icon">{Icon ? <Icon size={16} /> : item.label.slice(0, 1)}</span>
                {item.label}
              </NavLink>
            )
          })}
        </nav>
        <div className="sidebar-bottom">
          <button className="nav-item nav-button" onClick={() => navigate('/settings')}>
            <span className="nav-icon">
              <Settings size={16} />
            </span>
            Settings
          </button>
          <button
            className="nav-item nav-button"
            onClick={onLogout}
            style={{ color: '#e5988b' }}
          >
            <span className="nav-icon">
              <LogOut size={16} />
            </span>
            Sign Out
          </button>
          <div className="sidebar-help">
            <span className="help-icon">?</span>
            <div>
              <strong>Need a hand?</strong>
              <small>Visit the help center</small>
            </div>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="breadcrumbs">
            <span>Workspace</span>
            <span>/</span>
            <strong>{pageTitle}</strong>
          </div>
          <div className="top-actions">
            <button className="icon-button" aria-label="Search">
              <Search size={18} />
            </button>
            <button className="icon-button notification" aria-label="Notifications">
              <Bell size={18} />
              <i />
            </button>
            <div className="profile">
              <span className="avatar">{user.initials || 'U'}</span>
              <div>
                <strong>{user.name}</strong>
                <small>{user.department || role}</small>
              </div>
              <span
                className={`role-tag role-${(user.role || 'user').toLowerCase()}`}
                style={{ marginLeft: '6px', fontSize: '10px', padding: '3px 7px' }}
              >
                {user.role}
              </span>
              <button
                className="icon-button"
                onClick={onLogout}
                title="Sign Out"
                style={{ marginLeft: '8px', color: '#78909a' }}
              >
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </header>
        <div className="content-wrap">{children}</div>
      </main>
    </div>
  )
}

function PageHeader({ eyebrow, title, description, action }) {
  return (
    <div className="page-header">
      <div>
        <div className="eyebrow">{eyebrow}</div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {action}
    </div>
  )
}

function Overview({ user, tickets, stats, onNewTicket, onRefresh }) {
  const role = user?.role || 'USER'
  const firstName = user?.name ? user.name.split(' ')[0] : 'there'

  const userOpen = tickets.filter((t) => t.creatorId === user?.id && t.status !== 'CLOSED').length
  const userResolved = tickets.filter((t) => t.creatorId === user?.id && t.status === 'RESOLVED').length
  const techAssigned = tickets.filter((t) => t.technicianId === user?.id).length
  const techOpen = tickets.filter((t) => t.status === 'OPEN').length

  const overviewStats =
    role === 'USER'
      ? [
          ['My open tickets', String(userOpen).padStart(2, '0'), 'Needs attention'],
          ['Resolved tickets', String(userResolved).padStart(2, '0'), '+1 this week'],
          ['Average SLA', '2h 14m', 'Within target']
        ]
      : role === 'TECHNICIAN'
      ? [
          ['Assigned to me', String(techAssigned).padStart(2, '0'), 'Active queue'],
          ['Unassigned Open', String(techOpen).padStart(2, '0'), 'Ready to claim'],
          ['Resolution rate', '96.2%', '+4% this month']
        ]
      : [
          ['Total tickets', String(tickets.length).padStart(2, '0'), 'Live database count'],
          ['Avg. resolution', '2h 14m', '-14% vs target'],
          ['Satisfaction', '4.8 / 5', 'Based on ratings']
        ]

  return (
    <>
      <PageHeader
        eyebrow="Tuesday, September 22, 2026"
        title={`Good morning, ${firstName}.`}
        description={
          role === 'ADMIN'
            ? 'Full-stack operational overview backed by Express & PostgreSQL.'
            : 'Track incident statuses and communicate with the IT support team.'
        }
        action={
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              className="secondary-button"
              onClick={onRefresh}
              title="Refresh from API"
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <RefreshCw size={14} />
              <span>Sync API</span>
            </button>
            <button className="primary-button" onClick={onNewTicket}>
              + New ticket
            </button>
          </div>
        }
      />
      <div className="stat-grid">
        {overviewStats.map(([label, value, note]) => (
          <div className="stat-card" key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
            <small className={note.startsWith('+') ? 'positive' : ''}>{note}</small>
          </div>
        ))}
      </div>
      <div className="dashboard-grid">
        <section className="panel activity-panel">
          <div className="panel-heading">
            <div>
              <h2>Live Ticket Activity</h2>
              <p>Real-time incident distribution</p>
            </div>
            <button className="text-button">All Departments⌄</button>
          </div>
          <div className="chart-wrap">
            <div className="chart-y">
              <span>40</span>
              <span>30</span>
              <span>20</span>
              <span>10</span>
              <span>0</span>
            </div>
            <div className="chart">
              <div className="grid-lines">
                <i />
                <i />
                <i />
                <i />
                <i />
              </div>
              <div className="bars">
                {[35, 48, 38, 55, 52, 70, 62, 82, 66, 78, 60, 89].map((height, index) => (
                  <div className="bar-column" key={index}>
                    <div
                      className={`bar ${index > 7 ? 'highlight' : ''}`}
                      style={{ height: `${height}%` }}
                    />
                    <span>
                      {
                        ['May', '', 'Jun', '', 'Jul', '', 'Aug', '', 'Sep', '', 'Oct', ''][
                          index
                        ]
                      }
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
        <section className="panel status-panel">
          <div className="panel-heading">
            <div>
              <h2>Ticket Status Breakdown</h2>
              <p>Current workload distribution</p>
            </div>
          </div>
          <div className="donut-area">
            <div className="donut">
              <span>
                {tickets.length}
                <strong>total</strong>
              </span>
            </div>
            <div className="legend">
              <span>
                <i className="dot blue" />
                Open <b>{tickets.filter((t) => t.status === 'OPEN').length}</b>
              </span>
              <span>
                <i className="dot amber" />
                In progress{' '}
                <b>
                  {
                    tickets.filter(
                      (t) =>
                        t.status === 'IN_PROGRESS' ||
                        t.status === 'ASSIGNED' ||
                        t.status === 'WAITING_FOR_USER'
                    ).length
                  }
                </b>
              </span>
              <span>
                <i className="dot green" />
                Resolved{' '}
                <b>{tickets.filter((t) => t.status === 'RESOLVED' || t.status === 'CLOSED').length}</b>
              </span>
            </div>
          </div>
        </section>
      </div>
      <section className="panel table-panel">
        <div className="panel-heading">
          <div>
            <h2>
              {role === 'TECHNICIAN'
                ? 'Your assigned work queue'
                : role === 'USER'
                ? 'Your recent tickets'
                : 'Recent ticket activity'}
            </h2>
            <p>Synced with PostgreSQL & Socket.IO</p>
          </div>
          <NavLink
            className="text-button"
            to={role === 'TECHNICIAN' ? '/queue' : '/tickets'}
          >
            View all tickets →
          </NavLink>
        </div>
        <TicketTable tickets={tickets.slice(0, 5)} />
      </section>
    </>
  )
}

function TicketList({ role, tickets, isLoading, onNewTicket }) {
  const [filter, setFilter] = useState('All tickets')
  const [query, setQuery] = useState('')

  const visible = tickets.filter((ticket) => {
    const statusMatch =
      filter === 'All tickets' ||
      ticket.status.toUpperCase().replace(/\s+/g, '_') ===
        filter.toUpperCase().replace(/\s+/g, '_') ||
      ticket.status.toLowerCase() === filter.toLowerCase()

    const searchStr = `${ticket.ticketNumber || ticket.id} ${ticket.title} ${ticket.category} ${
      ticket.creatorName || ticket.requester || ''
    }`.toLowerCase()

    return statusMatch && searchStr.includes(query.toLowerCase())
  })

  return (
    <>
      <PageHeader
        eyebrow={role === 'TECHNICIAN' ? 'Technician workspace' : 'Service desk'}
        title={role === 'TECHNICIAN' ? 'Work queue' : 'Tickets'}
        description={
          role === 'TECHNICIAN'
            ? 'Prioritize, update status, and resolve issues assigned to you.'
            : 'Track every incident from report to confirmation and rating.'
        }
        action={
          <button className="primary-button" onClick={onNewTicket}>
            + New ticket
          </button>
        }
      />
      <section className="panel table-panel full-table">
        <div className="table-toolbar">
          <div className="filter-tabs">
            {['All tickets', 'Open', 'In progress', 'Waiting for user', 'Resolved'].map((item) => (
              <button
                key={item}
                className={filter === item ? 'selected' : ''}
                onClick={() => setFilter(item)}
              >
                {item}
              </button>
            ))}
          </div>
          <label className="search-field">
            <span>⌕</span>
            <input
              aria-label="Search tickets"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by ID, title, requester..."
            />
          </label>
        </div>
        {isLoading ? (
          <div style={{ padding: '30px', textAlign: 'center', color: '#78909a' }}>
            Loading tickets from API...
          </div>
        ) : (
          <TicketTable tickets={visible} />
        )}
      </section>
    </>
  )
}

function TicketTable({ tickets }) {
  if (!tickets || tickets.length === 0) {
    return (
      <div style={{ padding: '40px 20px', textAlign: 'center', color: '#78909a' }}>
        No tickets found matching current criteria.
      </div>
    )
  }

  return (
    <div className="ticket-table">
      <div className="table-row table-head">
        <span>Ticket</span>
        <span>Requester</span>
        <span>Assignee</span>
        <span>Priority</span>
        <span>Status</span>
        <span>Updated</span>
      </div>
      {tickets.map((ticket) => {
        const ticketKey = ticket.id || ticket.ticketNumber
        const num = ticket.ticketNumber || ticket.id
        const creator = ticket.creatorName || ticket.requester || 'Employee'
        const initials = ticket.creatorInitials || ticket.initials || 'EM'
        const assignee = ticket.technicianName || ticket.assignee || 'Unassigned'
        const priority = ticket.priority || 'MEDIUM'
        const status = (ticket.status || 'OPEN').replace(/_/g, ' ')

        return (
          <NavLink
            className="table-row ticket-link"
            to={`/tickets/${num}`}
            key={ticketKey}
          >
            <div className="ticket-cell">
              <span className="ticket-id">{num}</span>
              <strong>{ticket.title}</strong>
              <small>{ticket.category || 'General'}</small>
            </div>
            <div className="requester">
              <span className="mini-avatar">{initials}</span>
              {creator}
            </div>
            <span>{assignee}</span>
            <span>
              <em className={`priority ${priority.toLowerCase()}`}>{priority}</em>
            </span>
            <span>
              <em className={`status ${status.toLowerCase().replace(/\s+/g, '-')}`}>
                {status}
              </em>
            </span>
            <span className="muted">{ticket.updated || 'Recent'}</span>
          </NavLink>
        )
      })}
    </div>
  )
}

function TicketDetail({
  user,
  tickets,
  users,
  onComment,
  onStatusChange,
  onAssign,
  onResolve,
  onRate
}) {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const ticketId = pathname.split('/').pop()
  const ticket = tickets.find(
    (item) => item.id === ticketId || item.ticketNumber?.toLowerCase() === ticketId.toLowerCase()
  )

  const [reply, setReply] = useState('')
  const [isInternal, setIsInternal] = useState(false)
  const [assigneeSelect, setAssigneeSelect] = useState('')
  const [resolveNotes, setResolveNotes] = useState('')
  const [ratingVal, setRatingVal] = useState(5)
  const [feedbackText, setFeedbackText] = useState('')
  const [showResolveModal, setShowResolveModal] = useState(false)
  const [showRateModal, setShowRateModal] = useState(false)

  if (!ticket) {
    return (
      <PageHeader
        eyebrow="Ticket not found"
        title="We could not find that ticket"
        description="It may have been removed or the ID is out of date."
        action={
          <button className="secondary-button" onClick={() => navigate('/tickets')}>
            Back to tickets
          </button>
        }
      />
    )
  }

  const num = ticket.ticketNumber || ticket.id
  const creator = ticket.creatorName || ticket.requester || 'Employee'
  const assignee = ticket.technicianName || ticket.assignee || 'Unassigned'
  const priority = ticket.priority || 'MEDIUM'
  const status = (ticket.status || 'OPEN').replace(/_/g, ' ')
  const isTechnicianOrAdmin = user?.role === 'TECHNICIAN' || user?.role === 'ADMIN'
  const isAdmin = user?.role === 'ADMIN'

  const submitReply = (event) => {
    event.preventDefault()
    if (!reply.trim()) return
    onComment(ticket.id, reply.trim(), isInternal)
    setReply('')
  }

  const handleAssignSubmit = (e) => {
    e.preventDefault()
    if (!assigneeSelect) return
    onAssign(ticket.id, assigneeSelect)
  }

  const handleResolveSubmit = (e) => {
    e.preventDefault()
    onResolve(ticket.id, resolveNotes)
    setShowResolveModal(false)
  }

  const handleRateSubmit = (e) => {
    e.preventDefault()
    onRate(ticket.id, ratingVal, feedbackText)
    setShowRateModal(false)
  }

  return (
    <>
      <button className="back-link" onClick={() => navigate('/tickets')}>
        ← Back to tickets
      </button>

      <div className="detail-header">
        <div>
          <div className="eyebrow">
            {num} · {ticket.category || 'General'}
          </div>
          <h1>{ticket.title}</h1>
          <p>
            Created by {creator} · {ticket.department || 'Product Design'} · Updated{' '}
            {ticket.updated || 'Just now'}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span className={`status ${status.toLowerCase().replace(/\s+/g, '-')}`}>
            {status}
          </span>
          {isTechnicianOrAdmin && ticket.status !== 'RESOLVED' && ticket.status !== 'CLOSED' && (
            <button
              className="primary-button"
              onClick={() => setShowResolveModal(true)}
              style={{ backgroundColor: '#288b72' }}
            >
              Mark Resolved
            </button>
          )}
          {ticket.status === 'RESOLVED' && !ticket.rating && (
            <button
              className="primary-button"
              onClick={() => setShowRateModal(true)}
              style={{ backgroundColor: '#eab308' }}
            >
              Rate Resolution ★
            </button>
          )}
        </div>
      </div>

      <div className="detail-grid">
        <main className="detail-main">
          <section className="panel ticket-summary">
            <div className="detail-meta">
              <span>
                <small>Priority</small>
                <strong className={`priority ${priority.toLowerCase()}`}>
                  {priority}
                </strong>
              </span>
              <span>
                <small>Assigned to</small>
                <strong>{assignee}</strong>
              </span>
              <span>
                <small>Department</small>
                <strong>{ticket.department || 'Product Design'}</strong>
              </span>
            </div>
            <div className="description-block">
              <h2>Incident Description</h2>
              <p>{ticket.description}</p>
            </div>

            {ticket.rating && (
              <div
                style={{
                  marginTop: '20px',
                  padding: '16px',
                  borderRadius: '8px',
                  backgroundColor: '#fefce8',
                  border: '1px solid #fef08a'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      size={16}
                      fill={s <= ticket.rating ? '#eab308' : 'none'}
                      color="#eab308"
                    />
                  ))}
                  <strong style={{ marginLeft: '6px', fontSize: '13px', color: '#854d0e' }}>
                    Resolution Rated {ticket.rating} / 5
                  </strong>
                </div>
                {ticket.feedback && (
                  <p style={{ marginTop: '6px', fontSize: '12px', color: '#713f12' }}>
                    "{ticket.feedback}"
                  </p>
                )}
              </div>
            )}
          </section>

          <section className="panel conversation">
            <div className="panel-heading">
              <div>
                <h2>Live Conversation Thread</h2>
                <p>Public replies and internal diagnostic notes</p>
              </div>
              <span className="conversation-count">
                {ticket.comments?.length || 0} messages
              </span>
            </div>
            <div className="conversation-list">
              {ticket.comments?.length ? (
                ticket.comments.map((comment, index) => {
                  if (comment.isInternal && !isTechnicianOrAdmin) {
                    return null // Internal notes hidden from regular users
                  }
                  return (
                    <article
                      className={`conversation-item ${comment.isInternal ? 'internal-note' : ''}`}
                      key={`${comment.author}-${index}`}
                      style={
                        comment.isInternal
                          ? {
                              backgroundColor: '#fffbeb',
                              border: '1px dashed #fde68a',
                              padding: '12px',
                              borderRadius: '8px'
                            }
                          : {}
                      }
                    >
                      <span className="avatar">{comment.initials || 'U'}</span>
                      <div>
                        <div className="conversation-author">
                          <strong>{comment.author}</strong>
                          <small>
                            {comment.role} · {comment.time || 'Just now'}
                            {comment.isInternal && (
                              <span
                                style={{
                                  marginLeft: '8px',
                                  color: '#b45309',
                                  fontWeight: 700
                                }}
                              >
                                [INTERNAL NOTE]
                              </span>
                            )}
                          </small>
                        </div>
                        <p>{comment.body || comment.message}</p>
                      </div>
                    </article>
                  )
                })
              ) : (
                <p className="empty-state">
                  No updates yet. Send a message to keep the technician informed.
                </p>
              )}
            </div>

            <form className="reply-form" onSubmit={submitReply}>
              <label htmlFor="ticket-reply">
                {isTechnicianOrAdmin ? 'Add a response or internal note' : 'Add a reply'}
              </label>
              <textarea
                id="ticket-reply"
                value={reply}
                onChange={(event) => setReply(event.target.value)}
                placeholder="Share more details, troubleshooting logs, or questions..."
                rows="3"
              />
              <div className="reply-actions">
                {isTechnicianOrAdmin && (
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '11px',
                      color: '#b45309',
                      cursor: 'pointer'
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isInternal}
                      onChange={(e) => setIsInternal(e.target.checked)}
                    />
                    <span>Post as Internal Note (technicians only)</span>
                  </label>
                )}
                <button className="primary-button" style={{ marginLeft: 'auto' }}>
                  Send message
                </button>
              </div>
            </form>
          </section>
        </main>

        <aside className="detail-side">
          {isAdmin && (
            <section className="panel">
              <div className="panel-heading">
                <div>
                  <h2>Assign Technician</h2>
                  <p>Dispatch request to IT Specialist</p>
                </div>
              </div>
              <form onSubmit={handleAssignSubmit} style={{ marginTop: '16px' }}>
                <select
                  value={assigneeSelect}
                  onChange={(e) => setAssigneeSelect(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid #dce7e8',
                    fontSize: '12px',
                    marginBottom: '10px'
                  }}
                >
                  <option value="">Select Technician...</option>
                  <option value="usr-tech-1">Jordan Lee (IT Operations)</option>
                  <option value="usr-tech-2">Sam Rivera (IT Operations)</option>
                  <option value="usr-admin">Alex Morgan (Admin)</option>
                </select>
                <button
                  type="submit"
                  className="primary-button"
                  style={{ width: '100%' }}
                  disabled={!assigneeSelect}
                >
                  Confirm Assignment
                </button>
              </form>
            </section>
          )}

          {isTechnicianOrAdmin && (
            <section className="panel">
              <div className="panel-heading">
                <div>
                  <h2>Status Workflow</h2>
                  <p>State transition machine</p>
                </div>
              </div>
              <div style={{ display: 'grid', gap: '8px', marginTop: '16px' }}>
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => onStatusChange(ticket.id, 'IN_PROGRESS')}
                >
                  Set In Progress
                </button>
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => onStatusChange(ticket.id, 'WAITING_FOR_USER')}
                >
                  Awaiting User Reply
                </button>
              </div>
            </section>
          )}

          <section className="panel">
            <div className="panel-heading">
              <div>
                <h2>Timeline & Audit</h2>
                <p>System events</p>
              </div>
            </div>
            <div className="activity-list">
              <span>
                <i />
                Incident Logged
                <small>{ticket.createdAt ? new Date(ticket.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '09:42'}</small>
              </span>
              <span>
                <i />
                Assigned: {assignee}
                <small>Active</small>
              </span>
              <span>
                <i />
                Status: {status}
                <small>{ticket.updated || 'Recently'}</small>
              </span>
            </div>
          </section>
        </aside>
      </div>

      {/* Resolve Modal */}
      {showResolveModal && (
        <div className="modal-backdrop" onMouseDown={() => setShowResolveModal(false)}>
          <form
            className="modal"
            onSubmit={handleResolveSubmit}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="modal-heading">
              <div>
                <div className="eyebrow">Resolve Incident</div>
                <h2>Provide Resolution Notes</h2>
              </div>
              <button
                type="button"
                className="close-button"
                onClick={() => setShowResolveModal(false)}
              >
                ×
              </button>
            </div>
            <label htmlFor="resolve-notes">
              Resolution Summary
              <textarea
                id="resolve-notes"
                value={resolveNotes}
                onChange={(e) => setResolveNotes(e.target.value)}
                placeholder="Describe what action was taken to remediate the issue..."
                rows="4"
                required
              />
            </label>
            <div className="modal-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={() => setShowResolveModal(false)}
              >
                Cancel
              </button>
              <button className="primary-button">Mark as Resolved</button>
            </div>
          </form>
        </div>
      )}

      {/* Rate Resolution Modal */}
      {showRateModal && (
        <div className="modal-backdrop" onMouseDown={() => setShowRateModal(false)}>
          <form
            className="modal"
            onSubmit={handleRateSubmit}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="modal-heading">
              <div>
                <div className="eyebrow">Service Feedback</div>
                <h2>Rate Your Experience</h2>
              </div>
              <button
                type="button"
                className="close-button"
                onClick={() => setShowRateModal(false)}
              >
                ×
              </button>
            </div>
            <div style={{ display: 'flex', gap: '8px', margin: '14px 0' }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setRatingVal(star)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '4px'
                  }}
                >
                  <Star
                    size={28}
                    fill={star <= ratingVal ? '#eab308' : 'none'}
                    color="#eab308"
                  />
                </button>
              ))}
            </div>
            <label htmlFor="rate-feedback">
              Comments (Optional)
              <textarea
                id="rate-feedback"
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                placeholder="How was the speed and quality of IT support provided?"
                rows="3"
              />
            </label>
            <div className="modal-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={() => setShowRateModal(false)}
              >
                Cancel
              </button>
              <button className="primary-button">Submit Rating & Close</button>
            </div>
          </form>
        </div>
      )}
    </>
  )
}

function Assets({ assets }) {
  const displayAssets =
    assets && assets.length
      ? assets
      : [
          {
            id: 'ast-1',
            assetTag: 'LT-0091',
            model: 'MacBook Pro 14-inch',
            assignedTo: 'Maya Chen',
            status: 'IN_USE',
            condition: 'Good'
          },
          {
            id: 'ast-2',
            assetTag: 'MN-0138',
            model: 'Dell UltraSharp 27',
            assignedTo: 'Noah Williams',
            status: 'IN_USE',
            condition: 'Good'
          },
          {
            id: 'ast-3',
            assetTag: 'LT-0087',
            model: 'Lenovo ThinkPad X1',
            assignedTo: 'Available',
            status: 'AVAILABLE',
            condition: 'Needs review'
          }
        ]

  return (
    <>
      <PageHeader
        eyebrow="Inventory"
        title="Assets"
        description="IT equipment registry synced with PostgreSQL."
        action={<button className="primary-button">+ Add asset</button>}
      />
      <div className="stat-grid four">
        <div className="stat-card">
          <span>Total assets</span>
          <strong>{displayAssets.length}</strong>
          <small>Across active departments</small>
        </div>
        <div className="stat-card">
          <span>Assigned</span>
          <strong>{displayAssets.filter((a) => a.status === 'IN_USE').length}</strong>
          <small className="positive">Active in fleet</small>
        </div>
        <div className="stat-card">
          <span>Needs attention</span>
          <strong>01</strong>
          <small>Scheduled maintenance</small>
        </div>
        <div className="stat-card">
          <span>Available</span>
          <strong>{displayAssets.filter((a) => a.status === 'AVAILABLE').length}</strong>
          <small>Ready to assign</small>
        </div>
      </div>
      <section className="panel table-panel full-table">
        <div className="panel-heading">
          <div>
            <h2>Asset Inventory</h2>
            <p>All equipment and devices</p>
          </div>
          <button className="filter-button">≡ Filter</button>
        </div>
        <div className="asset-list">
          {displayAssets.map((asset) => (
            <div className="asset-row" key={asset.id || asset.assetTag}>
              <span className="asset-icon">▣</span>
              <div>
                <strong>{asset.model || asset.brand}</strong>
                <small>{asset.assetTag}</small>
              </div>
              <span>{asset.assignedTo || 'Unassigned'}</span>
              <em className="status resolved">{asset.status.replace(/_/g, ' ')}</em>
              <span className="muted">{asset.condition || 'Good'}</span>
            </div>
          ))}
        </div>
      </section>
    </>
  )
}

function Reports({ stats }) {
  return (
    <>
      <PageHeader
        eyebrow="Insights"
        title="Reports"
        description="Understand service desk performance, SLA rates, and ticket turnaround."
        action={<button className="secondary-button">Export report ↓</button>}
      />
      <div className="report-grid">
        <div className="report-card">
          <span>SLA Met Compliance</span>
          <strong>{stats?.slaRate || '99.4%'}</strong>
          <small className="positive">Within SLA guidelines</small>
        </div>
        <div className="report-card">
          <span>Average Resolution</span>
          <strong>{stats?.avgResolution || '2h 14m'}</strong>
          <small className="positive">-8.6% vs monthly target</small>
        </div>
        <div className="report-card">
          <span>Customer Satisfaction</span>
          <strong>
            {stats?.userSatisfaction || '4.8 / 5'}
          </strong>
          <small className="positive">5-Star Feedback</small>
        </div>
      </div>
      <section className="panel report-chart">
        <div className="panel-heading">
          <div>
            <h2>Resolution Performance</h2>
            <p>Resolved tickets weekly distribution</p>
          </div>
          <button className="text-button">This quarter⌄</button>
        </div>
        <div className="report-bars">
          {[42, 58, 49, 72, 65, 83, 78, 91, 85, 96].map((height, index) => (
            <div key={index}>
              <span style={{ height: `${height}%` }} />
              <small>W{index + 1}</small>
            </div>
          ))}
        </div>
      </section>
    </>
  )
}

function People({ users }) {
  const displayUsers =
    users && users.length
      ? users
      : [
          { id: '1', initials: 'AM', name: 'Alex Morgan', department: 'Platform admin', role: 'ADMIN', status: 'Active' },
          { id: '2', initials: 'JL', name: 'Jordan Lee', department: 'IT operations', role: 'TECHNICIAN', status: 'Active' },
          { id: '3', initials: 'SR', name: 'Sam Rivera', department: 'IT operations', role: 'TECHNICIAN', status: 'Active' },
          { id: '4', initials: 'MC', name: 'Maya Chen', department: 'Product design', role: 'USER', status: 'Active' }
        ]

  return (
    <>
      <PageHeader
        eyebrow="Administration"
        title="People"
        description="Manage company employees, IT technicians, and role assignments."
        action={<button className="primary-button">+ Invite person</button>}
      />
      <section className="panel table-panel full-table">
        <div className="table-toolbar">
          <div className="filter-tabs">
            <button className="selected">All people ({displayUsers.length})</button>
            <button>Technicians ({displayUsers.filter((u) => u.role === 'TECHNICIAN').length})</button>
            <button>Employees ({displayUsers.filter((u) => u.role === 'USER').length})</button>
          </div>
          <button className="filter-button">⌕ Search</button>
        </div>
        <div className="people-list">
          {displayUsers.map((person) => (
            <div className="person-row" key={person.id || person.name}>
              <span className="avatar">{person.initials || 'U'}</span>
              <div>
                <strong>{person.name}</strong>
                <small>{person.department || person.email}</small>
              </div>
              <em className="role-pill">{person.role}</em>
              <span className="active-state">
                <i />
                Active
              </span>
              <button className="more-button">•••</button>
            </div>
          ))}
        </div>
      </section>
    </>
  )
}

function AuditLog({ logs }) {
  const displayLogs =
    logs && logs.length
      ? logs
      : [
          { id: '1', userName: 'Alex Morgan', action: 'assigned HD-1048 to Jordan Lee', time: '12 min ago' },
          { id: '2', userName: 'Jordan Lee', action: 'changed HD-1046 status to Waiting', time: '28 min ago' },
          { id: '3', userName: 'Alex Morgan', action: 'added Sam Rivera as a technician', time: '2 hr ago' },
          { id: '4', userName: 'Maya Chen', action: 'rated HD-1045 five stars', time: 'Yesterday' }
        ]

  return (
    <>
      <PageHeader
        eyebrow="Administration"
        title="Audit log"
        description="Complete operational trail of administrative, assignment, and status events."
      />
      <section className="panel table-panel full-table">
        <div className="panel-heading">
          <div>
            <h2>Recent Activity Logs</h2>
            <p>Persisted in PostgreSQL database</p>
          </div>
          <button className="filter-button">≡ Filter</button>
        </div>
        <div className="audit-list">
          {displayLogs.map((event) => (
            <div className="audit-row" key={event.id}>
              <span className="mini-avatar">
                {(event.userName || 'System')
                  .split(' ')
                  .map((name) => name[0])
                  .join('')}
              </span>
              <div>
                <strong>{event.userName || 'System'}</strong> {event.action}
                <small>{event.time || 'Recent'}</small>
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  )
}

function SettingsPage({ user, onLogout }) {
  return (
    <>
      <PageHeader
        eyebrow="Account & Preferences"
        title="Settings"
        description="Manage your profile information and active session."
      />
      <div className="dashboard-grid">
        <section className="panel">
          <div className="panel-heading">
            <div>
              <h2>Profile Information</h2>
              <p>Your identity across tickets and notifications</p>
            </div>
          </div>
          <div style={{ marginTop: '20px', display: 'flex', gap: '20px', alignItems: 'center' }}>
            <span className="avatar" style={{ width: '56px', height: '56px', fontSize: '18px' }}>
              {user?.initials || 'U'}
            </span>
            <div>
              <strong style={{ fontSize: '16px', display: 'block' }}>{user?.name}</strong>
              <span style={{ color: '#78909a', fontSize: '13px' }}>{user?.email}</span>
              <div style={{ marginTop: '6px' }}>
                <span className="role-tag role-admin" style={{ fontSize: '11px', padding: '3px 8px' }}>
                  {user?.role} · {user?.department || 'IT Operations'}
                </span>
              </div>
            </div>
          </div>
        </section>

        <section className="panel">
          <div className="panel-heading">
            <div>
              <h2>Session Management</h2>
              <p>Sign out of this device or switch accounts</p>
            </div>
          </div>
          <div style={{ marginTop: '24px' }}>
            <button
              className="secondary-button"
              onClick={onLogout}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#c0392b' }}
            >
              <LogOut size={15} />
              <span>Log out of Northstar</span>
            </button>
          </div>
        </section>
      </div>
    </>
  )
}

function NewTicketModal({ user, assets, onClose, onCreate }) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('Network')
  const [priority, setPriority] = useState('MEDIUM')
  const [assetId, setAssetId] = useState('')

  const submit = (event) => {
    event.preventDefault()
    onCreate({
      title: title || 'New support request',
      description: description || 'No additional details provided.',
      category,
      priority,
      assetId: assetId || null
    })
  }

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <form
        className="modal"
        onSubmit={submit}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="modal-heading">
          <div>
            <div className="eyebrow">New support incident</div>
            <h2>Tell us what is happening</h2>
          </div>
          <button type="button" className="close-button" onClick={onClose}>
            ×
          </button>
        </div>

        <label htmlFor="ticket-title">
          What do you need help with?
          <input
            id="ticket-title"
            autoFocus
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="e.g. Cannot connect to corporate VPN from home"
            required
          />
        </label>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <label htmlFor="ticket-category">
            Category
            <select
              id="ticket-category"
              value={category}
              onChange={(event) => setCategory(event.target.value)}
            >
              <option value="General">General</option>
              <option value="Network">Network / VPN</option>
              <option value="Hardware">Hardware / Laptop</option>
              <option value="Access">Access / Software</option>
            </select>
          </label>

          <label htmlFor="ticket-priority">
            Priority
            <select
              id="ticket-priority"
              value={priority}
              onChange={(event) => setPriority(event.target.value)}
            >
              <option value="LOW">LOW</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="HIGH">HIGH</option>
              <option value="URGENT">URGENT</option>
            </select>
          </label>
        </div>

        <label htmlFor="ticket-description">
          Detailed Description
          <textarea
            id="ticket-description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Explain what steps occurred and any diagnostic error messages seen..."
            rows="4"
          />
        </label>

        <button type="button" className="attachment-button">
          ＋ Add diagnostic log or screenshot
        </button>

        <div className="modal-actions">
          <button type="button" className="secondary-button" onClick={onClose}>
            Cancel
          </button>
          <button className="primary-button">Submit to Queue</button>
        </div>
      </form>
    </div>
  )
}

export default App
