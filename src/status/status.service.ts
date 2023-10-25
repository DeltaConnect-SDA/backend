import { HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class StatusService {
  constructor(private prismaService: PrismaService) {}

  async getAllStatuses() {
    try {
      const statuses = await this.prismaService.status.findMany();

      return statuses;
    } catch (error) {
      throw {
        error: 'Gagal mengambil data kategori!',
        code: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error.message,
      };
    }
  }
}
