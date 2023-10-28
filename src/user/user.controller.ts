import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Patch,
  Res,
  UseGuards,
} from '@nestjs/common';
import { UserService } from './user.service';
import { Response } from 'express';
import { JwtGuard } from 'src/auth/guard';
import { RolesGuard } from 'src/auth/guard/roles.guard';
import { GetUser, Roles } from 'src/auth/decorator';
import { Role } from 'src/auth/enum/role.enum';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { ReadNotificationDTO } from './dto';

@Controller({ path: 'users', version: '1' })
export class UserController {
  constructor(private userService: UserService) {}

  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.PUBLIC)
  @Get('notifications')
  async getUserNotif(@Res() res: Response, @GetUser() user: any) {
    try {
      const response = await this.userService.getNotifications(user);

      return res.status(HttpStatus.OK).json({
        success: true,
        code: HttpStatus.OK,
        message: 'Berhasil mengambil data notifikasi pengguna!',
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
  @Patch('notifications/read')
  async readUserNotif(
    @Body() data: ReadNotificationDTO,
    @Res() res: Response,
    @GetUser() user: any,
  ) {
    try {
      const response = await this.userService.readNotifications(
        +data.notificationId,
        user,
      );

      return res.status(HttpStatus.OK).json({
        success: true,
        code: HttpStatus.OK,
        message: 'Berhasil merubah status notifikasi pengguna!',
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
}
