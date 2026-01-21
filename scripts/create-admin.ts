/**
 * Create an admin user
 * Usage: npx ts-node scripts/create-admin.ts <email> <password> [name]
 */

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const email = process.argv[2]
  const password = process.argv[3]
  const name = process.argv[4] || 'Admin'

  if (!email || !password) {
    console.log('Usage: npx ts-node scripts/create-admin.ts <email> <password> [name]')
    console.log('Example: npx ts-node scripts/create-admin.ts admin@kaching.com SecurePass123 "Admin User"')
    process.exit(1)
  }

  const hash = await bcrypt.hash(password, 10)

  // Check if user exists
  const existing = await prisma.users.findUnique({ where: { email } })

  if (existing) {
    // Update existing user
    const user = await prisma.users.update({
      where: { email },
      data: {
        password_hash: hash,
        role: 'super_admin',
        is_active: true
      }
    })
    console.log(`Updated existing user: ${user.email} (role: super_admin)`)
  } else {
    // Create new user
    const user = await prisma.users.create({
      data: {
        email,
        name,
        password_hash: hash,
        role: 'super_admin',
        is_active: true
      }
    })
    console.log(`Created new admin: ${user.email}`)
  }

  console.log('You can now login at /login')
}

main()
  .catch(e => {
    console.error('Error:', e.message)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
