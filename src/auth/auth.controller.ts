import {
  Body,
  Controller,
  Post,
  Get,
  Res,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { UserService } from 'src/user/user.service';
import { AuthService } from './auth.service';
import {
  RegisterDTO,
  VerifyEmailDTO,
  ActivationDTO,
  VerifyPhoneDTO,
} from './dto';
import { Response } from 'express';

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
}
