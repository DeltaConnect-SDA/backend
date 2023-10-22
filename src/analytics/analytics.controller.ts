import { Controller, Get, HttpStatus, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { AnalyticsService } from './analytics.service';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { JwtGuard } from 'src/auth/guard';
import { Roles } from 'src/auth/decorator';
import { Role } from 'src/auth/enum/role.enum';
import { RolesGuard } from 'src/auth/guard/roles.guard';

@UseGuards(JwtGuard, RolesGuard)
@Controller({ path: 'analytics', version: '1' })
export class AnalyticsController {
  constructor(private analyticsService: AnalyticsService) {}

  @Roles(Role.AUTHORIZER, Role.SUPER_ADMIN, Role.TECHNICAL_EXECUTOR)
  @Get('complaints')
  async complaintAnalytics(@Res() res: Response) {
    try {
      const complaint = await this.analyticsService.complaints();
      return res.status(HttpStatus.OK).json({
        success: true,
        code: HttpStatus.OK,
        message: 'Berhasil menampilkan Analitik!',
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
      return res.status(err.code || HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        code: err.code || HttpStatus.INTERNAL_SERVER_ERROR,
        message: err.message,
        error: err.name || err.error,
      });
    }
  }

  @Roles(Role.AUTHORIZER, Role.SUPER_ADMIN, Role.TECHNICAL_EXECUTOR)
  @Get('kpi')
  async dashboardComplaintAnalytics(@Res() res: Response) {
    try {
      const complaint = await this.analyticsService.complaintsDashboard();
      return res.status(HttpStatus.OK).json({
        success: true,
        code: HttpStatus.OK,
        message: 'Berhasil menampilkan Analitik!',
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
      return res.status(err.code || HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        code: err.code || HttpStatus.INTERNAL_SERVER_ERROR,
        message: err.message,
        error: err.name || err.error,
      });
    }
  }
}
