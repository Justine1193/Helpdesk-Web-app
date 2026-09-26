import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding HelpDesk Pro database...')

  // Clean existing records if any
  try {
    await prisma.auditLog.deleteMany()
    await prisma.notification.deleteMany()
    await prisma.maintenance.deleteMany()
    await prisma.attachment.deleteMany()
    await prisma.ticketComment.deleteMany()
    await prisma.ticket.deleteMany()
    await prisma.asset.deleteMany()
    await prisma.user.deleteMany()
    await prisma.department.deleteMany()
  } catch (e) {
    console.log('Initial cleanup note:', e.message)
  }

  // 1. Create Departments
  const deptDesign = await prisma.department.create({ data: { name: 'Product Design' } })
  const deptIT = await prisma.department.create({ data: { name: 'IT Operations' } })
  const deptEngineering = await prisma.department.create({ data: { name: 'Engineering' } })
  const deptFinance = await prisma.department.create({ data: { name: 'Finance & Ops' } })
  const deptHR = await prisma.department.create({ data: { name: 'Human Resources' } })

  const saltRounds = 10
  const passwordHash = await bcrypt.hash('password123', saltRounds)

  // 2. Create Users
  const userAdmin = await prisma.user.create({
    data: {
      name: 'Alex Morgan',
      email: 'alex.morgan@northstar.internal',
      passwordHash,
      role: 'ADMIN',
      departmentId: deptIT.id
    }
  })

  const userTech1 = await prisma.user.create({
    data: {
      name: 'Jordan Lee',
      email: 'jordan.lee@northstar.internal',
      passwordHash,
      role: 'TECHNICIAN',
      departmentId: deptIT.id
    }
  })

  const userTech2 = await prisma.user.create({
    data: {
      name: 'Sam Rivera',
      email: 'sam.rivera@northstar.internal',
      passwordHash,
      role: 'TECHNICIAN',
      departmentId: deptIT.id
    }
  })

  const userEmployee1 = await prisma.user.create({
    data: {
      name: 'Maya Chen',
      email: 'maya.chen@northstar.internal',
      passwordHash,
      role: 'USER',
      departmentId: deptDesign.id
    }
  })

  const userEmployee2 = await prisma.user.create({
    data: {
      name: 'Noah Williams',
      email: 'noah.williams@northstar.internal',
      passwordHash,
      role: 'USER',
      departmentId: deptEngineering.id
    }
  })

  const userEmployee3 = await prisma.user.create({
    data: {
      name: 'Priya Shah',
      email: 'priya.shah@northstar.internal',
      passwordHash,
      role: 'USER',
      departmentId: deptFinance.id
    }
  })

  // 3. Create Assets
  const asset1 = await prisma.asset.create({
    data: {
      assetTag: 'LT-0091',
      type: 'Laptop',
      brand: 'Apple',
      model: 'MacBook Pro 14-inch M3',
      serialNumber: 'SN-APPL-98124',
      status: 'IN_USE',
      assignedTo: 'Maya Chen',
      departmentId: deptDesign.id
    }
  })

  const asset2 = await prisma.asset.create({
    data: {
      assetTag: 'MN-0138',
      type: 'Monitor',
      brand: 'Dell',
      model: 'UltraSharp 27 4K U2723QE',
      serialNumber: 'SN-DELL-55219',
      status: 'IN_USE',
      assignedTo: 'Noah Williams',
      departmentId: deptEngineering.id
    }
  })

  const asset3 = await prisma.asset.create({
    data: {
      assetTag: 'LT-0087',
      type: 'Laptop',
      brand: 'Lenovo',
      model: 'ThinkPad X1 Carbon Gen 11',
      serialNumber: 'SN-LNVO-44102',
      status: 'AVAILABLE',
      departmentId: deptIT.id
    }
  })

  // 4. Create Tickets with Comments
  const ticket1 = await prisma.ticket.create({
    data: {
      ticketNumber: 'HD-1048',
      title: 'VPN access drops every 20 minutes',
      description: 'The corporate WireGuard VPN disconnects consistently every 20 minutes when working from home. Reconnecting works temporarily.',
      category: 'Network',
      priority: 'HIGH',
      status: 'IN_PROGRESS',
      creatorId: userEmployee1.id,
      technicianId: userTech1.id,
      assetId: asset1.id,
      comments: {
        create: [
          {
            userId: userEmployee1.id,
            message: 'I tested with my home router rebooted, but the drop persists.',
            isInternal: false
          },
          {
            userId: userTech1.id,
            message: 'I am reviewing the gateway connection logs and will deploy an updated tunnel profile with you shortly.',
            isInternal: false
          },
          {
            userId: userTech1.id,
            message: 'Internal note: Gateway MTU mismatch observed on node eu-west-vpn-02.',
            isInternal: true
          }
        ]
      }
    }
  })

  const ticket2 = await prisma.ticket.create({
    data: {
      ticketNumber: 'HD-1047',
      title: 'New starter needs laptop and account setup',
      description: 'Please prepare standard laptop and SaaS tool permissions for a Senior Product Designer joining the team next Monday.',
      category: 'Hardware',
      priority: 'MEDIUM',
      status: 'OPEN',
      creatorId: userAdmin.id,
      comments: {
        create: [
          {
            userId: userAdmin.id,
            message: 'Requested device is MacBook Pro 14 + Figma & Slack invites.',
            isInternal: false
          }
        ]
      }
    }
  })

  const ticket3 = await prisma.ticket.create({
    data: {
      ticketNumber: 'HD-1046',
      title: 'Cannot open quarterly finance report',
      description: 'The quarterly finance forecast spreadsheet shows an Access Denied 403 error even though permissions were active last month.',
      category: 'Access',
      priority: 'HIGH',
      status: 'WAITING_FOR_USER',
      creatorId: userEmployee3.id,
      technicianId: userTech2.id,
      comments: {
        create: [
          {
            userId: userTech2.id,
            message: 'Could you confirm if you are accessing via desktop Excel or Office 365 web?',
            isInternal: false
          }
        ]
      }
    }
  })

  const ticket4 = await prisma.ticket.create({
    data: {
      ticketNumber: 'HD-1045',
      title: 'Replace cracked monitor at desk 4B',
      description: 'The external monitor at desk 4B has a hairline crack across the lower right LCD panel.',
      category: 'Hardware',
      priority: 'LOW',
      status: 'RESOLVED',
      creatorId: userEmployee2.id,
      technicianId: userTech1.id,
      assetId: asset2.id,
      rating: 5,
      feedback: 'Replaced in under 2 hours, excellent support!',
      comments: {
        create: [
          {
            userId: userTech1.id,
            message: 'Replacement Dell UltraSharp monitor installed and tested successfully.',
            isInternal: false
          }
        ]
      }
    }
  })

  // 5. Create Maintenance Records
  await prisma.maintenance.create({
    data: {
      assetId: asset1.id,
      technicianId: userTech1.id,
      type: 'OS Security Patch & Firmware Update',
      notes: 'Updated macOS to 15.1, renewed enterprise profile certificates.',
      nextDueAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
    }
  })

  // 6. Create Audit Logs
  await prisma.auditLog.create({
    data: {
      userId: userAdmin.id,
      action: 'ASSIGN_TECHNICIAN',
      entity: 'Ticket',
      entityId: ticket1.id,
      metadata: { ticketNumber: 'HD-1048', assignee: 'Jordan Lee' }
    }
  })

  await prisma.auditLog.create({
    data: {
      userId: userTech1.id,
      action: 'UPDATE_STATUS',
      entity: 'Ticket',
      entityId: ticket1.id,
      metadata: { ticketNumber: 'HD-1048', oldStatus: 'ASSIGNED', newStatus: 'IN_PROGRESS' }
    }
  })

  console.log('Database seeded successfully!')
}

main()
  .catch((e) => {
    console.error('Seed error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
