import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Roles
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

  // Status
  await prisma.status.createMany({
    data: [
      {
        title: 'Menunggu',
        color: 'ORANGE',
      },
      {
        title: 'Verifikasi',
        color: 'TOSCA',
      },
      {
        title: 'Proses',
        color: 'PURPLE',
      },
      {
        title: 'Selesai',
        color: 'GREEN',
      },
      {
        title: 'Dibatalkan',
        color: 'RED',
      },
      {
        title: 'Ditolak',
        color: 'RED',
      },
    ],
  });

  // Priority
  await prisma.priority.createMany({
    data: [
      {
        title: '!!! Tinggi',
        color: 'RED',
      },
      {
        title: '!! Sedang',
        color: 'ORANGE',
      },
      {
        title: '! Rendah',
        color: 'YELLOW',
      },
    ],
  });

  // Category
  await prisma.category.createMany({
    data: [
      {
        title: 'Pohon',
      },
      {
        title: 'Kebersihan',
      },
      {
        title: 'Saluran Air',
      },
      {
        title: 'Penerangan Jalan',
      },
      {
        title: 'Jalan',
      },
      {
        title: 'Kelistrikan',
      },
      {
        title: 'Lainnya',
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
