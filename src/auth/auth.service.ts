import {
  ForbiddenException,
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
  HttpException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { ActivationDTO } from './dto/activation.dto';
import { UserService } from 'src/user/user.service';
import { RegisterDTO, VerficationTokenPayload } from './dto';
import * as argon from 'argon2';
import { Role } from './enum/role.enum';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { EmailService } from 'src/email/email.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private userService: UserService,
    private emailService: EmailService,
    private jwtService: JwtService,
    private configService: ConfigService,
    @Inject(CACHE_MANAGER) private cacheService: Cache,
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
      try {
        this.emailVerificationRequest({
          email: data.email,
          phone: data.phone,
          name: [data.firstName, data.lastName].join(' '),
        });
      } catch (error) {
        throw new NotFoundException(error);
      }

      return { status: 201, message: 'Email berhasil dikirim!', data: user };
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
    const user = await this.prisma.user.findUnique({
      where: {
        email: data.email,
      },
      include: { UserDetail: true },
    });

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

    // Check if the verification request has not reached the limit
    const requestCount: number = (await this.cacheService.get(
      `emailVerificationRequestCount-${data.email}`,
    )) as number;

    if (requestCount && requestCount >= 3) {
      throw new HttpException(
        {
          status: 'Too many requests!',
          code: 429,
          message:
            'Permintaan verifikasi mecapai batas harian. Coba lagi besok!',
        },
        429,
      );
    }

    // generate verification code and url
    const code = Math.floor(1000 + Math.random() * 9000);
    const payload: VerficationTokenPayload = { code, email: data.email };

    const token = await this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_VERIFICATION_TOKEN_SECRET'),
      expiresIn: '5m',
    });

    const actionUrl = `${this.configService.get(
      'EMAIL_CONFIRMATION_URL',
    )}?token=${token}&code=${code}`;

    // Send verification to user
    try {
      this.emailService.sendVerificationEmail({
        code,
        name: data.name,
        toEmail: data.email,
        actionUrl: actionUrl,
      });

      // Store user verification request count to redis
      await this.cacheService.set(
        `emailVerificationRequestCount-${data.email}`,
        requestCount + 1,
        86400,
      );

      return { success: true, code: 201, message: 'Email berhasil terkirim!' };
    } catch (error) {
      throw new Error('Gagal mengirim email!');
    }
    console.log(data);
  }
  async verifyEmail(email: string) {
    const user = await this.userService.findByEmail(email);

    if (!user) {
      throw new BadRequestException('Invalid token!');
    } else if (user.UserDetail.isEmailVerified) {
      throw new ForbiddenException('Email already confirmed');
    }

    try {
      await this.prisma.user.update({
        where: { email },
        data: {
          UserDetail: { update: { isEmailVerified: true } },
        },
      });

      return {
        status: 'success',
        code: 201,
        message: 'Email berhasil diverikasi!',
      };
    } catch (err) {
      throw new Error(err?.message);
    }
  }
  async decodeConfirmationToken(token: string) {
    try {
      const payload = await this.jwtService.verify(token, {
        secret: this.configService.get('JWT_VERIFICATION_TOKEN_SECRET'),
      });

      if (typeof payload === 'object' && 'email' in payload) {
        return payload.email;
      }
      throw new BadRequestException('Token invalid!');
    } catch (error) {
      if (error?.name === 'TokenExpiredError') {
        throw new BadRequestException('Email confirmation token expired');
      }
      throw new BadRequestException('Bad confirmation token');
    }
  }
  async sendPhoneOTP() {}
  async verifyPhone() {}
}
