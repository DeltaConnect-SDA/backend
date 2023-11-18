import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Category
  await prisma.category.createMany({
    data: [
      {
        title: 'Ruang Publik',
      },
    ],
  });

  // Status
  await prisma.status.createMany({
    data: [
      {
        title: 'Direncanakan',
        color: 'PURPLE',
      },
    ],
  });
}
main()
  .catch((e) => {
    throw e;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
