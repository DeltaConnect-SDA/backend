import {
  Body,
  Controller,
  Post,
  Get,
  Res,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { UserService } from 'src/user/user.service';
import { AuthService } from './auth.service';
import {
  RegisterDTO,
  VerifyEmailDTO,
  ActivationDTO,
  VerifyPhoneDTO,
  LoginDTO,
  DeviceDTO,
} from './dto';
import { Response } from 'express';
import { JwtGuard } from './guard';
import { GetUser, Roles } from './decorator';
import { User } from '@prisma/client';
import { RolesGuard } from './guard/roles.guard';
import { Role } from './enum/role.enum';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

@Controller({
  path: 'auth',
  version: '1',
})
export class AuthController {
  constructor(
    private userService: UserService,
    private authService: AuthService,
  ) {}

  @Post('register')
  async register(@Body() data: RegisterDTO, @Res() res: Response) {
    try {
      const user = await this.authService.register(data);

      return res.status(HttpStatus.CREATED).json({
        success: true,
        code: HttpStatus.CREATED,
        message: 'Registrasi pengguna berhasil!',
        data: user,
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

  @Post('login')
  async login(@Body() data: LoginDTO, @Res() res: Response) {
    try {
      const user = await this.authService.signIn(data);

      return res.status(HttpStatus.OK).json({
        success: true,
        code: HttpStatus.OK,
        message: 'Pengguna berhasil masuk!',
        data: user,
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

  @Get('dashboard/logout')
  async logout(@Res() res: Response) {
    return res
      .status(HttpStatus.OK)
      .clearCookie('access_token', {
        httpOnly: true,
        sameSite: 'none',
        secure: true,
      })
      .json({
        success: true,
        code: HttpStatus.OK,
        message: 'Pengguna berhasil masuk!',
      });
  }

  @Post('dashboard/login')
  async loginDashboard(@Body() data: LoginDTO, @Res() res: Response) {
    try {
      const user = await this.authService.signInDashboard(data);

      return res
        .status(HttpStatus.OK)
        .cookie('access_token', user[1]['access_token'], {
          httpOnly: true,
          secure: true,
          sameSite: 'none',
        })
        .json({
          success: true,
          code: HttpStatus.OK,
          message: 'Pengguna berhasil masuk!',
          data: user,
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
  @Get('profile')
  async profile(@GetUser() user: User) {
    return user;
  }

  @Post('verify/email/request')
  @HttpCode(HttpStatus.CREATED)
  emailVerification(@Body() data: ActivationDTO) {
    return this.authService.emailVerificationRequest(data);
  }

  @Get('verify/email')
  async verifyEmail(@Query() data: VerifyEmailDTO) {
    let email;
    if (data.token) {
      email = await this.authService.decodeConfirmationToken(data.token);
    } else {
      email = await this.authService.decodeEmailConfirmationCode(data);
    }
    return this.authService.verifyEmail(email);
  }

  @Post('verify/phone/request')
  @HttpCode(HttpStatus.CREATED)
  async phoneVerification(@Body() data: ActivationDTO, @Res() res: Response) {
    try {
      await this.authService.phoneVerificationRequest(data.phone);
      return res.status(HttpStatus.OK).json({
        success: true,
        code: HttpStatus.CREATED,
        message: 'Kode verifikasi berhasil terkirim!',
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

  @Get('verify/phone')
  async verifyPhone(@Query() data: VerifyPhoneDTO, @Res() res: Response) {
    try {
      const phone = await this.authService.decodeConfirmationCode(
        data.code,
        data.phone,
      );
      const status = await this.authService.verifyPhone(phone);

      return res.status(HttpStatus.OK).json({
        success: true,
        code: HttpStatus.OK,
        message: 'Nomor hp berhasil diverifikasi!',
        data: status,
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
  @Post('device')
  async storeDeviceToken(@Body() data: DeviceDTO, @Res() res: Response) {
    try {
      const response = await this.userService.addDevice(data);

      return res.status(HttpStatus.OK).json({
        success: true,
        code: HttpStatus.OK,
        message: 'Device berhasil ditambahkan!',
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
