import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Role } from 'src/auth/enum/role.enum';
import { Status } from 'src/enum';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private prismaService: PrismaService) {}

  async complaints(user: any) {
    const startDate = new Date();
    startDate.setDate(1); // set to the start of the month
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + 1); // set to the start of the next month
    let where: Prisma.ComplaintActivityWhereInput = {
      createdAt: {
        gte: startDate,
        lt: endDate,
      },
    };
    if (user && user.role.type === Role.TECHNICAL_EXECUTOR) {
      where = {
        ...where,
        complaint: {
          assignTo: {
            type: Role.TECHNICAL_EXECUTOR,
          },
        },
      };
    }

    try {
      const rawData = await this.prismaService.complaintActivity.groupBy({
        by: ['createdAt', 'statusId'],
        where,
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
          timeZone: 'Asia/Jakarta',
        });
        analytics[formattedDate] = {
          date: formattedDate,
          Selesai: 0,
          Baru: 0,
        };
      }

      // Populate the analytics object with the raw data
      rawData.forEach((data) => {
        const date = new Date(data.createdAt);
        const formattedDate = date.toLocaleDateString('id-ID', {
          month: 'long',
          day: 'numeric',
          timeZone: 'Asia/Jakarta',
        });

        if (data.statusId === Status.COMPLETE) {
          analytics[formattedDate].Selesai += data._count._all;
        } else if (data.statusId === Status.WAITING) {
          analytics[formattedDate].Baru += data._count._all;
        }
      });

      return Object.values(analytics);
    } catch (err) {
      throw err;
    }
  }

  async complaintsDashboard(user: any) {
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
      let complaintInMonthWhere: Prisma.ComplaintWhereInput = {
        createdAt: {
          gte: startDate,
          lt: endDate,
        },
      };
      if (user && user.role.type === Role.TECHNICAL_EXECUTOR) {
        complaintInMonthWhere = {
          ...complaintInMonthWhere,
          assignTo: {
            type: Role.TECHNICAL_EXECUTOR,
          },
        };
      }
      const complaintInMonth = await this.prismaService.complaint.count({
        where: complaintInMonthWhere,
      });

      let complaintInDayWhere: Prisma.ComplaintWhereInput = {
        createdAt: {
          gte: today,
          lt: tomorrow,
        },
      };
      if (user && user.role.type === Role.TECHNICAL_EXECUTOR) {
        complaintInDayWhere = {
          ...complaintInDayWhere,
          assignTo: {
            type: Role.TECHNICAL_EXECUTOR,
          },
        };
      }
      const complaintInDay = await this.prismaService.complaint.count({
        where: complaintInDayWhere,
      });

      let complaintWaitingWhere: Prisma.ComplaintWhereInput = {
        statusId: 1,
      };
      if (user && user.role.type === Role.TECHNICAL_EXECUTOR) {
        complaintWaitingWhere = {
          ...complaintWaitingWhere,
          assignTo: {
            type: Role.TECHNICAL_EXECUTOR,
          },
        };
      }
      const complaintWaiting = await this.prismaService.complaint.count({
        where: complaintWaitingWhere,
      });

      const verificationRequests =
        await this.prismaService.verificationRequest.count({
          where: {
            statusId: Status.WAITING,
          },
        });

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
