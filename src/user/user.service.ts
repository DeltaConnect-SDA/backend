import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Role } from 'src/auth/enum/role.enum';
import { DeviceDTO } from 'src/auth/dto';
import { createPaginator } from 'prisma-pagination';
import { Prisma } from '@prisma/client';
import { CreateOfficerDTO, CreateRoleDTO } from './dto';
import * as argon from 'argon2';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

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
        orderBy: {
          createdAt: 'desc',
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

  async getOfficers() {
    const officers = await this.prisma.role.findMany({
      where: {
        NOT: [
          {
            type: Role.PUBLIC,
          },
          {
            type: Role.AUTHORIZER,
          },
          {
            type: Role.SUPER_ADMIN,
          },
        ],
      },
    });

    return officers;
  }

  async search(query, page, perPage, orderByDate) {
    const paginate = createPaginator({ perPage });
    const queryParams: Prisma.UserFindManyArgs = {
      include: {
        UserDetail: true,
        role: true,
      },
      orderBy: { createdAt: orderByDate },
      where: {
        role: { type: Role.PUBLIC },
        OR: [
          {
            email: {
              contains: query,
              mode: 'insensitive',
            },
          },
          {
            firstName: {
              contains: query,
              mode: 'insensitive',
            },
          },
          {
            LastName: {
              contains: query,
              mode: 'insensitive',
            },
          },
          {
            phone: {
              contains: query,
              mode: 'insensitive',
            },
          },
        ],
      },
    };

    try {
      return paginate(this.prisma.user, queryParams, { page });
    } catch (err) {
      throw err;
    }
  }

  async searchOfficers(query, page, perPage, orderByDate) {
    const paginate = createPaginator({ perPage });
    const queryParams: Prisma.UserFindManyArgs = {
      include: {
        UserDetail: true,
        role: true,
      },
      orderBy: { createdAt: orderByDate },
      where: {
        role: {
          NOT: [
            {
              type: Role.SUPER_ADMIN,
            },
            {
              type: Role.PUBLIC,
            },
          ],
        },
        OR: [
          {
            email: {
              contains: query,
              mode: 'insensitive',
            },
          },
          {
            firstName: {
              contains: query,
              mode: 'insensitive',
            },
          },
          {
            LastName: {
              contains: query,
              mode: 'insensitive',
            },
          },
          {
            phone: {
              contains: query,
              mode: 'insensitive',
            },
          },
          {
            role: {
              name: {
                contains: query,
                mode: 'insensitive',
              },
            },
          },
        ],
      },
    };

    try {
      return paginate(this.prisma.user, queryParams, { page });
    } catch (err) {
      throw err;
    }
  }

  async createOfficer(data: CreateOfficerDTO) {
    // Generate passwprd hash
    const password = await argon.hash(data.password);

    // Get role id
    const role = await this.prisma.role.findUniqueOrThrow({
      where: { id: data.roleId },
    });

    // Save the new user in the database
    try {
      const user = await this.prisma.user.create({
        data: {
          firstName: data.firstName,
          LastName: data.LastName,
          email: data.email.toLowerCase().trim(),
          phone: data.phone,
          password,
          role: {
            connect: { id: role.id },
          },
          UserDetail: {
            create: {},
          },
        },
        select: {
          id: true,
          email: true,
          phone: true,
          firstName: true,
          LastName: true,
        },
      });
      return user;
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          if (error.meta.target[0] == 'phone') {
            throw {
              message: [{ filed: 'phone', error: 'Nomor HP telah digunakan!' }],
              code: 403,
              error: 'Bad Reuqest',
            };
          } else if (error.meta.target[0] == 'email') {
            throw {
              message: [{ filed: 'email', error: 'Email telah digunakan!' }],
              code: 403,
              error: 'Bad Reuqest',
            };
          }
        }
      }
      throw error;
    }
  }

  async createRole(data: CreateRoleDTO) {
    const role = this.prisma.role.create({
      data: {
        name: data.name,
        type: data.type,
        description: data.description,
      },
    });

    return role;
  }
  async searchRole(query, page, perPage, orderByDate) {
    const paginate = createPaginator({ perPage });
    const queryParams: Prisma.RoleFindManyArgs = {
      include: {
        _count: true,
      },
      orderBy: { createdAt: orderByDate },
      where: {
        type: { notIn: ['masyarakat', 'super-admin'] },
      },
    };

    try {
      return paginate(this.prisma.role, queryParams, { page });
    } catch (err) {
      throw err;
    }
  }
}
