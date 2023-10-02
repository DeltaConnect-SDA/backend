import { Body, Controller, Ip, Post } from '@nestjs/common';
import { UserService } from 'src/user/user.service';
import { ActivationDTO } from './dto/activation.dto';
import { AuthService } from './auth.service';
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

  @Post('verify/email/request')
  emailVerification(@Body() data: ActivationDTO, @Ip() ip: number) {
    console.log(ip);
    return this.authService.emailVerificationRequest(data);
  }
}
