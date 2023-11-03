import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateSuggestionDTO } from './dto';
import { Role } from 'src/auth/enum/role.enum';
import { Prisma } from '@prisma/client';
import { createPaginator } from 'prisma-pagination';

@Injectable()
export class SuggestionService {
  constructor(private prismaService: PrismaService) {}

  async create(data: CreateSuggestionDTO, user: any) {
    if (
      user.role.type !== Role.PUBLIC &&
      !user.UserDetail.isPhoneVerified &&
      !user.UserDetail.isVerified
    ) {
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
          SuggestionComments: { include: { user: true, _count: true } },
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
        SuggestionFeedBack: true,
        SuggestionComments: { include: { user: true } },
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
        SuggestionComments: { include: { user: true, _count: true } },
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
        SuggestionComments: { include: { user: true, _count: true } },
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
    try {
      const isExist = await this.prismaService.suggestionVotes.findMany({
        where: {
          AND: [
            { userId },
            { suggestionId: id },
            { isUp: selection === 'up' ? true : false },
          ],
        },
      });

      if (isExist) {
        throw {
          message: 'Forbidden cccess',
          code: HttpStatus.FORBIDDEN,
          error: 'Anda sudah voting!!',
        };
      }

      const suggestions = await this.prismaService.suggestionVotes.create({
        data: {
          isUp: selection === 'up' ? true : false,
          suggestionId: id,
          userId,
        },
      });

      return suggestions;
    } catch (err) {
      throw err;
    }
  }
}
