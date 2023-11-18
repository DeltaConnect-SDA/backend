import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Logger,
  Param,
  Patch,
  Post,
  Query,
  Res,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { SuggestionService } from './suggestion.service';
import { JwtGuard } from 'src/auth/guard';
import { RolesGuard } from 'src/auth/guard/roles.guard';
import { Role } from 'src/auth/enum/role.enum';
import { GetUser, Roles } from 'src/auth/decorator';
import {
  AssignSuggestionDTO,
  CreateSuggestionDTO,
  DeclineSuggestionDTO,
  SuggestionRatingDTO,
} from './dto';
import { Response } from 'express';
import {
  PrismaClientKnownRequestError,
  PrismaClientValidationError,
} from '@prisma/client/runtime/library';
import { FilesInterceptor } from '@nestjs/platform-express';
import { Status } from 'src/enum';

@Controller({
  version: '1',
})
export class SuggestionController {
  constructor(private suggestionService: SuggestionService) {}

  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.PUBLIC)
  @Post('/suggestions')
  async store(
    @Body() data: CreateSuggestionDTO,
    @GetUser() user: any,
    @Res() res: Response,
  ) {
    try {
      const suggestion = await this.suggestionService.create(
        { ...data, categoryId: +data.categoryId, priorityId: +data.priorityId },
        user,
      );
      return res.status(HttpStatus.CREATED).json({
        success: true,
        code: HttpStatus.OK,
        message: 'Usulan berhasil dikirim!',
        data: suggestion,
      });
    } catch (err) {
      return res.status(err.code || HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        code: err.code || HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Internal Server Error',
        error: err.error,
      });
    }
  }

  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.PUBLIC)
  @Get('suggestions/saved')
  async userSavedSuggestions(
    @GetUser('id') userId: string,
    @Res() res: Response,
  ) {
    try {
      const suggestions = await this.suggestionService.savedByUser(userId);

      return res.status(HttpStatus.OK).json({
        success: true,
        code: HttpStatus.OK,
        message: 'Sukses mengambil usulan yang disimpan!',
        data: suggestions,
      });
    } catch (err) {
      return res.status(err.code).json({
        success: false,
        code: err.code,
        message: 'Internal Server Error',
        error: err.error,
      });
    }
  }

  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.PUBLIC)
  @Get('user/suggestions')
  async getByUser(@GetUser('id') userId: string, @Res() res: Response) {
    try {
      const suggestions = await this.suggestionService.findByUser(userId);
      return res.status(HttpStatus.OK).json({
        success: true,
        code: HttpStatus.OK,
        message: 'Berhasil mengambil data usulan!',
        data: suggestions,
      });
    } catch (err) {
      return res.status(err.code || HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        code: err.code || HttpStatus.INTERNAL_SERVER_ERROR,
        message: err.message,
        error: err.error,
      });
    }
  }

  @Get('suggestions/latest')
  async getLatest(@Res() res: Response) {
    try {
      const suggestions = await this.suggestionService.findLatest();
      return res.status(HttpStatus.OK).json({
        success: true,
        code: HttpStatus.OK,
        message: 'Berhasil mengambil data usulan!',
        data: suggestions,
      });
    } catch (err) {
      return res.status(err.code || HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        code: err.code || HttpStatus.INTERNAL_SERVER_ERROR,
        message: err.message,
        error: err.error,
      });
    }
  }

  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.PUBLIC)
  @Post('suggestions/saved')
  async saveComplaint(
    @Body('suggestionId') suggestionId: number,
    @GetUser('id') userId: string,
    @Res() res: Response,
  ) {
    try {
      const complaint = await this.suggestionService.addToSavedSuggestions(
        parseInt(suggestionId.toString(), 10),
        userId,
      );
      return res.status(HttpStatus.CREATED).json({
        success: true,
        code: HttpStatus.OK,
        message: 'Usulan berhasil disimpan!',
        data: complaint,
      });
    } catch (err) {
      return res.status(err.code || HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        code: err.code || HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Internal Server Error',
        error: err.error,
      });
    }
  }

  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.PUBLIC)
  @Delete('suggestions/saved/:id')
  async unSaveSuggestion(
    @Param('id') suggestionId: string,
    @GetUser('id') userId: string,
    @Res() res: Response,
  ) {
    try {
      const suggestion = await this.suggestionService.removeSavedSuggestion(
        parseInt(suggestionId.toString(), 10),
        userId,
      );
      return res.status(HttpStatus.NO_CONTENT).json({
        success: true,
        code: HttpStatus.OK,
        message: 'Usulan berhasil dihapus dari simpan!',
        data: suggestion,
      });
    } catch (err) {
      return res.status(err.code || HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        code: err.code || HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Internal Server Error',
        error: err.error,
      });
    }
  }

  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.PUBLIC)
  @Get('suggestions/:id/auth')
  async showWhenAuthenticated(
    @Param('id') id: string,
    @Res() res: Response,
    @GetUser('id') userId: string,
  ) {
    try {
      const complaints =
        await this.suggestionService.findSuggestionWithSaveStatus(
          parseInt(id, 10),
          userId,
        );
      return res.status(HttpStatus.OK).json({
        success: true,
        code: HttpStatus.OK,
        message: 'Berhasil mengambil data usulan!',
        data: complaints,
      });
    } catch (err) {
      return res.status(err.code || HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        code: err.code || HttpStatus.INTERNAL_SERVER_ERROR,
        message: err.message,
        error: err.error,
      });
    }
  }

  @Get('suggestions/search')
  async searchSuggestions(
    @Query('query') query: string = '',
    @Query('status') statusId: string = null,
    @Query('category') categoryId: string = null,
    @Query('priority') priorityId: string = null,
    @Query('page') page: number = 1,
    @Query('perPage') perPage: number = 10,
    @Query('orderByDate') orderByDate: 'asc' | 'desc' = 'desc',
    @Res() res: Response,
  ) {
    try {
      let categories;
      let statuses;
      let priorities;
      if (categoryId) {
        categories = categoryId.split(',').map(Number);
      } else {
        categories = null;
      }

      if (statusId) {
        statuses = statusId.split(',').map(Number);
      } else {
        statuses = null;
      }

      if (priorityId) {
        priorities = priorityId.split(',').map(Number);
      } else {
        priorities = null;
      }

      const suggestions = await this.suggestionService.searchSuggestions(
        query,
        statuses,
        categories,
        priorities,
        orderByDate,
        page,
        perPage,
      );
      return res.status(HttpStatus.OK).json({
        success: true,
        code: HttpStatus.OK,
        message: 'Berhasil mencari usulan!',
        data: suggestions,
      });
    } catch (err) {
      if (err instanceof PrismaClientKnownRequestError) {
        switch (err.code) {
          case 'P2025': {
            res.status(HttpStatus.NOT_FOUND).json({
              success: false,
              code: HttpStatus.NOT_FOUND,
              message: err.message,
              error: err.name,
            });
          }
          default: {
            console.log(err);

            res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
              success: false,
              code: HttpStatus.INTERNAL_SERVER_ERROR,
              message: err.message,
              error: err.name,
            });
          }
        }
      }

      if (err instanceof PrismaClientValidationError) {
        return res.status(HttpStatus.BAD_REQUEST).json({
          success: false,
          code: HttpStatus.BAD_REQUEST,
          message: 'Invalid request params',
          error: err.name,
        });
      }

      return res.status(err.code || HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        code: err.code || HttpStatus.INTERNAL_SERVER_ERROR,
        message: err.message,
        error: err.name || err.error,
      });
    }
  }

  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.AUTHORIZER, Role.SUPER_ADMIN, Role.TECHNICAL_EXECUTOR)
  @Get('suggestions/search/dashboard')
  async searchSuggestionsDashboard(
    @Query('query') query: string = '',
    @Query('status') statusId: string = null,
    @Query('category') categoryId: string = null,
    @Query('priority') priorityId: string = null,
    @Query('page') page: number = 1,
    @Query('perPage') perPage: number = 10,
    @Query('orderByDate') orderByDate: 'asc' | 'desc' = 'desc',
    @GetUser() user: any,
    @Res() res: Response,
  ) {
    try {
      let categories;
      let statuses;
      let priorities;
      if (categoryId) {
        categories = categoryId.split(',').map(Number);
      } else {
        categories = null;
      }

      if (statusId) {
        statuses = statusId.split(',').map(Number);
      } else {
        statuses = null;
      }

      if (priorityId) {
        priorities = priorityId.split(',').map(Number);
      } else {
        priorities = null;
      }
      const suggestions = await this.suggestionService.searchSuggestions(
        query,
        statuses,
        categories,
        priorities,
        orderByDate,
        page,
        perPage,
        user,
      );
      return res.status(HttpStatus.OK).json({
        success: true,
        code: HttpStatus.OK,
        message: 'Berhasil mencari usulan!',
        data: suggestions,
      });
    } catch (err) {
      if (err instanceof PrismaClientKnownRequestError) {
        switch (err.code) {
          case 'P2025': {
            res.status(HttpStatus.NOT_FOUND).json({
              success: false,
              code: HttpStatus.NOT_FOUND,
              message: err.message,
              error: err.name,
            });
          }
          default: {
            console.log(err);

            res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
              success: false,
              code: HttpStatus.INTERNAL_SERVER_ERROR,
              message: err.message,
              error: err.name,
            });
          }
        }
      }

      if (err instanceof PrismaClientValidationError) {
        return res.status(HttpStatus.BAD_REQUEST).json({
          success: false,
          code: HttpStatus.BAD_REQUEST,
          message: 'Invalid request params',
          error: err.name,
        });
      }
      Logger.error(err, 'Search Dashboard');
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        code: HttpStatus.INTERNAL_SERVER_ERROR,
        message: err.message,
        error: err.name || err.error,
      });
    }
  }

  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.AUTHORIZER, Role.TECHNICAL_EXECUTOR)
  @Get('suggestions/:id/dashboard')
  async showSuggestionDetailDashboard(
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    try {
      const complaints = await this.suggestionService.findDashboard(+id);
      return res.status(HttpStatus.OK).json({
        success: true,
        code: HttpStatus.OK,
        message: 'Berhasil mengambil data usulan!',
        data: complaints,
      });
    } catch (err) {
      return res.status(err.code || HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        code: err.code || HttpStatus.INTERNAL_SERVER_ERROR,
        message: err.message,
        error: err.error,
      });
    }
  }

  @Get('suggestions/:id/comments')
  async suggestionComments(
    @Param('id') id: string,
    @Query('parentId') parentId: string = null,
    @Query('page') page: number = 1,
    @Query('perPage') perPage: number = 10,
    @Query('orderByDate') orderByDate: 'asc' | 'desc' = 'desc',
    @Res() res: Response,
  ) {
    try {
      const response = await this.suggestionService.searchComments(
        +id,
        orderByDate,
        page,
        perPage,
        +parentId,
      );
      return res.status(HttpStatus.OK).json({
        success: true,
        code: HttpStatus.OK,
        message: 'Berhasil mengambil data komentar!',
        data: response,
      });
    } catch (err) {
      if (err instanceof PrismaClientKnownRequestError) {
        switch (err.code) {
          case 'P2025': {
            res.status(HttpStatus.NOT_FOUND).json({
              success: false,
              code: HttpStatus.NOT_FOUND,
              message: err.message,
              error: err.name,
            });
          }
          default: {
            res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
              success: false,
              code: HttpStatus.INTERNAL_SERVER_ERROR,
              message: err.message,
              error: err.name,
            });
          }
        }
      }
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        code: HttpStatus.INTERNAL_SERVER_ERROR,
        message: err.message,
        error: err.name || err.error,
      });
    }
  }
  @Get('suggestions/:id/votes')
  async suggestionVotes(@Param('id') id: string, @Res() res: Response) {
    try {
      const response = await this.suggestionService.getVotes(+id);
      return res.status(HttpStatus.OK).json({
        success: true,
        code: HttpStatus.OK,
        message: 'Berhasil mengambil data voting usulan!',
        data: response,
      });
    } catch (err) {
      if (err instanceof PrismaClientKnownRequestError) {
        switch (err.code) {
          case 'P2025': {
            res.status(HttpStatus.NOT_FOUND).json({
              success: false,
              code: HttpStatus.NOT_FOUND,
              message: err.message,
              error: err.name,
            });
          }
          default: {
            res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
              success: false,
              code: HttpStatus.INTERNAL_SERVER_ERROR,
              message: err.message,
              error: err.name,
            });
          }
        }
      }
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        code: HttpStatus.INTERNAL_SERVER_ERROR,
        message: err.message,
        error: err.name || err.error,
      });
    }
  }

  @Get('suggestions/:id/status')
  async suggestionStatus(@Param('id') id: string, @Res() res: Response) {
    try {
      const response = await this.suggestionService.getStatus(+id);
      return res.status(HttpStatus.OK).json({
        success: true,
        code: HttpStatus.OK,
        message: 'Berhasil mengambil data status usulan!',
        data: response,
      });
    } catch (err) {
      if (err instanceof PrismaClientKnownRequestError) {
        switch (err.code) {
          case 'P2025': {
            res.status(HttpStatus.NOT_FOUND).json({
              success: false,
              code: HttpStatus.NOT_FOUND,
              message: err.message,
              error: err.name,
            });
          }
          default: {
            res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
              success: false,
              code: HttpStatus.INTERNAL_SERVER_ERROR,
              message: err.message,
              error: err.name,
            });
          }
        }
      }
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        code: HttpStatus.INTERNAL_SERVER_ERROR,
        message: err.message,
        error: err.name || err.error,
      });
    }
  }

  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.PUBLIC)
  @Patch('suggestions/:id/votes')
  async suggestionVote(
    @Param('id') id: string,
    @Body() data: { selection: 'up' | 'down' },
    @GetUser() user: any,
    @Res() res: Response,
  ) {
    try {
      const response = await this.suggestionService.vote(
        +id,
        data.selection,
        user.id,
      );
      return res.status(HttpStatus.OK).json({
        success: true,
        code: HttpStatus.OK,
        message: 'Berhasil voting usulan!',
        data: response,
      });
    } catch (err) {
      if (err instanceof PrismaClientKnownRequestError) {
        switch (err.code) {
          case 'P2025': {
            res.status(HttpStatus.NOT_FOUND).json({
              success: false,
              code: HttpStatus.NOT_FOUND,
              message: err.message,
              error: err.name,
            });
          }
          default: {
            res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
              success: false,
              code: HttpStatus.INTERNAL_SERVER_ERROR,
              message: err.message,
              error: err.name,
            });
          }
        }
      }
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        code: HttpStatus.INTERNAL_SERVER_ERROR,
        message: err.message,
        error: err.name || err.error,
      });
    }
  }

  @Get('suggestions/:id')
  async show(@Param('id') id: string, @Res() res: Response) {
    try {
      const suggestion = await this.suggestionService.findById(
        parseInt(id, 10),
      );

      return res.status(HttpStatus.OK).json({
        success: true,
        code: HttpStatus.OK,
        message: 'Berhasil mengambil data usulan!',
        data: suggestion,
      });
    } catch (err) {
      if (err instanceof PrismaClientKnownRequestError) {
        switch (err.code) {
          case 'P2025': {
            res.status(HttpStatus.NOT_FOUND).json({
              success: false,
              code: HttpStatus.NOT_FOUND,
              message: err.message,
              error: err.name,
            });
          }
          default: {
            console.log(err);

            res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
              success: false,
              code: HttpStatus.INTERNAL_SERVER_ERROR,
              message: err.message,
              error: err.name,
            });
          }
        }
      }

      if (err instanceof PrismaClientValidationError) {
        return res.status(HttpStatus.BAD_REQUEST).json({
          success: false,
          code: HttpStatus.BAD_REQUEST,
          message: 'Invalid suggestion id',
          error: err.name,
        });
      }

      return res.status(err.code || HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        code:
          err.code ||
          HttpStatus.INTERNAL_SERVER_ERROR ||
          HttpStatus.INTERNAL_SERVER_ERROR,
        message: err.message,
        error: err.name || err.error,
      });
    }
  }

  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.PUBLIC)
  @Patch('suggestions/:id/cancel')
  async cancelSuggestion(
    @Param('id') id: string,
    @GetUser() user: any,
    @Res() res: Response,
  ) {
    try {
      const suggestion = await this.suggestionService.cancel(
        parseInt(id, 10),
        user,
        Status.CACELED,
      );
      return res.status(HttpStatus.CREATED).json({
        success: true,
        code: HttpStatus.OK,
        message: 'Usulan berhasil dibatalkan!',
        data: suggestion,
      });
    } catch (err) {
      return res.status(err.code || HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        code: err.code || HttpStatus.INTERNAL_SERVER_ERROR,
        message: err.message,
        error: err.error,
      });
    }
  }

  @UseInterceptors(FilesInterceptor('images'))
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.AUTHORIZER, Role.SUPER_ADMIN, Role.TECHNICAL_EXECUTOR)
  @Patch('suggestions/decline')
  async declineSuggestion(
    @UploadedFiles() images: Express.Multer.File[] = null,
    @Body() data: DeclineSuggestionDTO,
    @GetUser() user: any,
    @Res() res: Response,
  ) {
    try {
      const response = await this.suggestionService.decline(data, user, images);

      return res.status(HttpStatus.OK).json({
        success: true,
        code: HttpStatus.OK,
        message: 'Usulan berhasil dibatolak!',
        data: response,
      });
    } catch (err) {
      if (err instanceof PrismaClientKnownRequestError) {
        switch (err.code) {
          case 'P2025': {
            res.status(HttpStatus.NOT_FOUND).json({
              success: false,
              code: HttpStatus.NOT_FOUND,
              message: err.message,
              error: err.name,
            });
          }
          default: {
            res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
              success: false,
              code: HttpStatus.INTERNAL_SERVER_ERROR,
              message: err.message,
              error: err.name,
            });
          }
        }
      }
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        code: HttpStatus.INTERNAL_SERVER_ERROR,
        message: err.message,
        error: err.name || err.error,
      });
    }
  }

  @UseInterceptors(FilesInterceptor('images'))
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.AUTHORIZER, Role.SUPER_ADMIN, Role.TECHNICAL_EXECUTOR)
  @Patch('suggestions/verify')
  async verifySuggestion(
    @UploadedFiles() images: Express.Multer.File[] = null,
    @Body() data: DeclineSuggestionDTO,
    @GetUser() user: any,
    @Res() res: Response,
  ) {
    try {
      const response = await this.suggestionService.verify(data, user, images);

      return res.status(HttpStatus.OK).json({
        success: true,
        code: HttpStatus.OK,
        message: 'Usulan berhasil diverifikasi!',
        data: response,
      });
    } catch (err) {
      if (err instanceof PrismaClientKnownRequestError) {
        switch (err.code) {
          case 'P2025': {
            res.status(HttpStatus.NOT_FOUND).json({
              success: false,
              code: HttpStatus.NOT_FOUND,
              message: err.message,
              error: err.name,
            });
          }
          default: {
            res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
              success: false,
              code: HttpStatus.INTERNAL_SERVER_ERROR,
              message: err.message,
              error: err.name,
            });
          }
        }
      }
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        code: HttpStatus.INTERNAL_SERVER_ERROR,
        message: err.message,
        error: err.name || err.error,
      });
    }
  }

  @UseInterceptors(FilesInterceptor('images'))
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.AUTHORIZER, Role.SUPER_ADMIN, Role.TECHNICAL_EXECUTOR)
  @Patch('suggestions/complete')
  async completeSuggestion(
    @UploadedFiles() images: Express.Multer.File[] = null,
    @Body() data: DeclineSuggestionDTO,
    @GetUser() user: any,
    @Res() res: Response,
  ) {
    try {
      const response = await this.suggestionService.complete(
        data,
        user,
        images,
      );

      return res.status(HttpStatus.OK).json({
        success: true,
        code: HttpStatus.OK,
        message: 'Usulan berhasil diselesaikan!',
        data: response,
      });
    } catch (err) {
      if (err instanceof PrismaClientKnownRequestError) {
        switch (err.code) {
          case 'P2025': {
            res.status(HttpStatus.NOT_FOUND).json({
              success: false,
              code: HttpStatus.NOT_FOUND,
              message: err.message,
              error: err.name,
            });
          }
          default: {
            res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
              success: false,
              code: HttpStatus.INTERNAL_SERVER_ERROR,
              message: err.message,
              error: err.name,
            });
          }
        }
      }
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        code: HttpStatus.INTERNAL_SERVER_ERROR,
        message: err.message,
        error: err.name || err.error,
      });
    }
  }

  @UseInterceptors(FilesInterceptor('images'))
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.AUTHORIZER, Role.SUPER_ADMIN, Role.TECHNICAL_EXECUTOR)
  @Patch('suggestions/plan')
  async planSuggestion(
    @UploadedFiles() images: Express.Multer.File[] = null,
    @Body() data: DeclineSuggestionDTO,
    @GetUser() user: any,
    @Res() res: Response,
  ) {
    try {
      const response = await this.suggestionService.plan(data, user, images);

      return res.status(HttpStatus.OK).json({
        success: true,
        code: HttpStatus.OK,
        message: 'Usulan berhasil direncanakan!',
        data: response,
      });
    } catch (err) {
      if (err instanceof PrismaClientKnownRequestError) {
        switch (err.code) {
          case 'P2025': {
            res.status(HttpStatus.NOT_FOUND).json({
              success: false,
              code: HttpStatus.NOT_FOUND,
              message: err.message,
              error: err.name,
            });
          }
          default: {
            res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
              success: false,
              code: HttpStatus.INTERNAL_SERVER_ERROR,
              message: err.message,
              error: err.name,
            });
          }
        }
      }
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        code: HttpStatus.INTERNAL_SERVER_ERROR,
        message: err.message,
        error: err.name || err.error,
      });
    }
  }

  @UseInterceptors(FilesInterceptor('images'))
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.AUTHORIZER, Role.SUPER_ADMIN, Role.TECHNICAL_EXECUTOR)
  @Patch('suggestions/assign')
  async completeAssign(
    @UploadedFiles() images: Express.Multer.File[] = null,
    @Body() data: AssignSuggestionDTO,
    @GetUser() user: any,
    @Res() res: Response,
  ) {
    try {
      const response = await this.suggestionService.assign(data, user, images);

      return res.status(HttpStatus.OK).json({
        success: true,
        code: HttpStatus.OK,
        message: 'Usulan berhasil diteruskan!',
        data: response,
      });
    } catch (err) {
      if (err instanceof PrismaClientKnownRequestError) {
        switch (err.code) {
          case 'P2025': {
            res.status(HttpStatus.NOT_FOUND).json({
              success: false,
              code: HttpStatus.NOT_FOUND,
              message: err.message,
              error: err.name,
            });
          }
          default: {
            res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
              success: false,
              code: HttpStatus.INTERNAL_SERVER_ERROR,
              message: err.message,
              error: err.name,
            });
          }
        }
      }
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        code: HttpStatus.INTERNAL_SERVER_ERROR,
        message: err.message,
        error: err.name || err.error,
      });
    }
  }

  @UseInterceptors(FilesInterceptor('images'))
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.AUTHORIZER, Role.SUPER_ADMIN, Role.TECHNICAL_EXECUTOR)
  @Patch('suggestions/process')
  async completeProcess(
    @UploadedFiles() images: Express.Multer.File[] = null,
    @Body() data: DeclineSuggestionDTO,
    @GetUser() user: any,
    @Res() res: Response,
  ) {
    try {
      const response = await this.suggestionService.process(data, user, images);

      return res.status(HttpStatus.OK).json({
        success: true,
        code: HttpStatus.OK,
        message: 'Usulan berhasil diproses!',
        data: response,
      });
    } catch (err) {
      if (err instanceof PrismaClientKnownRequestError) {
        switch (err.code) {
          case 'P2025': {
            res.status(HttpStatus.NOT_FOUND).json({
              success: false,
              code: HttpStatus.NOT_FOUND,
              message: err.message,
              error: err.name,
            });
          }
          default: {
            res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
              success: false,
              code: HttpStatus.INTERNAL_SERVER_ERROR,
              message: err.message,
              error: err.name,
            });
          }
        }
      }
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        code: HttpStatus.INTERNAL_SERVER_ERROR,
        message: err.message,
        error: err.name || err.error,
      });
    }
  }

  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.PUBLIC)
  @Post('suggestions/:id/rating')
  async ratingComplaint(
    @Body() data: SuggestionRatingDTO,
    @Param('id') suggestionId: string,
    @GetUser('id') id: string,
    @Res() res: Response,
  ) {
    try {
      const suggestion = await this.suggestionService.rating(
        data,
        id,
        +suggestionId,
      );
      return res.status(HttpStatus.CREATED).json({
        success: true,
        code: HttpStatus.OK,
        message: 'Berhasil memberikan penilaian!',
        data: suggestion,
      });
    } catch (err) {
      if (err instanceof PrismaClientKnownRequestError) {
        switch (err.code) {
          case 'P2025': {
            res.status(HttpStatus.NOT_FOUND).json({
              success: false,
              code: HttpStatus.NOT_FOUND,
              message: err.message,
              error: err.name,
            });
          }
          default: {
            res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
              success: false,
              code: HttpStatus.INTERNAL_SERVER_ERROR,
              message: err.message,
              error: err.name,
            });
          }
        }
      }
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        code: HttpStatus.INTERNAL_SERVER_ERROR,
        message: err.message,
        error: err.name || err.error,
      });
    }
  }
}
