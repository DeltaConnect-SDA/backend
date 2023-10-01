import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { ActivationDTO } from './dto/activation.dto';
import { UserService } from 'src/user/user.service';
import { RegisterDTO } from './dto';
import * as argon from 'argon2';
import { Role } from './enum/role.enum';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private userService: UserService,
  ) {}

  async register(data: RegisterDTO) {
    // Generate passwprd hash
    const password = await argon.hash(data.password);

    // Get role id
    const role = await this.userService.findRole(Role.Masyarakat);

    // Save the new user in the database
    try {
      const user = await this.prisma.user.create({
        data: {
          firstName: data.firstName,
          LastName: data.lastName,
          email: data.email,
          phone: data.phone,
          password,
          role: {
            connect: { id: role.id },
          },
          UserDetail: {
            create: {},
          },
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          LastName: true,
        },
      });

      // Send the email verification request
      this.emailVerificationRequest({ email: data.email, phone: data.phone });

      return user;
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ForbiddenException('Email telah digunakan!');
        }
      }
      throw error;
    } finally {
      await this.prisma.$disconnect();
    }
  }

  async emailVerificationRequest(data: ActivationDTO) {
    // Is user found?
    const user = await this.userService.findByEmail(data.email);

    // If user not found, throw not found
    if (!user) {
      throw new NotFoundException(
        'User is not registered, please do registration first!',
      );
    }

    // If user email is verified
    if (user.UserDetail.isEmailVerified === true) {
      throw new ForbiddenException('Email already verified!');
    }

    // Send OTP to user
    this.sendEmailOTP(data.email);
    console.log(data);
    return;
  }
  async sendPhoneOTP() {}
  async sendEmailOTP(email: string) {
    return email;
  }
  async verifyEmail() {}
  async verifyPhone() {}
}
