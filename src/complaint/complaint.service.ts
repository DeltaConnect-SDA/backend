import { Injectable, HttpStatus, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { ComplaintDTO } from './dto';
import { Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';

@Injectable()
export class ComplaintService {
  constructor(
    private prismaService: PrismaService,
    @InjectQueue('imageUpload')
    private readonly complaintImageUpload: Queue,
  ) {}

  async create(
    data: ComplaintDTO,
    userId: string,
    images: Express.Multer.File[],
  ) {
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
          const refId = `DC-LP-${dateString}-${(count + 1)
            .toString()
            .padStart(5, '0')}`;

          // Buat laporan dengan ID referensi
          return prisma.complaint.create({
            data: {
              ...data,
              userId,
              ref_id: refId,
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
          fileName: fileName + index + '.' + image.mimetype.split('/')[1],
          size: image.size,
          mimeType: image.mimetype,
        },
      }));

      await this.complaintImageUpload.addBulk(jobs);
      return complaint;
    } catch (err) {
      Logger.error(err.message, 'User create complaint');
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

  async findById(id: number) {
    const complaints = await this.prismaService.complaint.findUnique({
      where: { id },
      include: {
        ComplaintImages: { select: { path: true, placeholder: true } },
        category: { select: { title: true, id: true } },
        priority: { select: { title: true, id: true, color: true } },
        status: { select: { title: true, color: true } },
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
  }

  async findComplaintWithSaveStatus(complaintId: number, userId: string) {
    const complaint = await this.prismaService.complaint.findUnique({
      where: { id: complaintId },
      include: {
        ComplaintImages: { select: { path: true, placeholder: true } },
        category: { select: { title: true, id: true } },
        priority: { select: { title: true, id: true, color: true } },
        status: { select: { title: true, color: true } },
        ComplaintSaved: {
          where: { userId },
          select: { id: true },
        },
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
    try {
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
    } catch (err) {
      Logger.error(err, 'Get saved complaints');
      throw {
        error: 'There was an error processing your request.',
        code: 500,
        message: err.message,
      };
    }
  }
}
