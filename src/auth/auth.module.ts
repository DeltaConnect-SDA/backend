import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UserService } from 'src/user/user.service';
import { EmailService } from 'src/email/email.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Module({
  providers: [
    AuthService,
    UserService,
    EmailService,
    JwtService,
    ConfigService,
  ],
  controllers: [AuthController],
})
export class AuthModule {}
