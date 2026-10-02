/**
 * seed-admin.ts
 * Creates a SUPER_ADMIN user in the Safedrang database.
 * Run: npx tsx scripts/seed-admin.ts
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

const ADMIN_EMAIL    = 'admin@safedrang.com';
const ADMIN_PASSWORD = 'Safed@2026';
const ADMIN_NAME     = 'Safedrang Admin';

async function main() {
  console.log('🔑 Seeding admin user...\n');

  // Check if already exists
  const existing = await prisma.user.findUnique({ where: { email: ADMIN_EMAIL } });

  if (existing) {
    // Update role to SUPER_ADMIN if it exists but isn't admin
    if (existing.role !== 'SUPER_ADMIN') {
      await prisma.user.update({
        where: { email: ADMIN_EMAIL },
        data: { role: 'SUPER_ADMIN', status: 'ACTIVE' },
      });
      console.log(`✅ Existing user promoted to SUPER_ADMIN`);
    } else {
      console.log(`⚠️  Admin user already exists with SUPER_ADMIN role.`);
    }
  } else {
    const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);

    await prisma.user.create({
      data: {
        name:         ADMIN_NAME,
        email:        ADMIN_EMAIL,
        passwordHash,
        role:         'SUPER_ADMIN',
        status:       'ACTIVE',
      },
    });

    console.log(`✅ Admin user created!`);
  }

  console.log('\n────────────────────────────────');
  console.log(`  Email    : ${ADMIN_EMAIL}`);
  console.log(`  Password : ${ADMIN_PASSWORD}`);
  console.log(`  Role     : SUPER_ADMIN`);
  console.log('────────────────────────────────');
  console.log('\n🚀 You can now log in at /admin/login\n');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
