import { HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class CategoryService {
  constructor(private prismaService: PrismaService) {}

  async getAllCatgories() {
    try {
      const categories = await this.prismaService.category.findMany();

      return categories;
    } catch (error) {
      throw {
        error: 'Gagal mengambil data kategori!',
        code: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error.message,
      };
    }
  }
}
