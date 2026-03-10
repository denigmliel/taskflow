import { loadEnvConfig } from '@next/env'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

// Load .env/.env.local when running `npm run db:seed` outside Next.js runtime.
loadEnvConfig(process.cwd())

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is missing. Set it in .env or .env.local before running db:seed.')
}

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding personal workspace...')

  // Keep database clean for personal usage.
  await prisma.activityLog.deleteMany()
  await prisma.task.deleteMany()
  await prisma.projectMember.deleteMany()
  await prisma.project.deleteMany()
  await prisma.session.deleteMany()

  const email = 'tongamdeni@gmail.com'
  const name = 'Deni'
  const passwordHash = await bcrypt.hash('abang.deni', 12)

  // Remove other accounts so only your account remains.
  await prisma.user.deleteMany({
    where: { email: { not: email } },
  })

  await prisma.user.upsert({
    where: { email },
    update: {
      name,
      password: passwordHash,
      updatedAt: new Date(),
    },
    create: {
      name,
      email,
      password: passwordHash,
    },
  })

  console.log('Seed selesai.')
  console.log(`Login: ${email}`)
  console.log('Password: abang.deni')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
