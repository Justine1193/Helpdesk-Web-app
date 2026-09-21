import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  await prisma.user.upsert({
    where: { email: 'admin@northstar.local' },
    update: {},
    create: {
      name: 'Alex Morgan',
      email: 'admin@northstar.local',
      passwordHash: 'replace-with-bcrypt-hash',
      role: 'ADMIN',
    },
  })
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => prisma.$disconnect())
