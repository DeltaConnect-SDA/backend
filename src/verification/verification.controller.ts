import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { VerificationService } from './verification.service';
import { Response } from 'express';
import { VerificationRequestDTO, VerificationUpdateDTO } from './dto';
import { JwtGuard } from 'src/auth/guard';
import { RolesGuard } from 'src/auth/guard/roles.guard';
import { Role } from 'src/auth/enum/role.enum';
import { GetUser, Roles } from 'src/auth/decorator';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

@Controller({
  path: 'users/verifications',
  version: '1',
})
export class VerificationController {
  constructor(private verificationService: VerificationService) {}

  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.PUBLIC)
  @Post()
  async createVerificationRequest(
    @Body() data: VerificationRequestDTO,
    @GetUser('id') userId: string,
    @Res() res: Response,
  ) {
    try {
      const response = await this.verificationService.request(data, userId);

      return res.status(HttpStatus.CREATED).json({
        success: true,
        message: 'Berhasil meminta verifikasi.',
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
      return res
        .status(err.httpStatusCode || HttpStatus.INTERNAL_SERVER_ERROR)
        .json({
          success: false,
          code: err.httpStatusCode || HttpStatus.INTERNAL_SERVER_ERROR,
          message: err.message,
          error: err.name || err.error,
        });
    }
  }

  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.AUTHORIZER)
  @Patch('update')
  async updateVerificationStatus(
    @Body() data: VerificationUpdateDTO,
    @Res() res: Response,
  ) {
    try {
      await this.verificationService.update(data);
      return res.status(HttpStatus.NO_CONTENT).json({
        success: true,
        message: 'Berhasil update status verifikasi.',
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
  @Roles(Role.SUPER_ADMIN, Role.AUTHORIZER)
  @Get('search')
  async showAllVerificationRequests(
    @Query('query') query: string = '',
    @Query('page') page: number = 1,
    @Query('perPage') perPage: number = 10,
    @Query('orderByDate') orderByDate: 'asc' | 'desc' = 'desc',
    @Res() res: Response,
  ) {
    try {
      const response = await this.verificationService.search(
        query,
        page,
        perPage,
        orderByDate,
      );
      return res.status(HttpStatus.OK).json({
        success: true,
        message: 'Berhasil mendapatkan data verifikasi.',
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

      return res.status(err.code || HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        code: err.code || HttpStatus.INTERNAL_SERVER_ERROR,
        message: err.message,
        error: err.name || err.error,
      });
    }
  }

  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.AUTHORIZER, Role.PUBLIC)
  @Get(':id')
  async showVerificationRequest(
    @Param('id') id: string,
    @GetUser() user: any,
    @Res() res: Response,
  ) {
    try {
      const response = await this.verificationService.show(id, user);
      return res.status(HttpStatus.OK).json({
        success: true,
        message: 'Berhasil mendapatkan data verifikasi.',
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

      return res.status(err.code || HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        code: err.code || HttpStatus.INTERNAL_SERVER_ERROR,
        message: err.message,
        error: err.name || err.error,
      });
    }
  }
}
