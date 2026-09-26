# Helpdesk Pro — Agent Guide & Architecture Blueprint (`AGENTS.md`)

This document is the single source of truth and operational instruction manual for AI coding agents and human engineers contributing to the **HelpDesk Pro** system. All architectural decisions, coding practices, entity schemas, API endpoints, role permissions, and phase roadmaps documented here must be adhered to strictly.

---

## 1. System Vision & Objective

**HelpDesk Pro** is an enterprise-grade internal IT support and operations management platform. It allows:
- **Employees (USER)** to report technical incidents, track progress, comment, upload diagnostic screenshots, and rate resolved services.
- **Technicians (TECHNICIAN)** to inspect assigned queues, transition ticket states, log internal troubleshooting notes, and track asset maintenance.
- **Administrators (ADMIN)** to supervise all operational metrics, manage user roles/departments, oversee IT inventory, review audit trails, and export analytical reports.

---

## ⚡ Quick Operational Rules for Agents

All AI agents and engineers working on this repository must adhere to these 6 golden directives:
1. **Tech Stack**: Frontend (`React 19` + `Vite` + `TypeScript`/`Tailwind CSS` + `Lucide Icons`), Backend (`Node.js` + `Express 5` + `Prisma 7` + `PostgreSQL 18` + `Socket.IO` + `JWT` + `bcrypt` + `Zod`).
2. **Database First**: Follow the full Prisma schema in Section 5 (`User`, `Department`, `Ticket`, `TicketComment`, `Attachment`, `Asset`, `Maintenance`, `Notification`, `AuditLog`).
3. **Role Enforcement**: Strict RBAC for `USER`, `TECHNICIAN`, and `ADMIN` across both backend Express middleware (`requireAuth`, `requireRole`) and frontend routing guards.
4. **Validation**: Validate all backend mutations with Zod schemas. Disallow unverified inputs or arbitrary fields.
5. **Real-Time Layer**: Emit bi-directional Socket.IO events (`ticket:created`, `ticket:assigned`, `ticket:updated`, `ticket:comment`, `notification:new`) on all mutations.
6. **Milestone Order**: Complete the 10-step vertical slice flow (User registers -> logs in -> creates ticket -> admin assigns -> technician updates -> resolves -> user rates & closes) before dashboard/extra modules.

---

## 2. Technology Stack & Workspace Architecture

The repository is structured as an npm workspaces monorepo containing decoupled `frontend` and `backend` services.

### Core Stack Matrix

| Layer | Technology | Version / Tooling |
| :--- | :--- | :--- |
| **Monorepo** | npm Workspaces | Node.js 22+, npm 10+ |
| **Frontend** | React + Vite + TypeScript | React 19, Vite 8, React Router v7 |
| **Styling & UI** | Tailwind CSS + Lucide Icons | Modern dark/light UI tokens, Lucide React |
| **Visualizations**| Recharts | Interactive incident trends & SLA metrics |
| **HTTP Client** | Axios | Configured with base URL & auth interceptors |
| **Backend API** | Node.js + Express.js + TS | Express 5, RESTful conventions |
| **Realtime** | Socket.IO | Bi-directional events for updates & notifications |
| **Database** | PostgreSQL | PostgreSQL 18+ |
| **ORM** | Prisma | Prisma 7+ with client generation and migrations |
| **Auth & Security** | JWT + bcrypt | Bearer token authorization, password salting |
| **Validation** | Zod | Server-side request schema verification |
| **File Storage** | Cloudinary | Ticket attachments (screenshots, logs, PDFs) |
| **Deployment** | Vercel + Render/Railway | Vercel (Frontend), Render/Railway (Backend) |

---

## 3. Recommended Directory Structure

Agents must place new files into their respective dedicated modules rather than creating ad-hoc folders:

