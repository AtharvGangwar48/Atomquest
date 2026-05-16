import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const hash = (p: string) => bcrypt.hash(p, 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@company.com' },
    update: {},
    create: { name: 'Admin User', email: 'admin@company.com', password: await hash('Admin@123'), role: Role.ADMIN },
  });

  const manager = await prisma.user.upsert({
    where: { email: 'manager@company.com' },
    update: {},
    create: { name: 'Jane Manager', email: 'manager@company.com', password: await hash('Manager@123'), role: Role.MANAGER },
  });

  await prisma.user.upsert({
    where: { email: 'employee@company.com' },
    update: {},
    create: { name: 'John Employee', email: 'employee@company.com', password: await hash('Employee@123'), role: Role.EMPLOYEE, managerId: manager.id },
  });

  console.log('Seeded:', { admin: admin.email, manager: manager.email });
}

main().catch(console.error).finally(() => prisma.$disconnect());
