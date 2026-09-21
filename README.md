# Helpdesk Pro

Internal IT service desk platform for employees, technicians, and administrators.

## Workspace structure

```text
frontend/  React + Vite application
backend/   Express + Socket.IO API and Prisma database layer
```

## Requirements

- Node.js 22+
- PostgreSQL 18+

## Install

From the repository root:

```powershell
npm install
```

Copy the backend environment template and set the local PostgreSQL password:

```powershell
Copy-Item backend/.env.example backend/.env
```

## Development

Start the frontend:

```powershell
npm run dev:frontend
```

Start the backend in a second terminal:

```powershell
npm run dev:backend
```

The frontend runs on `http://localhost:5173` and proxies `/api` requests to the backend on port `4000`.

Check the API:

```powershell
Invoke-RestMethod http://localhost:4000/api/health
```

## Database commands

```powershell
npm run db:generate
npm run db:migrate
npm run db:seed
```

The initial Prisma schema is in `backend/prisma/schema.prisma`. Authentication, ticket APIs, Cloudinary uploads, and the complete database model will be added in the next backend milestone.

## Verification

```powershell
npm run lint
npm run build
```