```text
Helpdesk Pro/
├── package.json               # Root workspace orchestrator
├── README.md                  # Project documentation
├── AGENTS.md                  # Agent instruction blueprint (this file)
│
├── frontend/                  # Client-side React Application
│   ├── package.json
│   ├── vite.config.js
│   ├── index.html
│   └── src/
│       ├── main.jsx (or main.tsx)
│       ├── App.jsx (or App.tsx)
│       ├── index.css
│       ├── components/        # Reusable UI primitives (Buttons, Modals, Badges, Tables)
│       ├── layouts/           # Shell layouts (Navbar, Sidebar, AppShell)
│       ├── pages/             # Route views (Dashboard, Tickets, Assets, Users, Reports)
│       ├── routes/            # Route definitions & Role-based ProtectedRoute guards
│       ├── services/          # API layer (axios instance, authService, ticketService)
│       ├── hooks/             # Custom hooks (useAuth, useSocket, useTickets)
│       └── types/             # TypeScript definitions and interfaces
│
└── backend/                   # Server-side API & Database
    ├── package.json
    ├── .env.example
    ├── prisma.config.ts
    ├── prisma/
    │   ├── schema.prisma      # Prisma ORM schema
    │   └── seed.js            # Initial role, user, and demo data seed script
    └── src/
        ├── server.js          # Express app + Socket.IO server initialization
        ├── controllers/       # HTTP request handlers (auth, tickets, assets, etc.)
        ├── routes/            # Express route declarations (/api/auth, /api/tickets, etc.)
        ├── middleware/        # Auth middleware, role guards, Zod validators, error handler
        ├── services/          # Business logic, database interactions, third-party APIs
        ├── utils/             # Helpers, JWT sign/verify, logger, formatters
        └── lib/               # Shared clients (prismaClient, cloudinary, socketServer)
```

---

## 4. Role-Based Access Control (RBAC) Matrix

HelpDesk Pro enforces three discrete roles across both backend middleware and client-side route guards:

| Permission / Action | USER | TECHNICIAN | ADMIN |
| :--- | :---: | :---: | :---: |
| Register / Login | ✅ | ✅ | ✅ |
| Create ticket | ✅ | ✅ | ✅ |
| View own tickets | ✅ | ✅ | ✅ |
| View all tickets / work queue | ❌ | ✅ | ✅ |
| Change ticket status & resolution | ❌ | ✅ | ✅ |
| Assign technician to ticket | ❌ | ❌ | ✅ |
| Post public comment | ✅ | ✅ | ✅ |
| Post internal troubleshooting note | ❌ | ✅ | ✅ |
| Rate resolved ticket & close | ✅ | ❌ | ✅ |
| Manage IT Asset Inventory | ❌ | ✅ (View/Update) | ✅ (Full CRUD) |
| Manage Preventive Maintenance | ❌ | ✅ (Perform) | ✅ (Full CRUD) |
| Manage Users & Assign Roles | ❌ | ❌ | ✅ |
| View Analytics & System Reports | ❌ | ❌ | ✅ |
| View Audit Logs | ❌ | ❌ | ✅ |

### Server Middleware Standards
```typescript
requireAuth()                          // Validates JWT bearer token
requireRole("ADMIN")                   // Restricts to administrators
requireRole("TECHNICIAN", "ADMIN")     // Technicians or admins
```

---

## 5. Domain Model & Prisma Database Schema

The database model in `backend/prisma/schema.prisma` should encompass all operational records:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

enum Role {
  USER
  TECHNICIAN
  ADMIN
}

enum TicketPriority {
  LOW
  MEDIUM
  HIGH
  URGENT
}

enum TicketStatus {
  OPEN
  ASSIGNED
  IN_PROGRESS
  WAITING_FOR_USER
  RESOLVED
  CLOSED
}

enum AssetStatus {
  IN_USE
  AVAILABLE
  UNDER_REPAIR
  DECOMMISSIONED
}

model Department {
  id        String   @id @default(cuid())
  name      String   @unique
  users     User[]
  assets    Asset[]
  createdAt DateTime @default(now())
}

