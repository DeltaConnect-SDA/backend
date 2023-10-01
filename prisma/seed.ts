import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Logika seeding data
  await prisma.role.createMany({
    data: [
      {
        name: 'Super Admin',
        description: 'Super admin',
        type: 'super-admin',
      },
      {
        name: 'Petugas Otorisasi',
        description: 'Petugas otorisasi',
        type: 'petugas-otorisasi',
      },
      {
        name: 'Dinas Pekerjaan Umum Bina Marga dan Sumber Daya Air',
        description: 'Dinas Pekerjaan Umum Bina Marga dan Sumber Daya Air',
        type: 'pelaksana-teknis',
      },
      {
        name: 'Dinas Perumahan, Permukiman, Cipta Karya, Dan Tata Ruang',
        description: 'Dinas Perumahan, Permukiman, Cipta Karya, Dan Tata Ruang',
        type: 'pelaksana-teknis',
      },
      {
        name: 'Dinas Lingkungan Hidup dan Kebersihan',
        description: 'Dinas Lingkungan Hidup dan Kebersihan',
        type: 'pelaksana-teknis',
      },
      {
        name: 'Dinas Perhubungan',
        description: 'Dinas Perhubungan',
        type: 'pelaksana-teknis',
      },
      {
        name: 'Masyarakat',
        description: 'Masyarakat Kabupaten Sidoarjo',
        type: 'masyarakat',
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
