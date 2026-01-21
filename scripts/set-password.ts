/**
 * Set password for a user
 * Usage: npx ts-node scripts/set-password.ts <email> <password>
 */

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const email = process.argv[2]
  const password = process.argv[3]

  if (!email || !password) {
    console.log('Usage: npx ts-node scripts/set-password.ts <email> <password>')
    console.log('Example: npx ts-node scripts/set-password.ts admin@example.com MySecurePass123')
    process.exit(1)
  }

  const hash = await bcrypt.hash(password, 10)

  const user = await prisma.users.update({
    where: { email },
    data: { password_hash: hash }
  })

  console.log(`Password updated for: ${user.email}`)
}

main()
  .catch(e => {
    console.error('Error:', e.message)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