model User {
  id             String          @id @default(cuid())
  name           String
  email          String          @unique
  passwordHash   String
  role           Role            @default(USER)
  departmentId   String?
  department     Department?     @relation(fields: [departmentId], references: [id])
  createdTickets Ticket[]        @relation("TicketCreator")
  assignedTickets Ticket[]       @relation("TicketAssignee")
  comments       TicketComment[]
  attachments    Attachment[]
  maintenances   Maintenance[]
  notifications  Notification[]
  auditLogs      AuditLog[]
  createdAt      DateTime        @default(now())
  updatedAt      DateTime        @updatedAt
}

model Ticket {
  id           String          @id @default(cuid())
  ticketNumber String          @unique
  title        String
  description  String
  priority     TicketPriority  @default(MEDIUM)
  status       TicketStatus    @default(OPEN)
  creatorId    String
  creator      User            @relation("TicketCreator", fields: [creatorId], references: [id])
  technicianId String?
  technician   User?           @relation("TicketAssignee", fields: [technicianId], references: [id])
  assetId      String?
  asset        Asset?          @relation(fields: [assetId], references: [id])
  rating       Int?            // Rating from 1-5 upon resolution
  feedback     String?
  comments     TicketComment[]
  attachments  Attachment[]
  createdAt    DateTime        @default(now())
  updatedAt    DateTime        @updatedAt
}

model TicketComment {
  id         String   @id @default(cuid())
  ticketId   String
  ticket     Ticket   @relation(fields: [ticketId], references: [id], onDelete: Cascade)
  userId     String
  user       User     @relation(fields: [userId], references: [id])
  message    String
  isInternal Boolean  @default(false)
  createdAt  DateTime @default(now())
}

model Attachment {
  id           String   @id @default(cuid())
  ticketId     String
  ticket       Ticket   @relation(fields: [ticketId], references: [id], onDelete: Cascade)
  uploadedById String
  uploadedBy   User     @relation(fields: [uploadedById], references: [id])
  url          String
  fileName     String
  fileType     String
  fileSize     Int
  createdAt    DateTime @default(now())
}

model Asset {
  id           String        @id @default(cuid())
  assetTag     String        @unique
  type         String
  brand        String
  model        String
  serialNumber String        @unique
  status       AssetStatus   @default(AVAILABLE)
  departmentId String?
  department   Department?   @relation(fields: [departmentId], references: [id])
  tickets      Ticket[]
  maintenances Maintenance[]
  createdAt    DateTime      @default(now())
  updatedAt    DateTime      @updatedAt
}

model Maintenance {
  id           String   @id @default(cuid())
  assetId      String
  asset        Asset    @relation(fields: [assetId], references: [id], onDelete: Cascade)
  technicianId String
  technician   User     @relation(fields: [technicianId], references: [id])
  type         String
  notes        String
  performedAt  DateTime @default(now())
  nextDueAt    DateTime?
  createdAt    DateTime @default(now())
}

model Notification {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  title     String
  message   String
  read      Boolean  @default(false)
  linkUrl   String?
  createdAt DateTime @default(now())
}

model AuditLog {
  id        String   @id @default(cuid())
  userId    String?
  user      User?    @relation(fields: [userId], references: [id])
  action    String
  entity    String
  entityId  String
  metadata  Json?
  createdAt DateTime @default(now())
}
```

---

## 6. Ticket Lifecycle & Workflow Rules

Tickets strictly progress through the following status state machine:

```
[ OPEN ]
   │
   ▼ (Admin assigns technician or technician claims)
[ ASSIGNED ]
   │
   ▼ (Technician starts diagnostics)
[ IN_PROGRESS ]
   ├──► [ WAITING_FOR_USER ] (Awaiting additional employee logs/replies)
   │         │
   │         ▼ (Employee replies)
   │    [ IN_PROGRESS ]
   │
   ▼ (Technician implements fix & marks resolved)
[ RESOLVED ]
   │
   ▼ (Employee confirms resolution & rates experience)
