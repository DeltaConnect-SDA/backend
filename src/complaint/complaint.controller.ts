import {
  Body,
  Controller,
  HttpStatus,
  Post,
  Res,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
  Get,
  Param,
  Delete,
  Req,
  Patch,
  Query,
  Logger,
} from '@nestjs/common';
import { ComplaintService } from './complaint.service';
import { ComplaintDTO, ComplaintRatingDTO, DeclineComplaintDTO } from './dto';
import { GetUser, Roles } from 'src/auth/decorator';
import { Request, Response } from 'express';
import { JwtGuard } from 'src/auth/guard';
import { FilesInterceptor } from '@nestjs/platform-express';
import { Status } from 'src/enum';
import {
  PrismaClientKnownRequestError,
  PrismaClientValidationError,
} from '@prisma/client/runtime/library';
import { RolesGuard } from 'src/auth/guard/roles.guard';
import { Role } from 'src/auth/enum/role.enum';

@Controller({ version: '1' })
export class ComplaintController {
  constructor(private complaintService: ComplaintService) {}

  /**
   * Create new complaint
   * @param images Complaint images
   * @param data Complaint data
   * @param userId Creator id
   * @param req Request
   * @param res Response
   * @returns Complaint data
   */
  @UseInterceptors(FilesInterceptor('images'))
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.PUBLIC)
  @Post('complaints')
  async store(
    @UploadedFiles() images: Express.Multer.File[],
    @Body() data: ComplaintDTO,
    @GetUser('id') userId: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    try {
      const complaint = await this.complaintService.create(
        {
          ...data,
          categoryId: parseInt(data.categoryId.toString(), 10),
          priorityId: parseInt(data.priorityId.toString(), 10),
        },
        userId,
        images,
        req.user,
      );
      return res.status(HttpStatus.CREATED).json({
        success: true,
        code: HttpStatus.OK,
        message: 'Laporan berhasil dikirim!',
        data: complaint,
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

  /**
   * Get complaints
   * @param res Response
   * @returns Complaints
   */
  @Get('complaints')
  async getComplaints(
    @Query('page') page: number = 1,
    @Query('perPage') perPage: number = 10,
    @Query('orderByDate') orderByDate: 'asc' | 'desc' = 'desc',
    @Res() res: Response,
  ) {
    try {
      const complaints = await this.complaintService.get(
        page,
        perPage,
        orderByDate,
      );
      return res.status(HttpStatus.OK).json({
        success: true,
        code: HttpStatus.OK,
        message: 'Berhasil mengambil data laporan!',
        data: complaints,
      });
    } catch (err) {
      return res.status(err.code).json({
        success: false,
        code: err.code,
        message: err.message,
        error: err.error,
      });
    }
  }

  /**
   * Get complaints
   * @param res Response
   * @returns Complaints
   */
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.AUTHORIZER, Role.SUPER_ADMIN, Role.TECHNICAL_EXECUTOR)
  @Get('complaints/dashboard')
  async dashboardComplaints(
    @Query('page') page: number = 1,
    @Query('perPage') perPage: number = 10,
    @Query('orderByDate') orderByDate: 'asc' | 'desc' = 'desc',
    @GetUser() user: any,
    @Res() res: Response,
  ) {
    try {
      const complaints = await this.complaintService.get(
        page,
        perPage,
        orderByDate,
        user,
      );
      return res.status(HttpStatus.OK).json({
        success: true,
        code: HttpStatus.OK,
        message: 'Berhasil mengambil data laporan!',
        data: complaints,
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
              error: err.name || err.stack,
            });
          }
        }
      }
      Logger.error(err);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        code: HttpStatus.INTERNAL_SERVER_ERROR,
        error: err.name || err.error,
      });
    }
  }

  /**
   * Get latest complaints
   * @param res Response
   * @returns Latest Complaints
   */
  @Get('complaints/latest')
  async getLatest(@Res() res: Response) {
    try {
      const complaints = await this.complaintService.findLatest();
      return res.status(HttpStatus.OK).json({
        success: true,
        code: HttpStatus.OK,
        message: 'Berhasil mengambil data laporan!',
        data: complaints,
      });
    } catch (err) {
      return res.status(err.code).json({
        success: false,
        code: err.code,
        message: err.message,
        error: err.error,
      });
    }
  }

  /**
   * Get Complaints By User
   * @param userId User Id from guards
   * @param res Response
   * @returns Complaints by user
   */
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.PUBLIC)
  @Get('user/complaints')
  async getByUser(@GetUser('id') userId: string, @Res() res: Response) {
    try {
      const complaints = await this.complaintService.findByUser(userId);
      return res.status(HttpStatus.OK).json({
        success: true,
        code: HttpStatus.OK,
        message: 'Berhasil mengambil data laporan!',
        data: complaints,
      });
    } catch (err) {
      return res.status(err.code).json({
        success: false,
        code: err.code,
        message: err.message,
        error: err.error,
      });
    }
  }

  /**
   * Get saved complaints by authenticated user
   * @param userId User Id
   * @param res Response
   * @returns Saved complaints by user
   */
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.PUBLIC)
  @Get('complaints/saved')
  async userSavedComplaints(
    @GetUser('id') userId: string,
    @Res() res: Response,
  ) {
    try {
      const complaints =
        await this.complaintService.getComplaintSavedByUser(userId);

      return res.status(HttpStatus.OK).json({
        success: true,
        code: HttpStatus.OK,
        message: 'Sukses mengambil laporan yang disimpan!',
        data: complaints,
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

  /**
   * Save a complaint
   * @param complaintId Complaint Id to save
   * @param userId User Id want to save the complaint
   * @param res Response
   * @returns Complaint
   */
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.PUBLIC)
  @Post('complaints/saved')
  async saveComplaint(
    @Body('complaintId') complaintId: number,
    @GetUser('id') userId: string,
    @Res() res: Response,
  ) {
    try {
      const complaint = await this.complaintService.addToSavedComplaints(
        parseInt(complaintId.toString(), 10),
        userId,
      );
      return res.status(HttpStatus.CREATED).json({
        success: true,
        code: HttpStatus.OK,
        message: 'Laporan berhasil disimpan!',
        data: complaint,
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

  /**
   * Delete complaint from saved
   * @param complaintId Complaint id to delete
   * @param userId User Id want to delete the complaint
   * @param res Response
   * @returns Complaint
   */
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.PUBLIC)
  @Delete('complaints/saved/:id')
  async unSaveComplaint(
    @Param('id') complaintId: string,
    @GetUser('id') userId: string,
    @Res() res: Response,
  ) {
    try {
      const complaint = await this.complaintService.removeSavedComplaints(
        parseInt(complaintId.toString(), 10),
        userId,
      );
      return res.status(HttpStatus.NO_CONTENT).json({
        success: true,
        code: HttpStatus.OK,
        message: 'Laporan berhasil dihapus dari simpan!',
        data: complaint,
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

  @Get('complaints/count/day')
  async countComplaintsByDay(@Res() res: Response) {
    try {
      const complaint = await this.complaintService.countByDay();
      return res.status(HttpStatus.OK).json({
        success: true,
        code: HttpStatus.OK,
        message: 'Berhasil mencari laporan!',
        data: complaint,
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

  @Get('complaints/search')
  async searchComplaints(
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

      const complaint = await this.complaintService.searchComplaints(
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
        message: 'Berhasil mencari laporan!',
        data: complaint,
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
  @Get('complaints/search/dashboard')
  async searchComplaintsDashboard(
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
      const complaint = await this.complaintService.searchComplaints(
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
        message: 'Berhasil mencari laporan!',
        data: complaint,
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

  /**
   * Get complaint by Id
   * @param id Complaint Id
   * @param res Response
   * @returns Complaint data
   */
  @Get('complaints/:id')
  async show(@Param('id') id: string, @Res() res: Response) {
    try {
      const complaint = await this.complaintService.findById(parseInt(id, 10));

      return res.status(HttpStatus.OK).json({
        success: true,
        code: HttpStatus.OK,
        message: 'Berhasil mengambil data laporan!',
        data: complaint,
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
          message: 'Invalid complaint id',
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

  /**
   * Get complaint by Id for authenticated user
   * @param id Complaint Id
   * @param res Response
   * @param userId User Id
   * @returns Complaint data
   */
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.PUBLIC)
  @Get('complaints/:id/auth')
  async showWhenAuthenticated(
    @Param('id') id: string,
    @Res() res: Response,
    @GetUser('id') userId: string,
  ) {
    try {
      const complaints =
        await this.complaintService.findComplaintWithSaveStatus(
          parseInt(id, 10),
          userId,
        );
      return res.status(HttpStatus.OK).json({
        success: true,
        code: HttpStatus.OK,
        message: 'Berhasil mengambil data laporan!',
        data: complaints,
      });
    } catch (err) {
      return res.status(err.code).json({
        success: false,
        code: err.code,
        message: err.message,
        error: err.error,
      });
    }
  }

  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.PUBLIC)
  @Patch('complaints/:id/cancel')
  async cancleComplaint(
    @Param('id') id: string,
    @GetUser() user: any,
    @Res() res: Response,
  ) {
    try {
      const complaint = await this.complaintService.cancel(
        parseInt(id, 10),
        user,
        Status.CACELED,
      );
      return res.status(HttpStatus.CREATED).json({
        success: true,
        code: HttpStatus.OK,
        message: 'Laporan berhasil dibatalkan!',
        data: complaint,
      });
    } catch (err) {
      return res.status(err.code).json({
        success: false,
        code: err.code,
        message: err.message,
        error: err.error,
      });
    }
  }

  @UseGuards(JwtGuard)
  @Patch('complaints/:id/done')
  async completeComplaint(@Body() data: any, @GetUser() user: any) {
    return [user, data];
  }

  @UseInterceptors(FilesInterceptor('images'))
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.AUTHORIZER, Role.SUPER_ADMIN, Role.TECHNICAL_EXECUTOR)
  @Patch('complaints/decline')
  async declineComplaint(
    @UploadedFiles() images: Express.Multer.File[] = null,
    @Body() data: DeclineComplaintDTO,
    @GetUser() user: any,
    @Res() res: Response,
  ) {
    try {
      const response = await this.complaintService.decline(data, user, images);

      return res.status(HttpStatus.OK).json({
        success: true,
        code: HttpStatus.OK,
        message: 'Laporan berhasil dibatolak!',
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
  @Patch('complaints/verify')
  async verifyComplaint(
    @UploadedFiles() images: Express.Multer.File[] = null,
    @Body() data: DeclineComplaintDTO,
    @GetUser() user: any,
    @Res() res: Response,
  ) {
    try {
      const response = await this.complaintService.verify(data, user, images);

      return res.status(HttpStatus.OK).json({
        success: true,
        code: HttpStatus.OK,
        message: 'Laporan berhasil diverifikasi!',
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
  @Post('complaints/:id/rating')
  async ratingComplaint(
    @Body() data: ComplaintRatingDTO,
    @Param('id') complaintId: string,
    @GetUser('id') id: string,
    @Res() res: Response,
  ) {
    try {
      const complaint = await this.complaintService.rating(
        data,
        id,
        +complaintId,
      );
      return res.status(HttpStatus.CREATED).json({
        success: true,
        code: HttpStatus.OK,
        message: 'Berhasil memberikan penilaian!',
        data: complaint,
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
