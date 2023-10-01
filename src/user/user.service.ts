import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Role } from 'src/auth/enum/role.enum';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}
  async createUser() {}
  async findByEmail(email: string) {
    const user = await this.prisma.user.findFirst({
      where: { email },
      include: { UserDetail: true },
    });

    delete user.password;
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
  async checkIfEmailAvailable() {}
  async checkIfPhoneAvailable() {}
}
