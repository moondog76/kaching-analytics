/**
 * Seed script to create demo users for testing
 * Run with: npx tsx scripts/seed-users.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding users...\n')

  // Get all merchants
  const merchants = await prisma.merchants.findMany({
    orderBy: { name: 'asc' }
  })

  if (merchants.length === 0) {
    console.log('❌ No merchants found. Import transaction data first.')
    return
  }

  console.log(`Found ${merchants.length} merchants:\n`)
  merchants.forEach((m, i) => {
    console.log(`  ${i + 1}. ${m.name} (${m.id})`)
  })

  // Create super admin
  const superAdmin = await prisma.users.upsert({
    where: { email: 'admin@kaching.ro' },
    update: {},
    create: {
      email: 'admin@kaching.ro',
      name: 'Platform Admin',
      role: 'super_admin',
      is_active: true,
      // No password_hash means demo123 will work
    }
  })
  console.log(`\n✅ Super Admin: admin@kaching.ro (password: demo123)`)

  // Create a user for each merchant
  for (const merchant of merchants) {
    const email = `${merchant.name.toLowerCase().replace(/[^a-z0-9]/g, '')}@demo.com`

    const user = await prisma.users.upsert({
      where: { email },
      update: { merchant_id: merchant.id },
      create: {
        email,
        name: `${merchant.name} Admin`,
        merchant_id: merchant.id,
        role: 'merchant',
        is_active: true,
      }
    })

    console.log(`✅ Merchant User: ${email} → ${merchant.name}`)
  }

  console.log('\n🎉 Seeding complete!')
  console.log('\nAll users can log in with password: demo123')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
