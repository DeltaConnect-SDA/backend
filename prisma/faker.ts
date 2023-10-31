import { fakerID_ID as faker } from '@faker-js/faker';
import { PrismaClient } from '@prisma/client';
import * as argon from 'argon2';

const prisma = new PrismaClient();

async function main() {
  // create users
  //   const password = await argon.hash('password');
  //   const { id } = await prisma.role.findFirst({
  //     where: { type: { equals: 'masyarakat' } },
  //     select: { id: true },
  //   });

  //   for (let i = 0; i < 50; i++) {
  //     await prisma.user.create({
  //       data: {
  //         email: faker.internet.email(),
  //         firstName: faker.person.firstName(),
  //         LastName: faker.person.lastName(),
  //         phone: faker.phone.number(),
  //         password,
  //         role: { connect: { id } },
  //         UserDetail: {
  //           create: {
  //             isEmailVerified: true,
  //             isPhoneVerified: true,
  //           },
  //         },
  //       },
  //     });
  //     console.log(i);
  //   }

  // create complaints
  const users = await prisma.user.findMany({
    where: {
      role: { type: 'masyarakat' },
    },
  });

  const date = new Date();
  const dateString = `${date.getFullYear().toString().slice(-2)}${(
    date.getMonth() + 1
  )
    .toString()
    .padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}`;

  const count = await prisma.complaint.count({
    where: {
      createdAt: {
        gte: new Date(date.getFullYear(), date.getMonth(), date.getDate()),
        lt: new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1),
      },
    },
  });

  // Create reference ID

  users.map(async (user, index) => {
    for (let i = 0; i < 10; i++) {
      const refId = `DC-LP-${dateString}-${(
        count +
        1 +
        index +
        i +
        Math.random()
      )
        .toString()
        .padStart(5, '0')}`;
      await prisma.complaint.create({
        data: {
          title: faker.word.words({ count: { min: 5, max: 10 } }),
          categoryId: 1,
          priorityId: 1,
          description: faker.lorem.paragraphs(3, '\n \n'),
          detail_location: faker.location.street(),
          GPSaddress: faker.location.streetAddress({ useFullAddress: true }),
          lat: faker.location.latitude().toString(),
          long: faker.location.longitude().toString(),
          village: faker.location.street(),
          ref_id: refId,
          userId: user.id,
          ComplaintActivity: {
            create: {
              title: 'Menunggu',
              descripiton: 'Laporan anda menunggu respon petugas.',
              statusId: 1,
              userId: user.id,
            },
          },
          ComplaintImages: {
            createMany: {
              data: [
                {
                  path: faker.image.url({ width: 400, height: 300 }),
                  placeholder: 'LEHLk~WB2yk8pyo0adR*.7kCMdnj',
                },
                {
                  path: faker.image.url({ width: 400, height: 300 }),
                  placeholder: 'LEHLk~WB2yk8pyo0adR*.7kCMdnj',
                },
                {
                  path: faker.image.url({ width: 400, height: 300 }),
                  placeholder: 'LEHLk~WB2yk8pyo0adR*.7kCMdnj',
                },
                {
                  path: faker.image.url({ width: 400, height: 300 }),
                  placeholder: 'LEHLk~WB2yk8pyo0adR*.7kCMdnj',
                },
              ],
            },
          },
        },
      });
    }
  });
}

main()
  .catch((e) => {
    throw e;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
