import {
  ForbiddenException,
  HttpStatus,
  Injectable,
  Logger,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  AssignSuggestionDTO,
  CreateSuggestionDTO,
  DeclineSuggestionDTO,
  SuggestionRatingDTO,
} from './dto';
import { Role } from 'src/auth/enum/role.enum';
import { Prisma } from '@prisma/client';
import { createPaginator } from 'prisma-pagination';
import { Status } from 'src/enum';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

@Injectable()
export class SuggestionService {
  constructor(
    private prismaService: PrismaService,
    @InjectQueue('imageUpload')
    private readonly suggestionImageUpload: Queue,
    @InjectQueue('sendNotification')
    private readonly sendNotification: Queue,
  ) {}

  async create(data: CreateSuggestionDTO, user: any) {
    if (
      user.role.type !== Role.PUBLIC &&
      !user.UserDetail.isPhoneVerified &&
      !user.UserDetail.isVerified
    ) {
      throw {
        message: 'Forbidden cccess',
        code: HttpStatus.FORBIDDEN,
        error: 'Anda tidak memiliki izin untuk mengusulkan!',
      };
    }

    try {
      const date = new Date();
      const dateString = `${date.getFullYear().toString().slice(-2)}${(
        date.getMonth() + 1
      )
        .toString()
        .padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}`;

      const complaint = await this.prismaService.$transaction(
        async (prisma) => {
          // Hitung jumlah usulan pada hari ini
          const count = await prisma.suggestion.count({
            where: {
              createdAt: {
                gte: new Date(
                  date.getFullYear(),
                  date.getMonth(),
                  date.getDate(),
                ),
                lt: new Date(
                  date.getFullYear(),
                  date.getMonth(),
                  date.getDate() + 1,
                ),
              },
            },
          });

          // Create reference ID
          const refId = `DC-SG-${dateString}-${(count + 1)
            .toString()
            .padStart(5, '0')}`;

          // Buat Usulan dengan ID referensi
          return prisma.suggestion.create({
            data: {
              ...data,
              userId: user.id,
              ref_id: refId,
              SuggestionActivity: {
                create: {
                  title: 'Menunggu',
                  descripiton: 'Usulan anda menunggu respon petugas.',
                  statusId: 1,
                  userId: user.id,
                },
              },
            },
          });
        },
      );

      return complaint;
    } catch (err) {
      Logger.error(err, 'User create suggestion');
      throw {
        message: err.message,
        code: HttpStatus.INTERNAL_SERVER_ERROR,
        error: 'There was an error processing your request.',
      };
    } finally {
      this.prismaService.$disconnect();
    }
  }

  async savedByUser(userId: string) {
    const complaints = await this.prismaService.suggestionSaved.findMany({
      where: { userId },
      include: {
        suggestion: {
          select: {
            id: true,
            title: true,
            createdAt: true,
            status: {
              select: {
                title: true,
                color: true,
              },
            },
            category: {
              select: {
                title: true,
              },
            },
            upVoteTotal: true,
            downVoteTotal: true,
          },
        },
      },
    });

    if (complaints.length === 0) {
      throw {
        error: 'Suggestion Not Found',
        code: 404,
        message: 'Belum ada Usulan yang disimpan!',
      };
    }

    return complaints;
  }

