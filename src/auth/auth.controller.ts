import { Body, Controller, Post } from '@nestjs/common';
import { UserService } from 'src/user/user.service';
import { ActivationDTO } from './dto/activation.dto';
import { AuthService } from './auth.service';
import { Throttle } from '@nestjs/throttler';
import { RegisterDTO } from './dto';

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

  @Throttle({ default: { limit: 3, ttl: 300 } })
  @Post('verify/email/request')
  emailVerification(@Body() data: ActivationDTO) {
    return this.authService.emailVerificationRequest(data);
  }
}
