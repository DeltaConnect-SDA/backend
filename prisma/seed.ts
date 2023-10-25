import { Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import * as argon from 'argon2';

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

  const plainPassword = Math.random().toString(36).slice(2, 22);
  const password = await argon.hash(plainPassword);
  const { id } = await prisma.role.findFirst({
    where: { type: { equals: 'super-admin' } },
    select: { id: true },
  });

  await prisma.user.create({
    data: {
      email: 'deltaconnect@sidoarjokab.go.id',
      firstName: 'Biro',
      LastName: 'Pemerintah',
      phone: '62812345678',
      password,
      role: { connect: { id } },
      UserDetail: {
        create: {},
      },
    },
  });

  Logger.log(plainPassword);
}

main()
  .catch((e) => {
    throw e;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
