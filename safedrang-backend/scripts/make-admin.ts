import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = 'houseofsushmaa@gmail.com';
  console.log(`Checking user: ${email}`);

  let user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() }
  });

  if (!user) {
    console.log(`User not found! Creating new admin with this email...`);
    const passwordHash = await bcrypt.hash('Safed@2026', 12);
    user = await prisma.user.create({
      data: {
        name: 'House of Sushmaa',
        email: email.toLowerCase(),
        passwordHash,
        role: 'SUPER_ADMIN',
        status: 'ACTIVE',
      },
    });
    console.log(`Created new admin: ${user.email} with password: Safed@2026`);
  } else {
    console.log(`User found! Updating role to SUPER_ADMIN...`);
    // If they forgot their password, we can also reset it here, but let's just make sure they are SUPER_ADMIN first.
    user = await prisma.user.update({
      where: { email: email.toLowerCase() },
      data: { 
        role: 'SUPER_ADMIN',
        status: 'ACTIVE'
      },
    });
    console.log(`Updated existing user ${user.email} to SUPER_ADMIN!`);
  }
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