  async findByUser(userId: string) {
    const suggestions = await this.prismaService.suggestion.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        category: { select: { title: true, id: true } },
        priority: { select: { title: true, id: true, color: true } },
        status: { select: { title: true, color: true } },
        SuggestionComments: { include: { user: true } },
      },
    });

    if (!suggestions) {
      throw {
        message: 'Belum ada Usulan.',
        code: HttpStatus.NOT_FOUND,
        error: 'Suggestions Not Found',
      };
    }
    return suggestions;
  }

  async findById(id: number) {
    if (!id) {
      throw {
        message: 'Usulan tidak ditemukan.',
        code: HttpStatus.NOT_FOUND,
        error: 'Suggestion Not Found',
      };
    }
    try {
      const suggestion = await this.prismaService.suggestion.findUnique({
        where: { id },
        include: {
          category: { select: { title: true, id: true } },
          priority: { select: { title: true, id: true, color: true } },
          status: { select: { id: true, title: true, color: true } },
          user: { select: { id: true, firstName: true, LastName: true } },
          SuggestionFeedBack: true,
          SuggestionComments: {
            take: 10,
            where: {
              parentId: null,
            },
            include: {
              user: {
                select: {
                  firstName: true,
                  LastName: true,
                  email: true,
                  UserDetail: {
                    select: {
                      isVerified: true,
                    },
                  },
                },
              },
              _count: true,
            },
            orderBy: {
              createdAt: 'desc',
            },
          },
          _count: {
            select: {
              SuggestionComments: true,
              SuggestionVotes: true,
            },
          },
        },
      });

      if (!suggestion) {
        throw {
          message: 'Usulan tidak ditemukan.',
          code: HttpStatus.NOT_FOUND,
          error: 'Suggestion Not Found',
        };
      }
      return suggestion;
    } catch (err) {
      throw err;
    }
  }

  async findSuggestionWithSaveStatus(suggestionId: number, userId: string) {
    if (!suggestionId) {
      throw {
        message: 'Usulan tidak ditemukan.',
        code: HttpStatus.NOT_FOUND,
        error: 'Suggestion Not Found',
      };
    }
    const suggestion = await this.prismaService.suggestion.findUnique({
      where: { id: suggestionId },
      include: {
        category: { select: { title: true, id: true } },
        priority: { select: { title: true, id: true, color: true } },
        status: { select: { id: true, title: true, color: true } },
        user: { select: { id: true, firstName: true, LastName: true } },
        SuggestionSaved: {
          where: { userId },
          select: { id: true },
        },
        SuggestionVotes: {
          where: { userId },
          select: { id: true, isUp: true },
        },
        SuggestionFeedBack: true,
        SuggestionComments: {
          take: 10,
          where: {
            parentId: null,
          },
          include: {
            user: {
              select: {
                firstName: true,
                LastName: true,
                email: true,
                UserDetail: {
                  select: {
                    isVerified: true,
                  },
                },
              },
            },
            _count: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
        _count: {
          select: {
            SuggestionComments: true,
            SuggestionVotes: true,
          },
        },
      },
    });

    if (!suggestion) {
      throw {
        message: 'Usulan tidak ditemukan.',
        code: HttpStatus.NOT_FOUND,
        error: 'Suggestion Not Found',
      };
    }
    return suggestion;
  }

  async findDashboard(suggestionId: number) {
    if (!suggestionId) {
      throw {
        message: 'Usulan tidak ditemukan.',
        code: HttpStatus.NOT_FOUND,
        error: 'Suggestion Not Found',
      };
    }
    const suggestion = await this.prismaService.suggestion.findUnique({
      where: { id: suggestionId },
      include: {
        category: { select: { title: true, id: true } },
        priority: { select: { title: true, id: true, color: true } },
        status: { select: { id: true, title: true, color: true } },
        assignTo: true,
        SuggestionActivity: {
          include: {
            user: {
              select: {
                firstName: true,
                LastName: true,
                email: true,
                role: { select: { type: true, name: true } },
              },
            },
          },
        },
        user: {
          select: {
            firstName: true,
            LastName: true,
            email: true,
            phone: true,
            UserDetail: true,
          },
        },
        SuggestionFeedBack: { include: { user: true } },
        SuggestionComments: {
          take: 10,
          where: {
            parentId: null,
          },
          include: {
            user: {
              select: {
                firstName: true,
                LastName: true,
                email: true,
                UserDetail: {
                  select: {
                    isVerified: true,
                  },
                },
              },
            },
            _count: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
        _count: {
          select: {
            SuggestionComments: true,
            SuggestionVotes: true,
          },
        },
      },
    });

    if (!suggestion) {
      throw {
        message: 'Usulan tidak ditemukan.',
        code: HttpStatus.NOT_FOUND,
        error: 'Suggestion Not Found',
      };
    }
    return suggestion;
  }

  async findLatest() {
    const suggestions = await this.prismaService.suggestion.findMany({
      include: {
        category: { select: { title: true, id: true } },
        priority: { select: { title: true, id: true, color: true } },
        status: { select: { title: true, color: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 3,
    });

    if (!suggestions) {
      throw {
        message: 'Belum ada usulan.',
        code: HttpStatus.NOT_FOUND,
        error: 'Suggestions Not Found',
      };
    }
    return suggestions;
  }

  async addToSavedSuggestions(suggestionId: number, userId: string) {
    try {
      const suggestion = await this.prismaService.$transaction(
        async (prisma) => {
          return prisma.suggestionSaved.create({
            data: {
              suggestionId,
              userId,
            },
          });
        },
      );

      return suggestion;
    } catch (err) {
      Logger.error(err.message, 'User save suggesion');
      throw {
        message: err.message,
        code: HttpStatus.INTERNAL_SERVER_ERROR,
        error: 'There was an error processing your request.',
      };
    } finally {
      this.prismaService.$disconnect();
    }
  }

  async removeSavedSuggestion(suggestionId: number, userId: string) {
    try {
      const suggestion = await this.prismaService.$transaction(
        async (prisma) => {
          return prisma.suggestionSaved.deleteMany({
            where: { suggestionId, userId },
          });
        },
      );

      return suggestion;
    } catch (err) {
      Logger.error(err.message, 'User delete saved suggestion');
      throw {
        message: err.message,
        code: HttpStatus.INTERNAL_SERVER_ERROR,
        error: 'There was an error processing your request.',
      };
    } finally {
      this.prismaService.$disconnect();
    }
  }

  async searchSuggestions(
    query: string,
    statusId: number[] = null,
    categories: number[] = null,
    priorityId: number[] = null,
    orderByDate: 'asc' | 'desc',
    page: number,
    perPage: number,
    user?: any,
  ) {
    const paginate = createPaginator({ perPage });
    const queryParams: Prisma.SuggestionFindManyArgs = {
      include: {
        category: { select: { id: true, title: true } },
        priority: { select: { id: true, title: true, color: true } },
        status: { select: { id: true, title: true, color: true } },
        _count: {
          select: {
            SuggestionComments: true,
            SuggestionVotes: true,
          },
        },
      },
      orderBy: { createdAt: orderByDate },
      where: {
        OR: [
          {
            title: {
              contains: query,
              mode: 'insensitive',
            },
          },
          {
            ref_id: {
              equals: query,
            },
          },
        ],
      },
    };

    if (orderByDate) {
      queryParams.orderBy = { createdAt: orderByDate };
    } else {
      queryParams.orderBy = { createdAt: 'desc' };
    }

    if (categories) {
      queryParams.where.categoryId = {
        in: categories,
      };
    }

    if (statusId) {
      queryParams.where.statusId = {
        in: statusId,
      };
    }

    if (priorityId) {
      queryParams.where.priorityId = {
        in: priorityId,
      };
    }

    if (user && user.role.type === Role.TECHNICAL_EXECUTOR) {
      queryParams.where.assignTo = { type: Role.TECHNICAL_EXECUTOR };
    }

    try {
      return paginate(this.prismaService.suggestion, queryParams, { page });
    } catch (err) {
      throw err;
    }
  }

  async getStatus(id: number) {
    try {
      const status = await this.prismaService.suggestionActivity.findMany({
        where: {
          suggestionId: id,
        },
        include: { suggestion: true, images: true, status: true },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return status;
    } catch (err) {
      throw err;
    }
  }

  async vote(id: number, selection: 'up' | 'down', userId) {
    if (!id) {
      throw {
        message: 'Usulan tidak ditemukan.',
        code: HttpStatus.NOT_FOUND,
        error: 'Suggestion Not Found',
      };
    }

    const suggestion = await this.prismaService.suggestion.findUnique({
      where: { id },
    });
    try {
      const isExist = await this.prismaService.suggestionVotes.findMany({
        where: {
          userId,
          suggestionId: id,
          isUp: selection === 'up' ? true : false,
        },
      });

      if (isExist.length > 0) {
        await this.prismaService.suggestionVotes.deleteMany({
          where: {
            suggestionId: id,
            userId,
          },
        });

        if (isExist[0].isUp) {
          await this.prismaService.suggestion.update({
            where: { id },
            data: {
              upVoteTotal: suggestion.upVoteTotal - 1,
            },
          });
        } else {
          await this.prismaService.suggestion.update({
            where: { id },
            data: {
              upVoteTotal: suggestion.downVoteTotal - 1,
            },
          });
        }
      } else {
        const suggestions = await this.prismaService.suggestionVotes.create({
          data: {
            isUp: selection === 'up' ? true : false,
            suggestionId: id,
            userId,
          },
        });

        if (selection === 'up') {
          await this.prismaService.suggestion.update({
            where: { id },
            data: {
              upVoteTotal: suggestion.upVoteTotal + 1,
            },
          });
        } else {
          await this.prismaService.suggestion.update({
            where: { id },
            data: {
              upVoteTotal: suggestion.downVoteTotal + 1,
            },
          });
        }
        return suggestions;
      }
    } catch (err) {
      throw err;
    }
  }

  async getVotes(id: number) {
    try {
      const status = await this.prismaService.suggestion.findUnique({
        where: { id },
        select: {
          _count: {
            select: { SuggestionVotes: true },
          },
        },
      });

      return status;
    } catch (err) {
      throw err;
    }
  }

  async searchComments(
    suggestionId: number,
    orderByDate: 'asc' | 'desc',
    page: number,
    perPage: number,
    parentId?: number,
  ) {
    if (!suggestionId) {
      throw {
        message: 'Usulan tidak ditemukan.',
        code: HttpStatus.NOT_FOUND,
        error: 'Suggestion Not Found',
      };
    }
    const paginate = createPaginator({ perPage });
    const queryParams: Prisma.SuggestionCommentsFindManyArgs = {
      include: {
        user: {
          select: {
            firstName: true,
            LastName: true,
            email: true,
            UserDetail: {
              select: {
                isVerified: true,
              },
            },
          },
        },
        _count: true,
      },
      orderBy: { createdAt: orderByDate },
      where: {
        suggestionId,
        parentId: {
          equals: parentId || null,
        },
      },
    };

    if (orderByDate) {
      queryParams.orderBy = { createdAt: orderByDate };
    } else {
      queryParams.orderBy = { createdAt: 'desc' };
    }

    console.log(queryParams);

    try {
      return paginate(this.prismaService.suggestionComments, queryParams, {
        page,
      });
    } catch (err) {
      throw err;
    }
  }

  async cancel(id: number, user: any, statusId: Status, data?: any) {
    console.log(data);
    try {
      const suggestion = await this.prismaService.$transaction(
        async (prisma) => {
          const suggestion = await prisma.suggestion.findUnique({
            where: { id },
            select: { user: true, id: true },
          });

          if (suggestion.user.id !== user.id)
            throw {
              error: 'Forbidden Access',
              message: 'Anda tidak memiliki akses untuk merubah status',
              code: HttpStatus.FORBIDDEN,
            };

          if (suggestion.user.roleId === user.roleId) {
            await prisma.suggestionActivity.create({
              data: {
                suggestionId: suggestion.id,
                title: 'Dibatalkan',
                descripiton: 'Usulan dibatalkan oleh pengguna',
                statusId,
                userId: user.id,
              },
            });
          }

          return await prisma.suggestion.update({
            where: { id, userId: user.id },
            data: { statusId },
          });
        },
      );

      return suggestion;
    } catch (err) {
      Logger.error(err, 'User cancel suggestion');
      throw {
        message: err.message,
        code: HttpStatus.INTERNAL_SERVER_ERROR,
        error: 'There was an error processing your request.',
      };
    } finally {
      this.prismaService.$disconnect();
    }
  }

  async decline(
    data: DeclineSuggestionDTO,
    user: any,
    images?: Express.Multer.File[],
  ) {
    try {
      const { activity, suggestion } = await this.prismaService.$transaction(
        async (prisma) => {
          const activity = await prisma.suggestionActivity.create({
            data: {
              title: 'Ditolak',
              descripiton: `Laporan ditolak oleh ${user.role.name}`,
              notes: data.notes,
              statusId: Status.DECLINED,
              suggestionId: +data.id,
              userId: user.id,
            },
          });

          const suggestion = await prisma.suggestion.update({
            where: { id: +data.id },
            data: { statusId: Status.DECLINED },
            include: { assignTo: true, user: { include: { Device: true } } },
          });

          return { activity, suggestion };
        },
      );
      const activityId = activity.id;
      const fileName = `${activity.suggestionId}_${activity.title}_image`;

      if (images) {
        const jobs = images.map((image, index) => ({
          name: 'updateSuggestionActivity',
          data: {
            activityId,
            buffer: image.buffer,
            fileName:
              fileName + ' ' + index + '.' + image.mimetype.split('/')[1],
            size: image.size,
            mimeType: image.mimetype,
          },
        }));
        await this.suggestionImageUpload.addBulk(jobs);
      }

      await suggestion.user.Device.map(async (device) => {
        Logger.log(
          `Sending notification ${device.id} for suggestion ${activity.suggestionId}`,
          'Decline suggestion',
        );
        // Send notification
        await this.sendNotification.add('sendSuggestionUpdateNotification', {
          userId: device.userId,
          deviceToken: device.deviceToken,
          deviceId: device.id,
          route: 'SuggestionDetail',
          param: suggestion.id.toString(),
          type: 'suggestion',
          content: {
            to: device.deviceToken,
            body: `Hai ${suggestion.user.firstName}! Usulanmu #${suggestion.ref_id} ditolak oleh ${user.role.name}.`,
            channelId: 'default',
            priority: 'high',
            title: 'Usulanmu Ditolak!',
            data: {
              type: 'suggestion',
              id: suggestion.id,
              route: 'SuggestionDetail',
              param: suggestion.id,
            },
          },
        });
      });
      return activity;
    } catch (err) {
      Logger.error(err, 'Dashboard decline suggestion');
      throw {
        message: err.message,
        code: HttpStatus.INTERNAL_SERVER_ERROR,
        error: 'There was an error processing your request.',
      };
    } finally {
      this.prismaService.$disconnect;
    }
  }

  async verify(
    data: DeclineSuggestionDTO,
    user: any,
    images?: Express.Multer.File[],
  ) {
    try {
      const { activity, suggestion } = await this.prismaService.$transaction(
        async (prisma) => {
          const activity = await prisma.suggestionActivity.create({
            data: {
              title: 'Diverifikasi',
              descripiton: `Laporan telah diverifikasi oleh ${user.role.name}`,
              notes: data.notes,
              statusId: Status.VERIFICATION,
              suggestionId: +data.id,
              userId: user.id,
            },
          });

          const suggestion = await prisma.suggestion.update({
            where: { id: +data.id },
            data: { statusId: Status.VERIFICATION, isVerified: true },
            include: { assignTo: true, user: { include: { Device: true } } },
          });

          return { activity, suggestion };
        },
      );
      const activityId = activity.id;
      const fileName = `${activity.suggestionId}_${activity.title}_image`;

      if (images) {
        const jobs = images.map((image, index) => ({
          name: 'updateComplaintActivity',
          data: {
            activityId,
            buffer: image.buffer,
            fileName:
              fileName + ' ' + index + '.' + image.mimetype.split('/')[1],
            size: image.size,
            mimeType: image.mimetype,
          },
        }));
        await this.suggestionImageUpload.addBulk(jobs);
      }
      await suggestion.user.Device.map(async (device) => {
        Logger.log(
          `Sending notification ${device.id} for suggestion ${activity.suggestionId}`,
          'Verify suggestion',
        );
        // Send notification
        await this.sendNotification.add('sendSuggestionUpdateNotification', {
          userId: device.userId,
          deviceToken: device.deviceToken,
          deviceId: device.id,
          route: 'SuggestionDetail',
          param: suggestion.id.toString(),
          type: 'suggestion',
          content: {
            to: device.deviceToken,
            body: `Hai ${suggestion.user.firstName}! Usulanmu #${suggestion.ref_id} telah diverifikasi oleh ${user.role.name}.`,
            channelId: 'default',
            priority: 'high',
            title: 'Usulanmu Diverifikasi!',
            data: {
              type: 'suggestion',
              id: suggestion.id,
              route: 'SuggestionDetail',
              param: suggestion.id,
            },
          },
        });
      });
      return activity;
    } catch (err) {
      Logger.error(err, 'Dashboard verify suggestion');
      throw {
        message: err.message,
        code: HttpStatus.INTERNAL_SERVER_ERROR,
        error: 'There was an error processing your request.',
      };
    } finally {
      this.prismaService.$disconnect;
    }
  }

  async complete(
    data: DeclineSuggestionDTO,
    user: any,
    images?: Express.Multer.File[],
  ) {
    try {
      const { activity, suggestion } = await this.prismaService.$transaction(
        async (prisma) => {
          await prisma.suggestion.findUniqueOrThrow({
            where: {
              id: +data.id,
            },
          });

          const activity = await prisma.suggestionActivity.create({
            data: {
              title: 'Selesai',
              descripiton: `Usulan selesai ditindaklanjuti oleh ${user.role.name}`,
              notes: data.notes,
              statusId: Status.COMPLETE,
              suggestionId: +data.id,
              userId: user.id,
            },
          });

          const suggestion = await prisma.suggestion.update({
            where: { id: +data.id },
            data: { statusId: Status.COMPLETE },
            include: { assignTo: true, user: { include: { Device: true } } },
          });

          return { activity, suggestion };
        },
      );
      const activityId = activity.id;
      const fileName = `${activity.suggestionId}_${activity.title}_image`;

      if (images) {
        const jobs = images.map((image, index) => ({
          name: 'updateSuggestionActivity',
          data: {
            activityId,
            buffer: image.buffer,
            fileName:
              fileName + ' ' + index + '.' + image.mimetype.split('/')[1],
            size: image.size,
            mimeType: image.mimetype,
          },
        }));
        await this.suggestionImageUpload.addBulk(jobs);
      }

      await suggestion.user.Device.map(async (device) => {
        Logger.log(
          `Sending notification ${device.id} for suggestion ${activity.suggestionId}`,
          'Complete suggestion',
        );
        // Send notification
        await this.sendNotification.add('sendSuggestionUpdateNotification', {
          userId: device.userId,
          deviceToken: device.deviceToken,
          deviceId: device.id,
          route: 'SuggestionDetail',
          param: suggestion.id.toString(),
          type: 'suggestion',
          content: {
            to: device.deviceToken,
            body: `Hai ${suggestion.user.firstName}! Usulanmu #${suggestion.ref_id} telah diselesaikan oleh ${user.role.name}.`,
            channelId: 'default',
            priority: 'high',
            title: 'Usulanmu Selesai!',
            data: {
              type: 'suggestion',
              id: suggestion.id,
              route: 'ComplaintDetail',
              param: suggestion.id,
            },
          },
        });
      });
      return activity;
    } catch (err) {
      Logger.error(err, 'Dashboard complete suggestion');
      throw {
        message: err.message,
        code: HttpStatus.INTERNAL_SERVER_ERROR,
        error: 'There was an error processing your request.',
      };
    } finally {
      this.prismaService.$disconnect;
    }
  }

  async assign(
    data: AssignSuggestionDTO,
    user: any,
    images?: Express.Multer.File[],
  ) {
    try {
      const { activity, suggestion } = await this.prismaService.$transaction(
        async (prisma) => {
          await prisma.suggestion.findUniqueOrThrow({
            where: {
              id: +data.id,
            },
          });

          const suggestion = await prisma.suggestion.update({
            where: { id: +data.id },
            data: { statusId: Status.PROCESS, assignToId: data.roleId },
            include: { assignTo: true, user: { include: { Device: true } } },
          });

          const activity = await prisma.suggestionActivity.create({
            data: {
              title: 'Diteruskan',
              descripiton: `Usulan diteruskan kepada ${suggestion.assignTo.name}`,
              notes: data.notes,
              statusId: Status.PROCESS,
              suggestionId: +data.id,
              userId: user.id,
            },
          });
          return { activity, suggestion };
        },
      );
      const activityId = activity.id;
      const fileName = `${activity.suggestionId}_${activity.title}_image`;

      if (images) {
        const jobs = images.map((image, index) => ({
          name: 'updateSuggestionActivity',
          data: {
            activityId,
            buffer: image.buffer,
            fileName:
              fileName + ' ' + index + '.' + image.mimetype.split('/')[1],
            size: image.size,
            mimeType: image.mimetype,
          },
        }));
        await this.suggestionImageUpload.addBulk(jobs);
      }
      await suggestion.user.Device.map(async (device) => {
        Logger.log(
          `Sending notification ${device.id} for suggestion ${activity.suggestionId}`,
          'Assign suggestion',
        );
        // Send notification
        await this.sendNotification.add('sendSuggestionUpdateNotification', {
          userId: device.userId,
          deviceToken: device.deviceToken,
          deviceId: device.id,
          route: 'SuggestionDetail',
          param: suggestion.id.toString(),
          type: 'suggestion',
          content: {
            to: device.deviceToken,
            body: `Hai ${suggestion.user.firstName}! Usulanmu #${suggestion.ref_id} diteruskan kepada ${suggestion.assignTo.name}.`,
            channelId: 'default',
            priority: 'high',
            title: 'Usulanmu Diteruskan!',
            data: {
              type: 'suggestion',
              id: suggestion.id,
              route: 'ComplaintDetail',
              param: suggestion.id,
            },
          },
        });
      });
      return activity;
    } catch (err) {
      Logger.error(err, 'Dashboard complete suggestion');
      throw {
        message: err.message,
        code: HttpStatus.INTERNAL_SERVER_ERROR,
        error: 'There was an error processing your request.',
      };
    } finally {
      this.prismaService.$disconnect;
    }
  }

  async process(
    data: DeclineSuggestionDTO,
    user: any,
    images?: Express.Multer.File[],
  ) {
    try {
      const { activity, suggestion } = await this.prismaService.$transaction(
        async (prisma) => {
          const activity = await prisma.suggestionActivity.create({
            data: {
              title: 'Diproses',
              descripiton: `Usulan sedang ditindaklanjuti oleh ${user.role.name}`,
              notes: data.notes,
              statusId: Status.PROCESS,
              suggestionId: +data.id,
              userId: user.id,
            },
          });

          const suggestion = await prisma.suggestion.update({
            where: { id: +data.id },
            data: { statusId: Status.PROCESS },
            include: { assignTo: true, user: { include: { Device: true } } },
          });

          return { activity, suggestion };
        },
      );
      const activityId = activity.id;
      const fileName = `${activity.suggestionId}_${activity.title}_image`;

      if (images) {
        const jobs = images.map((image, index) => ({
          name: 'updateSuggestionActivity',
          data: {
            activityId,
            buffer: image.buffer,
            fileName:
              fileName + ' ' + index + '.' + image.mimetype.split('/')[1],
            size: image.size,
            mimeType: image.mimetype,
          },
        }));
        await this.suggestionImageUpload.addBulk(jobs);
      }

      await suggestion.user.Device.map(async (device) => {
        Logger.log(
          `Sending notification ${device.id} for suggestion ${activity.suggestionId}`,
          'Process suggestion',
        );
        // Send notification
        await this.sendNotification.add('sendSuggestionUpdateNotification', {
          userId: device.userId,
          deviceToken: device.deviceToken,
          deviceId: device.id,
          route: 'SuggestionDetail',
          param: suggestion.id.toString(),
          type: 'suggestion',
          content: {
            to: device.deviceToken,
            body: `Hai ${suggestion.user.firstName}! Usulanmu #${suggestion.ref_id} sedang ditindaklanjuti oleh ${user.role.name}.`,
            channelId: 'default',
            priority: 'high',
            title: 'Usulanmu Ditindaklanjuti!',
            data: {
              type: 'suggestion',
              id: suggestion.id,
              route: 'SuggestionDetail',
              param: suggestion.id,
            },
          },
        });
      });

      return activity;
    } catch (err) {
      Logger.error(err, 'Dashboard complete suggestion');
      throw {
        message: err.message,
        code: HttpStatus.INTERNAL_SERVER_ERROR,
        error: 'There was an error processing your request.',
      };
    } finally {
      this.prismaService.$disconnect;
    }
  }

  async plan(
    data: DeclineSuggestionDTO,
    user: any,
    images?: Express.Multer.File[],
  ) {
    try {
      const { activity, suggestion } = await this.prismaService.$transaction(
        async (prisma) => {
          const activity = await prisma.suggestionActivity.create({
            data: {
              title: 'Direncanakan',
              descripiton: `Usulan sedang direncanakan oleh ${user.role.name}`,
              notes: data.notes,
              statusId: Status.PLAN,
              suggestionId: +data.id,
              userId: user.id,
            },
          });

          const suggestion = await prisma.suggestion.update({
            where: { id: +data.id },
            data: { statusId: Status.PLAN },
            include: { assignTo: true, user: { include: { Device: true } } },
          });

          return { activity, suggestion };
        },
      );
      const activityId = activity.id;
      const fileName = `${activity.suggestionId}_${activity.title}_image`;

      if (images) {
        const jobs = images.map((image, index) => ({
          name: 'updateSuggestionActivity',
          data: {
            activityId,
            buffer: image.buffer,
            fileName:
              fileName + ' ' + index + '.' + image.mimetype.split('/')[1],
            size: image.size,
            mimeType: image.mimetype,
          },
        }));
        await this.suggestionImageUpload.addBulk(jobs);
      }

      await suggestion.user.Device.map(async (device) => {
        Logger.log(
          `Sending notification ${device.id} for suggestion ${activity.suggestionId}`,
          'Process suggestion',
        );
        // Send notification
        await this.sendNotification.add('sendSuggestionUpdateNotification', {
          userId: device.userId,
          deviceToken: device.deviceToken,
          deviceId: device.id,
          route: 'SuggestionDetail',
          param: suggestion.id.toString(),
          type: 'suggestion',
          content: {
            to: device.deviceToken,
            body: `Hai ${suggestion.user.firstName}! Usulanmu #${suggestion.ref_id} sedang direncanakan oleh ${user.role.name}.`,
            channelId: 'default',
            priority: 'high',
            title: 'Usulanmu Direncanakan!',
            data: {
              type: 'suggestion',
              id: suggestion.id,
              route: 'SuggestionDetail',
              param: suggestion.id,
            },
          },
        });
      });

      return activity;
    } catch (err) {
      Logger.error(err, 'Dashboard complete suggestion');
      throw {
        message: err.message,
        code: HttpStatus.INTERNAL_SERVER_ERROR,
        error: 'There was an error processing your request.',
      };
    } finally {
      this.prismaService.$disconnect;
    }
  }

  async rating(
    data: SuggestionRatingDTO,
    userId: string,
    suggestionId: number,
  ) {
    const rated = await this.prismaService.suggestionFeedBack.findFirst({
      where: { suggestionId, userId },
    });

    if (rated) {
      throw new ForbiddenException();
    }

    try {
      const suggestionRate = await this.prismaService.$transaction(
        async (prisma) => {
          const rating = await prisma.suggestionFeedBack.create({
            data: {
              suggestionId,
              userId,
              feedackScore: data.rate,
              feedbackNote: data.rateText,
            },
            select: {
              suggestionId: true,
              suggestion: {
                select: { total_feedback: true, total_score: true },
              },
            },
          });

          let totalScore;

          if (rating.suggestion.total_feedback) {
            totalScore = (rating.suggestion.total_score + data.rate) / 2;
          } else {
            totalScore = data.rate;
          }
          return await prisma.suggestion.update({
            where: { id: rating.suggestionId },
            data: {
              total_feedback: rating.suggestion.total_feedback + 1,
              total_score: Math.round((totalScore + Number.EPSILON) * 10) / 10,
            },
          });
        },
      );
      return suggestionRate;
    } catch (err) {
      throw err;
    } finally {
      this.prismaService.$disconnect();
    }
  }
}
