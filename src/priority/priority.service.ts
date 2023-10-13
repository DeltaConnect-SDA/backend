import { HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class PriorityService {
  constructor(private prismaService: PrismaService) {}

  async getAllPriorities() {
    try {
      const priorities = await this.prismaService.priority.findMany();

      return priorities;
    } catch (error) {
      throw {
        error: 'Gagal mengambil data kategori!',
        code: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error.message,
      };
    }
  }
}
