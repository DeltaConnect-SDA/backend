import { Injectable, HttpStatus, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { ComplaintDTO } from './dto';
import { Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';
import { log } from 'console';

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
      log(complaint);
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

  async findLatest() {
    const complaints = await this.prismaService.complaint.findMany({
      include: {
        ComplaintImages: { select: { path: true, placeholder: true } },
        category: { select: { title: true, id: true } },
        priority: { select: { title: true, id: true, color: true } },
        status: { select: { title: true, color: true } },
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
}
