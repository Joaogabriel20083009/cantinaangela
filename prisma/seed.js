import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Hash password
  const adminPassword = await bcrypt.hash('admin', 10);

  console.log('Seeding database...');

  // Admin
  await prisma.user.upsert({
    where: { cpf: '00000000000' },
    update: {},
    create: {
      id: 'u-admin',
      nome: 'Admin da Cantina',
      telefone: '11999998888',
      cpf: '00000000000',
      senha: adminPassword,
      role: 'ADMIN',
      saldo_devedor: 0
    }
  });

  console.log('Database seeded with Admin successfully!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
