import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

function isBcryptHash(str: string): boolean {
  return /^\$2[aby]\$\d{2}\$.{53}$/.test(str)
}

async function migrateExistingPasswords() {
  const profiles = await prisma.profile.findMany()
  let migrated = 0

  for (const profile of profiles) {
    if (!isBcryptHash(profile.password)) {
      const hashedPassword = await bcrypt.hash(profile.password, 10)
      await prisma.profile.update({
        where: { id: profile.id },
        data: { password: hashedPassword }
      })
      migrated++
    }
  }

  console.log(`✅ Migrated ${migrated} of ${profiles.length} accounts to bcrypt hashes.`)
}

migrateExistingPasswords()
  .catch((e) => {
    console.error('Migration error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
