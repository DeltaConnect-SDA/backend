import {
  Body,
  Controller,
  Post,
  Get,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { UserService } from 'src/user/user.service';
import { AuthService } from './auth.service';
import { RegisterDTO, VerifyEmailDTO, ActivationDTO } from './dto';

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
  register(@Body() data: RegisterDTO) {
    return this.authService.register(data);
  }

  @Post('verify/email/request')
  @HttpCode(HttpStatus.CREATED)
  emailVerification(@Body() data: ActivationDTO) {
    return this.authService.emailVerificationRequest(data);
  }

  @Get('verify/email')
  async verifyEmail(@Query() data: VerifyEmailDTO) {
    const email = await this.authService.decodeConfirmationToken(data.token);
    return this.authService.verifyEmail(email);
  }
}
