import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private prismaService: PrismaService) {}

  async complaints() {
    const startDate = new Date();
    startDate.setDate(1); // set to the start of the month
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + 1); // set to the start of the next month
    try {
      const rawData = await this.prismaService.complaint.groupBy({
        by: ['createdAt', 'statusId'],
        where: {
          createdAt: {
            gte: startDate,
            lt: endDate,
          },
        },
        _count: {
          _all: true,
        },
      });

      // Initialize an empty object for each day of the month
      const daysInMonth = new Date(
        startDate.getFullYear(),
        startDate.getMonth() + 1,
        0,
      ).getDate();
      const analytics = {};
      for (let i = 1; i <= daysInMonth; i++) {
        const date = new Date(startDate.getFullYear(), startDate.getMonth(), i);
        const formattedDate = date.toLocaleDateString('id-ID', {
          month: 'long',
          day: 'numeric',
          timeZone: 'UTC',
        });
        analytics[formattedDate] = {
          date: formattedDate,
          Selesai: 0,
          Total: 0,
        };
      }

      // Populate the analytics object with the raw data
      rawData.forEach((data) => {
        const date = new Date(data.createdAt);
        const formattedDate = date.toLocaleDateString('id-ID', {
          month: 'long',
          day: 'numeric',
          timeZone: 'UTC',
        });

        if (data.statusId === 4) {
          analytics[formattedDate].Selesai += data._count._all;
        }
        analytics[formattedDate].Total += data._count._all;
      });

      return Object.values(analytics);
    } catch (err) {
      throw err;
    }
  }

  async complaintsDashboard() {
    const startDate = new Date();
    startDate.setDate(1); // set to the start of the month
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + 1); // set to the start of the next month

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    try {
      const complaintInMonth = await this.prismaService.complaint.count({
        where: {
          createdAt: {
            gte: startDate,
            lt: endDate,
          },
        },
      });

      const complaintInDay = await this.prismaService.complaint.count({
        where: {
          createdAt: {
            gte: today,
            lt: tomorrow,
          },
        },
      });

      const complaintWaiting = await this.prismaService.complaint.count({
        where: { statusId: 1 },
      });

      const verificationRequests = 67;

      const users = await this.prismaService.user.count();

      return {
        complaintInMonth,
        complaintInDay,
        complaintWaiting,
        verificationRequests,
        users,
      };
    } catch (err) {
      throw err;
    }
  }
}
