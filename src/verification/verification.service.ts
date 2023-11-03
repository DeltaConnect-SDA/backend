import { HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { VerificationRequestDTO, VerificationUpdateDTO } from './dto';
import { Status } from 'src/enum';
import { decryptData, encryptData } from 'src/utils/crypto';
import { ConfigService } from '@nestjs/config';
import { Role } from 'src/auth/enum/role.enum';

@Injectable()
export class VerificationService {
  constructor(
    private prismaService: PrismaService,
    private configService: ConfigService,
  ) {}

  async request(data: VerificationRequestDTO, userId: string) {
    const encId = encryptData(data.idNumber).toString('base64');

    try {
      const request = await this.prismaService.user.update({
        where: { id: userId },
        select: { VerificationRequest: true },
        data: {
          VerificationRequest: {
            create: {
              VerificationLog: {
                create: {
                  statusId: Status.WAITING,
                  title: 'Menunggu',
                  content: 'Menunggu verifikasi oleh petugas',
                },
              },
              statusId: Status.WAITING,
            },
          },
          UserDetail: {
            update: {
              identityNumber: encId,
            },
          },
        },
      });
      return request;
    } catch (err) {
      console.log(err);

      throw err;
    }
  }

  async show(id: string, user: any) {
    if (!id) {
      throw {
        message: 'Perminataan tidak ditemukan.',
        code: HttpStatus.NOT_FOUND,
        error: 'Request Not Found',
      };
    }

    const data = await this.prismaService.verificationRequest.findUnique({
      where: { id },
      include: {
        user: {
          include: {
            UserDetail: true,
          },
        },
      },
    });

    if (!data) {
      throw {
        message: 'Perminataan tidak ditemukan.',
        code: HttpStatus.NOT_FOUND,
        error: 'Request Not Found',
      };
    } else if (user.role.type === Role.PUBLIC && data.userId !== user.id) {
      throw {
        message: 'Anda tidak memiliki akses!',
        code: HttpStatus.FORBIDDEN,
        error: 'Forbidden',
      };
    }
    delete data.user.password;
    data.user.UserDetail.identityNumber = decryptData(
      Buffer.from(data.user.UserDetail.identityNumber, 'base64'),
    ).toString('ascii');
    return data;
  }

  async update(data: VerificationUpdateDTO) {
    if (data.status === Status.COMPLETE) {
      const verification = await this.prismaService.verificationRequest.update({
        where: {
          id: data.id,
        },
        data: {
          VerificationLog: {
            create: {
              statusId: data.status,
              title: 'Berhasil',
              content: data.content,
            },
          },
          statusId: data.status,
        },
      });
      return await this.prismaService.user.update({
        where: {
          id: verification.userId,
        },
        data: {
          UserDetail: {
            update: {
              isVerified: true,
            },
          },
        },
      });
    } else if (data.status === Status.DECLINED) {
      return await this.prismaService.verificationRequest.update({
        where: {
          id: data.id,
        },
        data: {
          VerificationLog: {
            create: {
              statusId: data.status,
              title: 'Ditolak',
              content: data.content,
            },
          },
          statusId: data.status,
        },
      });
    }
  }
}
