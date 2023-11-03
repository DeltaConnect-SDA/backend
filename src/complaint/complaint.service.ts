import {
  Injectable,
  HttpStatus,
  Logger,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  AssignComplaintDTO,
  ComplaintDTO,
  ComplaintRatingDTO,
  DeclineComplaintDTO,
} from './dto';
import { Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';
import { Role } from 'src/auth/enum/role.enum';
import { Status } from 'src/enum';
import { Prisma } from '@prisma/client';
import { createPaginator } from 'prisma-pagination';

@Injectable()
export class ComplaintService {
  constructor(
    private prismaService: PrismaService,
    @InjectQueue('imageUpload')
    private readonly complaintImageUpload: Queue,
    @InjectQueue('sendNotification')
    private readonly sendNotification: Queue,
  ) {}

  async create(
    data: ComplaintDTO,
    userId: string,
    images: Express.Multer.File[],
    user: any,
  ) {
    if (user.role.type !== Role.PUBLIC && !user.UserDetail.isPhoneVerified) {
      throw {
        message: 'Forbidden cccess',
        code: HttpStatus.FORBIDDEN,
        error: 'Anda tidak memiliki izin untuk melapor!',
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
          // Hitung jumlah laporan pada hari ini
          const count = await prisma.complaint.count({
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
          const refId = `DC-CP-${dateString}-${(count + 1)
            .toString()
            .padStart(5, '0')}`;

          // Buat laporan dengan ID referensi
          return prisma.complaint.create({
            data: {
              ...data,
              userId,
              ref_id: refId,
              ComplaintActivity: {
                create: {
                  title: 'Menunggu',
                  descripiton: 'Laporan anda menunggu respon petugas.',
                  statusId: 1,
                  userId: user.id,
                },
              },
            },
          });
        },
      );

      const complaintId = complaint.id;
      const fileName = `${complaint.ref_id}_image`;

      const jobs = images.map((image, index) => ({
        name: 'addComplaint',
        data: {
          complaintId,
          buffer: image.buffer,
          fileName: fileName + ' ' + index + '.' + image.mimetype.split('/')[1],
          size: image.size,
          mimeType: image.mimetype,
        },
      }));

      await this.complaintImageUpload.addBulk(jobs);
      return complaint;
    } catch (err) {
      Logger.error(err, 'User create complaint');
      throw {
        message: err.message,
        code: HttpStatus.INTERNAL_SERVER_ERROR,
        error: 'There was an error processing your request.',
      };
    } finally {
      this.prismaService.$disconnect();
    }
  }

  async findByUser(userId: string) {
    const complaints = await this.prismaService.complaint.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        ComplaintImages: { select: { path: true, placeholder: true } },
        category: { select: { title: true, id: true } },
        priority: { select: { title: true, id: true, color: true } },
        status: { select: { title: true, color: true } },
      },
    });

    if (!complaints) {
      throw {
        message: 'Belum ada Laporan.',
        code: HttpStatus.NOT_FOUND,
        error: 'Complaint Not Found',
      };
    }
    return complaints;
  }

  async get(
    page: number,
    perPage: number,
    orderByDate: 'asc' | 'desc',
    user?: any,
  ) {
    const paginate = createPaginator({ perPage });
    let queryParams: Prisma.ComplaintFindManyArgs = {
      include: {
        ComplaintImages: { select: { path: true, placeholder: true } },
        category: { select: { title: true, id: true } },
        priority: { select: { title: true, id: true, color: true } },
        status: { select: { title: true, id: true, color: true } },
        ComplaintSaved: { select: { userId: true } },
      },
      orderBy: { createdAt: orderByDate },
    };

    if (user && user.role.type === Role.TECHNICAL_EXECUTOR) {
      queryParams = {
        ...queryParams,
        where: {
          assignTo: {
            type: Role.TECHNICAL_EXECUTOR,
          },
        },
      };
    }

    try {
      return paginate(this.prismaService.complaint, queryParams, { page });
    } catch (err) {
      throw err;
    }
  }

  async findById(id: number) {
    if (!id) {
      throw {
        message: 'Laporan tidak ditemukan.',
        code: HttpStatus.NOT_FOUND,
        error: 'Complaint Not Found',
      };
    }
    try {
      const complaints = await this.prismaService.complaint.findUnique({
        where: { id },
        include: {
          ComplaintImages: { select: { path: true, placeholder: true } },
          category: { select: { title: true, id: true } },
          priority: { select: { title: true, id: true, color: true } },
          status: { select: { id: true, title: true, color: true } },
          ComplaintFeedBack: true,
          user: { select: { id: true, firstName: true, LastName: true } },
        },
      });

      if (!complaints) {
        throw {
          message: 'Laporan tidak ditemukan.',
          code: HttpStatus.NOT_FOUND,
          error: 'Complaint Not Found',
        };
      }
      return complaints;
    } catch (err) {
      throw err;
    }
  }

  async findComplaintWithSaveStatus(complaintId: number, userId: string) {
    if (!complaintId) {
      throw {
        message: 'Laporan tidak ditemukan.',
        code: HttpStatus.NOT_FOUND,
        error: 'Complaint Not Found',
      };
    }
    const complaint = await this.prismaService.complaint.findUnique({
      where: { id: complaintId },
      include: {
        ComplaintImages: { select: { path: true, placeholder: true } },
        category: { select: { title: true, id: true } },
        priority: { select: { title: true, id: true, color: true } },
        status: { select: { id: true, title: true, color: true } },
        user: { select: { id: true, firstName: true, LastName: true } },
        ComplaintSaved: {
          where: { userId },
          select: { id: true },
        },
        ComplaintFeedBack: true,
        // ComplaintFeedBack: {
        //   where: { userId },
        // },
      },
    });

    if (!complaint) {
      throw {
        message: 'Laporan tidak ditemukan.',
        code: HttpStatus.NOT_FOUND,
        error: 'Complaint Not Found',
      };
    }
    return complaint;
  }

  async findDashboard(complaintId: number) {
    if (!complaintId) {
      throw {
        message: 'Laporan tidak ditemukan.',
        code: HttpStatus.NOT_FOUND,
        error: 'Complaint Not Found',
      };
    }
    const complaint = await this.prismaService.complaint.findUnique({
      where: { id: complaintId },
      include: {
        ComplaintImages: { select: { path: true, placeholder: true } },
        category: { select: { title: true, id: true } },
        priority: { select: { title: true, id: true, color: true } },
        status: { select: { id: true, title: true, color: true } },
        assignTo: true,
        ComplaintActivity: {
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
        ComplaintFeedBack: { include: { user: true } },
      },
    });

    if (!complaint) {
      throw {
        message: 'Laporan tidak ditemukan.',
        code: HttpStatus.NOT_FOUND,
        error: 'Complaint Not Found',
      };
    }
    return complaint;
  }

  async findLatest() {
    const complaints = await this.prismaService.complaint.findMany({
      include: {
        ComplaintImages: { select: { path: true, placeholder: true } },
        category: { select: { title: true, id: true } },
        priority: { select: { title: true, id: true, color: true } },
        status: { select: { title: true, color: true } },
        ComplaintSaved: { select: { userId: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 3,
    });

    if (!complaints) {
      throw {
        message: 'Belum ada Laporan.',
        code: HttpStatus.NOT_FOUND,
        error: 'Complaint Not Found',
      };
    }
    return complaints;
  }

  async addToSavedComplaints(complaintId: number, userId: string) {
    try {
      const complaint = await this.prismaService.$transaction(
        async (prisma) => {
          return prisma.complaintSaved.create({
            data: {
              complaintId,
              userId,
            },
          });
        },
      );

      return complaint;
    } catch (err) {
      Logger.error(err.message, 'User save complaint');
      throw {
        message: err.message,
        code: HttpStatus.INTERNAL_SERVER_ERROR,
        error: 'There was an error processing your request.',
      };
    } finally {
      this.prismaService.$disconnect();
    }
  }

  async removeSavedComplaints(complaintId: number, userId: string) {
    try {
      const complaint = await this.prismaService.$transaction(
        async (prisma) => {
          return prisma.complaintSaved.deleteMany({
            where: { complaintId, userId },
          });
        },
      );

      return complaint;
    } catch (err) {
      Logger.error(err.message, 'User delete saved complaint');
      throw {
        message: err.message,
        code: HttpStatus.INTERNAL_SERVER_ERROR,
        error: 'There was an error processing your request.',
      };
    } finally {
      this.prismaService.$disconnect();
    }
  }

  async getComplaintSavedByUser(userId: string) {
    const complaints = await this.prismaService.complaintSaved.findMany({
      where: { userId },
      include: {
        complaint: {
          select: {
            id: true,
            title: true,
            createdAt: true,
            village: true,
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
            ComplaintImages: {
              select: {
                path: true,
                placeholder: true,
              },
            },
          },
        },
      },
    });

    if (complaints.length === 0) {
      throw {
        error: 'Complaint Not Found',
        code: 404,
        message: 'Belum ada laporan yang disimpan!',
      };
    }

    return complaints;
  }

  async cancel(id: number, user: any, statusId: Status, data?: any) {
    console.log(data);
    try {
      const complaint = await this.prismaService.$transaction(
        async (prisma) => {
          const complaint = await prisma.complaint.findUnique({
            where: { id },
            select: { user: true, id: true },
          });

          if (complaint.user.id !== user.id)
            throw {
              error: 'Forbidden Access',
              message: 'Anda tidak memiliki akses untuk merubah status',
              code: HttpStatus.FORBIDDEN,
            };

          if (complaint.user.roleId === user.roleId) {
            await prisma.complaintActivity.create({
              data: {
                complaintId: complaint.id,
                title: 'Dibatalkan',
                descripiton: 'Laporan dibatalkan oleh pengguna',
                statusId,
                userId: user.id,
              },
            });
          }

          return await prisma.complaint.update({
            where: { id, userId: user.id },
            data: { statusId },
          });
        },
      );

      return complaint;
    } catch (err) {
      Logger.error(err, 'User update complaint status');
      throw {
        message: err.message,
        code: HttpStatus.INTERNAL_SERVER_ERROR,
        error: 'There was an error processing your request.',
      };
    } finally {
      this.prismaService.$disconnect();
    }
  }

  async searchComplaints(
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
    const queryParams: Prisma.ComplaintFindManyArgs = {
      include: {
        ComplaintImages: { select: { path: true, placeholder: true } },
        category: { select: { id: true, title: true } },
        priority: { select: { id: true, title: true, color: true } },
        status: { select: { id: true, title: true, color: true } },
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
      return paginate(this.prismaService.complaint, queryParams, { page });
    } catch (err) {
      throw err;
    }
  }

  async countByDay() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    try {
      return await this.prismaService.complaint.count({
        where: {
          createdAt: {
            gte: today,
            lt: tomorrow,
          },
        },
      });
    } catch (err) {
      throw err;
    }
  }

  async rating(data: ComplaintRatingDTO, userId: string, complaintId: number) {
    const rated = await this.prismaService.complaintFeedBack.findFirst({
      where: { complaintId, userId },
    });

    if (rated) {
      throw new ForbiddenException();
    }

    try {
      const complaintRate = await this.prismaService.$transaction(
        async (prisma) => {
          const rating = await prisma.complaintFeedBack.create({
            data: {
              complaintId,
              userId,
              feedackScore: data.rate,
              feedbackNote: data.rateText,
            },
            select: {
              complaintId: true,
              complaint: {
                select: { total_feedback: true, total_score: true },
              },
            },
          });

          let totalScore;

          if (rating.complaint.total_feedback) {
            totalScore = (rating.complaint.total_score + data.rate) / 2;
          } else {
            totalScore = data.rate;
          }
          return await prisma.complaint.update({
            where: { id: rating.complaintId },
            data: {
              total_feedback: rating.complaint.total_feedback + 1,
              total_score: Math.round((totalScore + Number.EPSILON) * 10) / 10,
            },
          });
        },
      );
      return complaintRate;
    } catch (err) {
      throw err;
    } finally {
      this.prismaService.$disconnect();
    }
  }

  async decline(
    data: DeclineComplaintDTO,
    user: any,
    images?: Express.Multer.File[],
  ) {
    try {
      const { activity, complaint } = await this.prismaService.$transaction(
        async (prisma) => {
          // await prisma.complaint.findUniqueOrThrow({
          //   where: {
          //     id: +data.id,
          //   },
          // });

          const activity = await prisma.complaintActivity.create({
            data: {
              title: 'Ditolak',
              descripiton: `Laporan ditolak oleh ${user.role.name}`,
              notes: data.notes,
              statusId: Status.DECLINED,
              complaintId: +data.id,
              userId: user.id,
            },
          });

          const complaint = await prisma.complaint.update({
            where: { id: +data.id },
            data: { statusId: Status.DECLINED },
            include: { assignTo: true, user: { include: { Device: true } } },
          });

          return { activity, complaint };
        },
      );
      const activityId = activity.id;
      const fileName = `${activity.complaintId}_${activity.title}_image`;

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
        await this.complaintImageUpload.addBulk(jobs);
      }

      await complaint.user.Device.map(async (device) => {
        Logger.log(
          `Sending notification ${device.id} for complaint ${activity.complaintId}`,
          'Decline complaint',
        );
        // Send notification
        await this.sendNotification.add('sendComplaintUpdateNotification', {
          userId: device.userId,
          deviceToken: device.deviceToken,
          deviceId: device.id,
          route: 'ComplaintDetail',
          param: complaint.id.toString(),
          type: 'complaint',
          content: {
            to: device.deviceToken,
            body: `Hai ${complaint.user.firstName}! Laporanmu #${complaint.ref_id} ditolak oleh ${user.role.name}.`,
            channelId: 'default',
            priority: 'high',
            title: 'Laporanmu Ditolak!',
            data: {
              type: 'complaint',
              id: complaint.id,
              route: 'ComplaintDetail',
              param: complaint.id,
            },
          },
        });
      });
      return activity;
    } catch (err) {
      Logger.error(err, 'Dashboard decline complaint');
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
    data: DeclineComplaintDTO,
    user: any,
    images?: Express.Multer.File[],
  ) {
    try {
      const { activity, complaint } = await this.prismaService.$transaction(
        async (prisma) => {
          // await prisma.complaint.findUniqueOrThrow({
          //   where: {
          //     id: +data.id,
          //   },
          // });

          const activity = await prisma.complaintActivity.create({
            data: {
              title: 'Diverifikasi',
              descripiton: `Laporan telah diverifikasi oleh ${user.role.name}`,
              notes: data.notes,
              statusId: Status.VERIFICATION,
              complaintId: +data.id,
              userId: user.id,
            },
          });

          const complaint = await prisma.complaint.update({
            where: { id: +data.id },
            data: { statusId: Status.VERIFICATION, isVerified: true },
            include: { assignTo: true, user: { include: { Device: true } } },
          });

          return { activity, complaint };
        },
      );
      const activityId = activity.id;
      const fileName = `${activity.complaintId}_${activity.title}_image`;

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
        await this.complaintImageUpload.addBulk(jobs);
      }
      await complaint.user.Device.map(async (device) => {
        Logger.log(
          `Sending notification ${device.id} for complaint ${activity.complaintId}`,
          'Verify complaint',
        );
        // Send notification
        await this.sendNotification.add('sendComplaintUpdateNotification', {
          userId: device.userId,
          deviceToken: device.deviceToken,
          deviceId: device.id,
          route: 'ComplaintDetail',
          param: complaint.id.toString(),
          type: 'complaint',
          content: {
            to: device.deviceToken,
            body: `Hai ${complaint.user.firstName}! Laporanmu #${complaint.ref_id} telah diverifikasi oleh ${user.role.name}.`,
            channelId: 'default',
            priority: 'high',
            title: 'Laporanmu Diverifikasi!',
            data: {
              type: 'complaint',
              id: complaint.id,
              route: 'ComplaintDetail',
              param: complaint.id,
            },
          },
        });
      });
      return activity;
    } catch (err) {
      Logger.error(err, 'Dashboard verify complaint');
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
    data: DeclineComplaintDTO,
    user: any,
    images?: Express.Multer.File[],
  ) {
    try {
      const { activity, complaint } = await this.prismaService.$transaction(
        async (prisma) => {
          await prisma.complaint.findUniqueOrThrow({
            where: {
              id: +data.id,
            },
          });

          const activity = await prisma.complaintActivity.create({
            data: {
              title: 'Selesai',
              descripiton: `Laporan selesai ditindaklanjuti oleh ${user.role.name}`,
              notes: data.notes,
              statusId: Status.COMPLETE,
              complaintId: +data.id,
              userId: user.id,
            },
          });

          const complaint = await prisma.complaint.update({
            where: { id: +data.id },
            data: { statusId: Status.COMPLETE },
            include: { assignTo: true, user: { include: { Device: true } } },
          });

          return { activity, complaint };
        },
      );
      const activityId = activity.id;
      const fileName = `${activity.complaintId}_${activity.title}_image`;

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
        await this.complaintImageUpload.addBulk(jobs);
      }

      await complaint.user.Device.map(async (device) => {
        Logger.log(
          `Sending notification ${device.id} for complaint ${activity.complaintId}`,
          'Complete complaint',
        );
        // Send notification
        await this.sendNotification.add('sendComplaintUpdateNotification', {
          userId: device.userId,
          deviceToken: device.deviceToken,
          deviceId: device.id,
          route: 'ComplaintDetail',
          param: complaint.id.toString(),
          type: 'complaint',
          content: {
            to: device.deviceToken,
            body: `Hai ${complaint.user.firstName}! Laporanmu #${complaint.ref_id} telah diselesaikan oleh ${user.role.name}.`,
            channelId: 'default',
            priority: 'high',
            title: 'Laporanmu Selesai!',
            data: {
              type: 'complaint',
              id: complaint.id,
              route: 'ComplaintDetail',
              param: complaint.id,
            },
          },
        });
      });
      return activity;
    } catch (err) {
      Logger.error(err, 'Dashboard complete complaint');
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
    data: AssignComplaintDTO,
    user: any,
    images?: Express.Multer.File[],
  ) {
    try {
      const { activity, complaint } = await this.prismaService.$transaction(
        async (prisma) => {
          await prisma.complaint.findUniqueOrThrow({
            where: {
              id: +data.id,
            },
          });

          const complaint = await prisma.complaint.update({
            where: { id: +data.id },
            data: { statusId: Status.PROCESS, assignToId: data.roleId },
            include: { assignTo: true, user: { include: { Device: true } } },
          });

          const activity = await prisma.complaintActivity.create({
            data: {
              title: 'Diteruskan',
              descripiton: `Laporan diteruskan kepada ${complaint.assignTo.name}`,
              notes: data.notes,
              statusId: Status.PROCESS,
              complaintId: +data.id,
              userId: user.id,
            },
          });
          return { activity, complaint };
        },
      );
      const activityId = activity.id;
      const fileName = `${activity.complaintId}_${activity.title}_image`;

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
        await this.complaintImageUpload.addBulk(jobs);
      }
      await complaint.user.Device.map(async (device) => {
        Logger.log(
          `Sending notification ${device.id} for complaint ${activity.complaintId}`,
          'Assign complaint',
        );
        // Send notification
        await this.sendNotification.add('sendComplaintUpdateNotification', {
          userId: device.userId,
          deviceToken: device.deviceToken,
          deviceId: device.id,
          route: 'ComplaintDetail',
          param: complaint.id.toString(),
          type: 'complaint',
          content: {
            to: device.deviceToken,
            body: `Hai ${complaint.user.firstName}! Laporanmu #${complaint.ref_id} diteruskan kepada ${complaint.assignTo.name}.`,
            channelId: 'default',
            priority: 'high',
            title: 'Laporanmu Diteruskan!',
            data: {
              type: 'complaint',
              id: complaint.id,
              route: 'ComplaintDetail',
              param: complaint.id,
            },
          },
        });
      });
      return activity;
    } catch (err) {
      Logger.error(err, 'Dashboard complete complaint');
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
    data: DeclineComplaintDTO,
    user: any,
    images?: Express.Multer.File[],
  ) {
    try {
      const { activity, complaint } = await this.prismaService.$transaction(
        async (prisma) => {
          // await prisma.complaint.findUniqueOrThrow({
          //   where: {
          //     id: +data.id,
          //   },
          // });

          const activity = await prisma.complaintActivity.create({
            data: {
              title: 'Diproses',
              descripiton: `Laporan sedang ditindaklanjuti oleh ${user.role.name}`,
              notes: data.notes,
              statusId: Status.PROCESS,
              complaintId: +data.id,
              userId: user.id,
            },
          });

          const complaint = await prisma.complaint.update({
            where: { id: +data.id },
            data: { statusId: Status.PROCESS },
            include: { assignTo: true, user: { include: { Device: true } } },
          });

          return { activity, complaint };
        },
      );
      const activityId = activity.id;
      const fileName = `${activity.complaintId}_${activity.title}_image`;

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
        await this.complaintImageUpload.addBulk(jobs);
      }

      await complaint.user.Device.map(async (device) => {
        Logger.log(
          `Sending notification ${device.id} for complaint ${activity.complaintId}`,
          'Process complaint',
        );
        // Send notification
        await this.sendNotification.add('sendComplaintUpdateNotification', {
          userId: device.userId,
          deviceToken: device.deviceToken,
          deviceId: device.id,
          route: 'ComplaintDetail',
          param: complaint.id.toString(),
          type: 'complaint',
          content: {
            to: device.deviceToken,
            body: `Hai ${complaint.user.firstName}! Laporanmu #${complaint.ref_id} sedang ditindaklanjuti oleh ${user.role.name}.`,
            channelId: 'default',
            priority: 'high',
            title: 'Laporanmu Ditindaklanjuti!',
            data: {
              type: 'complaint',
              id: complaint.id,
              route: 'ComplaintDetail',
              param: complaint.id,
            },
          },
        });
      });

      return activity;
    } catch (err) {
      Logger.error(err, 'Dashboard complete complaint');
      throw {
        message: err.message,
        code: HttpStatus.INTERNAL_SERVER_ERROR,
        error: 'There was an error processing your request.',
      };
    } finally {
      this.prismaService.$disconnect;
    }
  }

  async getStatus(id: number) {
    try {
      const status = await this.prismaService.complaintActivity.findMany({
        where: {
          complaintId: id,
        },
        include: { complaint: true, images: true, status: true },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return status;
    } catch (err) {
      throw err;
    }
  }
}
