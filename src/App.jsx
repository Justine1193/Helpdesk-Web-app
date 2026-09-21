import { useState } from 'react'
import { BrowserRouter, NavLink, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import './App.css'

const initialTickets = [
  { id: 'HD-1048', title: 'VPN access drops every 20 minutes', category: 'Network', priority: 'High', status: 'In progress', requester: 'Maya Chen', assignee: 'Jordan Lee', updated: '12 min ago', initials: 'MC' },
  { id: 'HD-1047', title: 'New starter needs laptop and accounts', category: 'Hardware', priority: 'Medium', status: 'Open', requester: 'Oliver Grant', assignee: 'Unassigned', updated: '36 min ago', initials: 'OG' },
  { id: 'HD-1046', title: 'Cannot open quarterly finance report', category: 'Access', priority: 'High', status: 'Waiting', requester: 'Priya Shah', assignee: 'Sam Rivera', updated: '1 hr ago', initials: 'PS' },
  { id: 'HD-1045', title: 'Replace cracked monitor at desk 4B', category: 'Hardware', priority: 'Low', status: 'Resolved', requester: 'Noah Williams', assignee: 'Jordan Lee', updated: 'Yesterday', initials: 'NW' },
]

const navigation = [
  { label: 'Overview', to: '/', roles: ['USER', 'TECHNICIAN', 'ADMIN'] },
  { label: 'My tickets', to: '/tickets', roles: ['USER'] },
  { label: 'Work queue', to: '/queue', roles: ['TECHNICIAN'] },
  { label: 'All tickets', to: '/tickets', roles: ['ADMIN'] },
  { label: 'Assets', to: '/assets', roles: ['ADMIN', 'TECHNICIAN'] },
  { label: 'Reports', to: '/reports', roles: ['ADMIN'] },
  { label: 'People', to: '/people', roles: ['ADMIN'] },
  { label: 'Audit log', to: '/audit', roles: ['ADMIN'] },
]

const roleCopy = {
  USER: { name: 'Maya Chen', team: 'Product design', initials: 'MC' },
  TECHNICIAN: { name: 'Jordan Lee', team: 'IT operations', initials: 'JL' },
  ADMIN: { name: 'Alex Morgan', team: 'Platform admin', initials: 'AM' },
}

function App() {
  const [role, setRole] = useState('ADMIN')
  const [tickets, setTickets] = useState(initialTickets)
  const [showNewTicket, setShowNewTicket] = useState(false)

  return (
    <BrowserRouter>
      <AppShell role={role} setRole={setRole}>
        <Routes>
          <Route path="/" element={<Overview role={role} tickets={tickets} onNewTicket={() => setShowNewTicket(true)} />} />
          <Route path="/tickets" element={<TicketList role={role} tickets={tickets} onNewTicket={() => setShowNewTicket(true)} />} />
          <Route path="/queue" element={<TicketList role="TECHNICIAN" tickets={tickets} onNewTicket={() => setShowNewTicket(true)} />} />
          <Route path="/assets" element={<Assets />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/people" element={<People />} />
          <Route path="/audit" element={<AuditLog />} />
          <Route path="*" element={<Overview role={role} tickets={tickets} onNewTicket={() => setShowNewTicket(true)} />} />
        </Routes>
      </AppShell>
      {showNewTicket && <NewTicketModal onClose={() => setShowNewTicket(false)} onCreate={(ticket) => { setTickets((current) => [ticket, ...current]); setShowNewTicket(false) }} />} 
    </BrowserRouter>
  )
}

function AppShell({ role, setRole, children }) {
  const location = useLocation()
  const navigate = useNavigate()
  const person = roleCopy[role]
  const pageTitle = location.pathname === '/' ? 'Overview' : navigation.find((item) => item.to === location.pathname)?.label || 'Overview'
  const visibleNavigation = navigation.filter((item) => item.roles.includes(role))

  return (
    <div className="app-frame">
      <aside className="sidebar">
        <div className="brand"><span className="brand-mark">+</span><span>northstar<span className="brand-dot">.</span></span></div>
        <div className="workspace-label">IT SERVICE DESK</div>
        <nav className="nav-list" aria-label="Main navigation">
          {visibleNavigation.map((item) => <NavLink key={`${item.label}-${item.to}`} to={item.to} className={({ isActive }) => `nav-item ${isActive && (item.to === '/' || location.pathname !== '/') ? 'active' : ''}`}><span className="nav-icon">{item.label.slice(0, 1)}</span>{item.label}</NavLink>)}
        </nav>
        <div className="sidebar-bottom">
          <button className="nav-item nav-button" onClick={() => navigate('/settings')}><span className="nav-icon">S</span>Settings</button>
          <div className="sidebar-help"><span className="help-icon">?</span><div><strong>Need a hand?</strong><small>Visit the help center</small></div></div>
        </div>
      </aside>
      <main className="main-content">
        <header className="topbar">
          <div className="breadcrumbs"><span>Workspace</span><span>/</span><strong>{pageTitle}</strong></div>
          <div className="top-actions"><button className="icon-button" aria-label="Search">⌕</button><button className="icon-button notification" aria-label="Notifications">♢<i /></button><div className="profile"><span className="avatar">{person.initials}</span><div><strong>{person.name}</strong><small>{role}</small></div><select aria-label="Preview role" value={role} onChange={(event) => setRole(event.target.value)}><option value="ADMIN">ADMIN</option><option value="TECHNICIAN">TECHNICIAN</option><option value="USER">USER</option></select></div></div>
        </header>
        <div className="content-wrap">{children}</div>
      </main>
    </div>
  )
}

function PageHeader({ eyebrow, title, description, action }) {
  return <div className="page-header"><div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1><p>{description}</p></div>{action}</div>
}

function Overview({ role, tickets, onNewTicket }) {
  const stats = role === 'USER' ? [['My open tickets', '03', 'Needs attention'], ['Resolved this month', '08', '+2 from last month'], ['Average response', '2h 14m', 'Within target']] : role === 'TECHNICIAN' ? [['Assigned to me', '12', '4 high priority'], ['Due today', '05', '2 overdue'], ['Resolution rate', '94%', '+6% this month']] : [['Open tickets', '24', '+8 this week'], ['Avg. resolution', '3h 42m', '-18% vs last month'], ['Satisfaction', '4.8 / 5', '+0.3 this month']]
  return <>
    <PageHeader eyebrow="Tuesday, September 22, 2026" title={role === 'USER' ? 'Good morning, Maya.' : role === 'TECHNICIAN' ? 'Good morning, Jordan.' : 'Good morning, Alex.'} description={role === 'ADMIN' ? 'Here is what is happening across your service desk today.' : 'Here is the latest activity on your support requests.'} action={<button className="primary-button" onClick={onNewTicket}>+ New ticket</button>} />
    <div className="stat-grid">{stats.map(([label, value, note]) => <div className="stat-card" key={label}><span>{label}</span><strong>{value}</strong><small className={note.startsWith('+') ? 'positive' : ''}>{note}</small></div>)}</div>
    <div className="dashboard-grid">
      <section className="panel activity-panel"><div className="panel-heading"><div><h2>Ticket activity</h2><p>Open requests across your workspace</p></div><button className="text-button">Last 30 days⌄</button></div><div className="chart-wrap"><div className="chart-y"><span>40</span><span>30</span><span>20</span><span>10</span><span>0</span></div><div className="chart"><div className="grid-lines"><i /><i /><i /><i /><i /></div><div className="bars">{[32, 47, 39, 57, 51, 71, 63, 80, 65, 76, 59, 88].map((height, index) => <div className="bar-column" key={index}><div className={`bar ${index > 7 ? 'highlight' : ''}`} style={{ height: `${height}%` }} /><span>{['May', '', 'Jun', '', 'Jul', '', 'Aug', '', 'Sep', '', 'Oct', ''][index]}</span></div>)}</div></div></div></section>
      <section className="panel status-panel"><div className="panel-heading"><div><h2>Ticket status</h2><p>Current workload breakdown</p></div><button className="more-button">•••</button></div><div className="donut-area"><div className="donut"><span>24<strong>total</strong></span></div><div className="legend"><span><i className="dot blue" />Open <b>09</b></span><span><i className="dot amber" />In progress <b>08</b></span><span><i className="dot green" />Resolved <b>07</b></span></div></div></section>
    </div>
    <section className="panel table-panel"><div className="panel-heading"><div><h2>{role === 'TECHNICIAN' ? 'Your work queue' : role === 'USER' ? 'Your recent tickets' : 'Recent ticket activity'}</h2><p>Updated moments ago</p></div><NavLink className="text-button" to={role === 'TECHNICIAN' ? '/queue' : '/tickets'}>View all tickets →</NavLink></div><TicketTable tickets={tickets.slice(0, 4)} /></section>
  </>
}

function TicketList({ role, tickets, onNewTicket }) {
  const [filter, setFilter] = useState('All tickets')
  const visible = filter === 'All tickets' ? tickets : tickets.filter((ticket) => ticket.status === filter)
  return <><PageHeader eyebrow={role === 'TECHNICIAN' ? 'Technician workspace' : 'Service desk'} title={role === 'TECHNICIAN' ? 'Work queue' : 'Tickets'} description={role === 'TECHNICIAN' ? 'Prioritize, update, and resolve the requests assigned to you.' : 'Track every request from first report to resolution.'} action={<button className="primary-button" onClick={onNewTicket}>+ New ticket</button>} /><section className="panel table-panel full-table"><div className="table-toolbar"><div className="filter-tabs">{['All tickets', 'Open', 'In progress', 'Resolved'].map((item) => <button key={item} className={filter === item ? 'selected' : ''} onClick={() => setFilter(item)}>{item}</button>)}</div><button className="filter-button">≡ Filter</button></div><TicketTable tickets={visible} /></section></>
}

function TicketTable({ tickets }) {
  return <div className="ticket-table"><div className="table-row table-head"><span>Ticket</span><span>Requester</span><span>Assignee</span><span>Priority</span><span>Status</span><span>Updated</span></div>{tickets.map((ticket) => <div className="table-row" key={ticket.id}><div className="ticket-cell"><span className="ticket-id">{ticket.id}</span><strong>{ticket.title}</strong><small>{ticket.category}</small></div><div className="requester"><span className="mini-avatar">{ticket.initials}</span>{ticket.requester}</div><span>{ticket.assignee}</span><span><em className={`priority ${ticket.priority.toLowerCase()}`}>{ticket.priority}</em></span><span><em className={`status ${ticket.status.toLowerCase().replace(' ', '-')}`}>{ticket.status}</em></span><span className="muted">{ticket.updated}</span></div>)}</div>
}

function Assets() { return <><PageHeader eyebrow="Inventory" title="Assets" description="Keep track of equipment assigned across the organization." action={<button className="primary-button">+ Add asset</button>} /><div className="stat-grid four"><div className="stat-card"><span>Total assets</span><strong>186</strong><small>Across 4 locations</small></div><div className="stat-card"><span>Assigned</span><strong>164</strong><small className="positive">88% utilization</small></div><div className="stat-card"><span>Needs attention</span><strong>07</strong><small>3 overdue returns</small></div><div className="stat-card"><span>Available</span><strong>15</strong><small>Ready to assign</small></div></div><section className="panel table-panel full-table"><div className="panel-heading"><div><h2>Asset inventory</h2><p>All equipment and devices</p></div><button className="filter-button">≡ Filter</button></div><div className="asset-list">{[['LT-0091', 'MacBook Pro 14-inch', 'Maya Chen', 'In use', 'Good'], ['MN-0138', 'Dell UltraSharp 27', 'Noah Williams', 'In use', 'Good'], ['LT-0087', 'Lenovo ThinkPad X1', 'Available', 'Available', 'Needs review']].map((asset) => <div className="asset-row" key={asset[0]}><span className="asset-icon">▣</span><div><strong>{asset[1]}</strong><small>{asset[0]}</small></div><span>{asset[2]}</span><em className="status resolved">{asset[3]}</em><span className="muted">{asset[4]}</span></div>)}</div></section></> }

function Reports() { return <><PageHeader eyebrow="Insights" title="Reports" description="Understand service performance and where your team needs support." action={<button className="secondary-button">Export report ↓</button>} /><div className="report-grid"><div className="report-card"><span>Tickets resolved</span><strong>148</strong><small className="positive">+12.4% vs last month</small></div><div className="report-card"><span>First response time</span><strong>42m</strong><small className="positive">-8.6% vs last month</small></div><div className="report-card"><span>Customer satisfaction</span><strong>4.8<span>/5</span></strong><small className="positive">+0.3 vs last month</small></div></div><section className="panel report-chart"><div className="panel-heading"><div><h2>Resolution performance</h2><p>Resolved tickets by week</p></div><button className="text-button">This quarter⌄</button></div><div className="report-bars">{[42, 58, 49, 72, 65, 83, 78, 91, 85, 96].map((height, index) => <div key={index}><span style={{ height: `${height}%` }} /><small>W{index + 1}</small></div>)}</div></section></> }

function People() { return <><PageHeader eyebrow="Administration" title="People" description="Manage employees, technicians, and access levels." action={<button className="primary-button">+ Invite person</button>} /><section className="panel table-panel full-table"><div className="table-toolbar"><div className="filter-tabs"><button className="selected">All people 42</button><button>Technicians 08</button><button>Employees 34</button></div><button className="filter-button">⌕ Search</button></div><div className="people-list">{[['AM', 'Alex Morgan', 'Platform admin', 'ADMIN', 'Active'], ['JL', 'Jordan Lee', 'IT operations', 'TECHNICIAN', 'Active'], ['SR', 'Sam Rivera', 'IT operations', 'TECHNICIAN', 'Active'], ['MC', 'Maya Chen', 'Product design', 'USER', 'Active']].map((person) => <div className="person-row" key={person[1]}><span className="avatar">{person[0]}</span><div><strong>{person[1]}</strong><small>{person[2]}</small></div><em className="role-pill">{person[3]}</em><span className="active-state"><i />{person[4]}</span><button className="more-button">•••</button></div>)}</div></section></> }

function AuditLog() { return <><PageHeader eyebrow="Administration" title="Audit log" description="A clear record of changes made across your service desk." /><section className="panel table-panel full-table"><div className="panel-heading"><div><h2>Recent activity</h2><p>All administrative and ticket events</p></div><button className="filter-button">≡ Filter</button></div><div className="audit-list">{[['Alex Morgan', 'assigned HD-1048 to Jordan Lee', '12 min ago'], ['Jordan Lee', 'changed HD-1046 status to Waiting', '28 min ago'], ['Alex Morgan', 'added Sam Rivera as a technician', '2 hr ago'], ['Maya Chen', 'rated HD-1045 five stars', 'Yesterday']].map((event) => <div className="audit-row" key={event[0] + event[1]}><span className="mini-avatar">{event[0].split(' ').map((name) => name[0]).join('')}</span><div><strong>{event[0]}</strong> {event[1]}<small>{event[2]}</small></div></div>)}</div></section></> }

function NewTicketModal({ onClose, onCreate }) { const [title, setTitle] = useState(''); const submit = (event) => { event.preventDefault(); onCreate({ id: `HD-${1050 + Math.floor(Math.random() * 50)}`, title: title || 'New support request', category: 'General', priority: 'Medium', status: 'Open', requester: 'Alex Morgan', assignee: 'Unassigned', updated: 'Just now', initials: 'AM' }) }; return <div className="modal-backdrop" onMouseDown={onClose}><form className="modal" onSubmit={submit} onMouseDown={(event) => event.stopPropagation()}><div className="modal-heading"><div><div className="eyebrow">New request</div><h2>Tell us what is happening</h2></div><button type="button" className="close-button" onClick={onClose}>×</button></div><label>What do you need help with?<input autoFocus value={title} onChange={(event) => setTitle(event.target.value)} placeholder="e.g. I cannot connect to the office Wi-Fi" /></label><label>Category<select><option>General</option><option>Network</option><option>Hardware</option><option>Access</option></select></label><div className="modal-actions"><button type="button" className="secondary-button" onClick={onClose}>Cancel</button><button className="primary-button">Submit ticket</button></div></form></div> }

export default App
