import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Role } from 'src/auth/enum/role.enum';
import { DeviceDTO } from 'src/auth/dto';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}
  async createUser() {}
  async findByEmail(email: string) {
    const user = await this.prisma.user.findFirst({
      where: { email },
      include: { UserDetail: true },
    });

    if (user) {
      delete user.password;
    }

    return user;
  }

  async findByPhone(phone: string) {
    const user = await this.prisma.user.findFirst({
      where: { phone },
      include: { UserDetail: true },
    });

    if (user) {
      delete user.password;
    }

    return user;
  }

  async findRole(type?: Role, id?: string) {
    try {
      const foundRole = await this.prisma.role.findFirst({
        where: {
          id,
          type,
        },
      });

      return foundRole;
    } catch (error) {
      console.error('Error:', error);
      throw new NotFoundException('Failed to find role');
    } finally {
      await this.prisma.$disconnect();
    }
  }
  async addDevice(data: DeviceDTO) {
    try {
      const device = await this.prisma.user.update({
        where: {
          id: data.userId,
        },
        data: {
          Device: {
            create: {
              deviceToken: data.DeviceToken,
              deviceType: data.DeviceType,
            },
          },
        },
      });
      return device;
    } catch (err) {
      throw err;
    }
  }

  async removeDevice(deviceId) {
    try {
      const device = await this.prisma.device.delete({
        where: {
          id: deviceId,
        },
      });
      return device;
    } catch (err) {
      throw err;
    }
  }

  async getNotifications(user: any) {
    try {
      const notifications = await this.prisma.notification.findMany({
        where: {
          AND: [
            {
              userId: user.id,
            },
            {
              NOT: {
                status: 'READ',
              },
            },
          ],
        },
      });

      return notifications;
    } catch (err) {
      throw err;
    }
  }

  async readNotifications(id: number, user: any) {
    try {
      await this.prisma.user.update({
        where: {
          id: user.id,
        },
        data: {
          Notification: {
            update: {
              where: { id },
              data: { status: 'READ' },
            },
          },
        },
      });

      return;
    } catch (err) {
      throw err;
    }
  }
}
