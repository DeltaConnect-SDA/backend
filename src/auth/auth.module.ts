import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UserService } from 'src/user/user.service';
import { EmailService } from 'src/email/email.service';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { WhatsappService } from 'src/whatsapp/whatsapp.service';
import { JwtStrategy } from './strategy';

@Module({
  imports: [JwtModule.register({})],
  providers: [
    AuthService,
    UserService,
    EmailService,
    JwtService,
    ConfigService,
    WhatsappService,
    JwtStrategy,
  ],
  controllers: [AuthController],
})
export class AuthModule {}