[ CLOSED ]
```

### Validation Invariants:
1. When transitioning to `ASSIGNED`, `technicianId` must be non-null.
2. Only an `ADMIN` can assign/reassign tickets across any technician.
3. A `USER` can only change a ticket status to `CLOSED` (confirming resolution) or submit rating feedback on a `RESOLVED` ticket.
4. Input validation **must** be enforced on the backend with **Zod** (title length, description, priority values, valid enum states).

---

## 7. API Specification & Endpoints

### 7.1 Authentication & User Management
- `POST /api/auth/register` — Create a new user account (default role: `USER`).
- `POST /api/auth/login` — Authenticate credentials, return JWT access token and user profile.
- `GET /api/auth/me` — Return currently authenticated user context via Bearer token.
- `POST /api/auth/logout` — Invalidate session/cookie if applicable.
- `GET /api/users` — List users (`ADMIN` only).
- `PATCH /api/users/:id` — Update role/department (`ADMIN` only).
- `DELETE /api/users/:id` — Deactivate user account (`ADMIN` only).

### 7.2 Ticket Operations
- `GET /api/tickets` — Query tickets with filtering (`status`, `priority`, `search`, pagination).
  - Users receive only their created tickets.
  - Technicians receive assigned tickets + open tickets queue.
  - Admins receive all tickets.
- `POST /api/tickets` — Create a new ticket (validates title, description, priority, asset).
- `GET /api/tickets/:id` — Full ticket detail with comments, attachments, timeline.
- `PATCH /api/tickets/:id` — Update ticket properties (status, priority).
- `DELETE /api/tickets/:id` — Remove ticket (`ADMIN` only).
- `POST /api/tickets/:id/assign` — Assign technician to ticket (`ADMIN` only).
- `POST /api/tickets/:id/resolve` — Mark ticket resolved with resolution notes (`TECHNICIAN`, `ADMIN`).
- `POST /api/tickets/:id/rate` — User rates resolution (1-5 stars) and adds closing review.
- `POST /api/tickets/:id/comments` — Add comment or internal technician note.

### 7.3 Assets & Maintenance
- `GET /api/assets` — List inventory assets with department & status filters.
- `POST /api/assets` — Register asset (`ADMIN`).
- `PATCH /api/assets/:id` — Modify asset details or status.
- `GET /api/assets/:id/maintenance` — View maintenance logs.
- `POST /api/assets/:id/maintenance` — Record maintenance run.

### 7.4 Analytics & Export
- `GET /api/reports/dashboard` — Summary cards and metrics.
- `GET /api/reports/export?format=csv` — Export ticket/asset datasets.
- `GET /api/audit-logs` — Paginated admin audit logs.

---

## 8. Realtime Architecture (Socket.IO)

Both server (`backend/src/server.js`) and client (`frontend/src/hooks/useSocket.js`) communicate over WebSocket events:

| Socket Event Name | Trigger Context | Payload |
| :--- | :--- | :--- |
| `ticket:created` | New ticket logged by employee | `{ ticketId, title, priority, creator }` |
| `ticket:assigned` | Technician assigned to ticket | `{ ticketId, technicianId, technicianName }` |
| `ticket:updated` | Status or priority changed | `{ ticketId, status, priority, updatedBy }` |
| `ticket:comment` | New comment or reply added | `{ ticketId, commentId, author, message }` |
| `notification:new`| Direct notification to specific user | `{ id, title, message, linkUrl }` |

**Rule**: Agents must ensure realtime events update client UI optimistically or invalidate the active cache without requiring full page reload.

---

## 9. File Upload Strategy (Cloudinary)

- File uploads are orchestrated via a controlled backend endpoint (`POST /api/attachments/upload`).
- **MIME Type Allowlist**: `image/png`, `image/jpeg`, `application/pdf`.
- **Size Thresholds**: Maximum 5 MB for images; Maximum 10 MB for PDFs.
- Credentials (`CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`) must remain strictly in `backend/.env` and never leaked to the client bundle.
- The returned secure URL, asset metadata, and size are recorded in PostgreSQL via the `Attachment` model.

---

## 10. Development Roadmap & Execution Phases

Do not build all components simultaneously. Agents must work iteratively through these 12 phases:

```text
Phase 1: Project Setup + Git + Environment Configuration
Phase 2: PostgreSQL + Complete Prisma Schema + Migration Execution
Phase 3: Express API Foundation + Error Handling + Logger
Phase 4: Authentication Engine + Password Hashing + JWT + RBAC Middleware
Phase 5: React Layout + AppShell + React Router + Protected Routes
Phase 6: Ticket CRUD + Status Transition Engine + Technician Assignment
Phase 7: Ticket Comments + File Uploads (Cloudinary Integration)
Phase 8: Real-Time Event Layer (Socket.IO Notifications)
Phase 9: IT Asset Management + Preventive Maintenance Records
Phase 10: Admin Dashboard + Recharts Visualizations + CSV Exports
Phase 11: Security Hardening + Zod Request Validation + End-to-End Testing
Phase 12: Production Build Optimization + Vercel/Render Deployment Config
```

### The Recommended First Milestone (Vertical Slice)
Before developing advanced analytical dashboards or inventory modules, agents must verify this complete end-to-end vertical slice:
1. User registers an account.
2. User authenticates and receives JWT.
3. User files a new ticket.
4. Admin reviews ticket in management queue.
5. Admin assigns ticket to a Technician.
6. Technician receives assignment and acknowledges.
7. Technician updates ticket status to `IN_PROGRESS` and adds note.
8. User inspects status change in real time.
9. Technician marks ticket `RESOLVED`.
10. User confirms resolution, submits 5-star rating, and closes ticket.

---

## 11. Security & Quality Checklist for Agents

When implementing or modifying code, agents must verify each of the following:

- [ ] **Password Security**: Passwords hashed with `bcrypt` (minimum 10 salt rounds); plain-text passwords never stored or logged.
- [ ] **Credential Protection**: Zero secrets or credentials committed to Git; all sensitive variables loaded via environment variables (`.env`).
- [ ] **Dual-Layer RBAC**: Enforce permissions on the backend API layer; never rely solely on frontend hidden buttons or UI guards.
- [ ] **Input Sanitization & Validation**: Validate all incoming payloads with Zod schemas. Disallow malformed UUIDs/CUIDs and arbitrary fields.
- [ ] **Generic Auth Errors**: Authentication failures must return generic error messages (e.g. `"Invalid email or password"`) to prevent email enumeration.
- [ ] **SQL & Query Injection Prevention**: Leverage Prisma parameterized queries exclusively; no raw unsanitized SQL string concatenation.
- [ ] **CORS Configuration**: Explicitly whitelist authorized frontend origins (`process.env.CLIENT_URL`).
- [ ] **Audit Trail**: Mutating administrative actions (role updates, deletions, technician assignment) must write an entry to `AuditLog`.
- [ ] **Error Handling**: Standardized error response structure:
  ```json
  {
    "success": false,
    "error": {
      "code": "BAD_REQUEST",
      "message": "Human readable explanation"
    }
  }
  ```

---

## 12. Standard Developer Commands

### Environment Setup & Dependency Installation
```powershell
# From the repository root
npm install

# Setup backend environment file
Copy-Item backend/.env.example backend/.env
```

### Local Development Servers
```powershell
# Run frontend dev server (Vite: http://localhost:5173)
npm run dev:frontend

# Run backend dev server (Express: http://localhost:4000)
npm run dev:backend
```

### Database Management (Prisma)
```powershell
# Generate Prisma Client
npm run db:generate

# Run schema migrations
npm run db:migrate

# Seed database with initial roles & accounts
npm run db:seed

# Inspect database visually via Prisma Studio
npx prisma studio --schema backend/prisma/schema.prisma
```

### Code Quality & Validation
```powershell
# Run ESLint across packages
npm run lint

# Build production bundle
npm run build
```
