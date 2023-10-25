import {
  ForbiddenException,
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { ActivationDTO } from './dto/activation.dto';
import { UserService } from 'src/user/user.service';
import {
  LoginDTO,
  RegisterDTO,
  VerficationTokenPayload,
  VerifyEmailDTO,
} from './dto';
import * as argon from 'argon2';
import { Role } from './enum/role.enum';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { EmailService } from 'src/email/email.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { WhatsappService } from 'src/whatsapp/whatsapp.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private userService: UserService,
    private emailService: EmailService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private whatsappService: WhatsappService,
    @Inject(CACHE_MANAGER) private cacheService: Cache,
  ) {}

  async register(data: RegisterDTO) {
    const foundButNotVerified = await this.prisma.user.findUnique({
      where: { email: data.email, OR: [{ phone: data.phone }] },
      select: {
        UserDetail: {
          select: { isPhoneVerified: true, isEmailVerified: true },
        },
      },
    });

    if (foundButNotVerified) {
      throw {
        message: 'Email atau nomor hp sudah terdaftar tetapi belum verifikasi',
        code: HttpStatus.UNAUTHORIZED,
        error: 'Contacts Not Verified',
      };
    }

    // Generate passwprd hash
    const password = await argon.hash(data.password);

    // Get role id
    const role = await this.userService.findRole(Role.PUBLIC);

    // Save the new user in the database
    try {
      const user = await this.prisma.user.create({
        data: {
          firstName: data.firstName,
          LastName: data.lastName,
          email: data.email.toLowerCase(),
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
          phone: true,
          firstName: true,
          LastName: true,
        },
      });

      // Send the email verification request
      // try {
      //   this.emailVerificationRequest({
      //     email: data.email,
      //     phone: data.phone,
      //   });
      // } catch (error) {
      //   throw new NotFoundException(error);
      // }

      const token = await this.signToken(user.id, user.email);

      return [{ user }, token];
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          if (error.meta.target[0] == 'phone') {
            throw {
              message: [{ filed: 'phone', error: 'Nomor HP telah digunakan!' }],
              code: 403,
              error: 'Bad Reuqest',
            };
          } else if (error.meta.target[0] == 'email') {
            throw {
              message: [{ filed: 'email', error: 'Email telah digunakan!' }],
              code: 403,
              error: 'Bad Reuqest',
            };
          }
        }
      }
      throw error;
    } finally {
      await this.prisma.$disconnect();
    }
  }

  async signIn(data: LoginDTO) {
    const user = await this.prisma.user.findUnique({
      where: {
        email: data.email,
        role: { type: Role.PUBLIC },
      },
      select: {
        id: true,
        email: true,
        phone: true,
        firstName: true,
        LastName: true,
        password: true,
        UserDetail: {
          select: { isEmailVerified: true, isPhoneVerified: true },
        },
      },
    });

    if (!user) {
      throw {
        message: 'Pengguna tidak ditumukan!',
        code: HttpStatus.NOT_FOUND,
        error: 'User not found',
      };
    }
    const pwMatches = await argon.verify(user.password, data.password);

    if (!pwMatches) {
      throw {
        message: 'Email atau password salah!',
        code: HttpStatus.BAD_REQUEST,
        error: 'Invalid password',
      };
    }

    delete user.password;

    const token = await this.signToken(user.id, user.email);

    return [{ user }, token];
  }

  async signInDashboard(data: LoginDTO) {
    const user = await this.prisma.user.findUnique({
      where: {
        email: data.email,
        NOT: { role: { type: Role.PUBLIC } },
      },
      select: {
        id: true,
        email: true,
        phone: true,
        firstName: true,
        LastName: true,
        password: true,
        role: {
          select: {
            type: true,
            name: true,
          },
        },
      },
    });

    if (!user) {
      throw {
        message: 'Pengguna tidak ditumukan!',
        code: HttpStatus.NOT_FOUND,
        error: 'User not found',
      };
    }
    const pwMatches = await argon.verify(user.password, data.password);

    if (!pwMatches) {
      throw {
        message: 'Email atau password salah!',
        code: HttpStatus.BAD_REQUEST,
        error: 'Invalid password',
      };
    }

    delete user.password;

    const token = await this.signToken(user.id, user.email);

    return [{ user }, token];
  }

  async signToken(
    userId: string,
    email: string,
  ): Promise<{ access_token: string }> {
    const data = {
      sub: userId,
      email,
    };

    const token = await this.jwtService.signAsync(data, {
      secret: this.configService.get('JWT_SECRET'),
      expiresIn: '30d',
    });

    return {
      access_token: token,
    };
  }

  async emailVerificationRequest(data: ActivationDTO) {
    // Is user found?
    const { LastName, firstName, ...user } = await this.prisma.user.findUnique({
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
    )}?token=${token}&code=${code}&email=${data.email}`;

    // Send verification to user
    try {
      this.emailService.sendVerificationEmail({
        code,
        name: [firstName, LastName].join(' '),
        toEmail: data.email,
        actionUrl: actionUrl,
      });

      // Store user verification request count to redis
      await this.cacheService.store.set(
        `emailVerificationRequestCount-${data.email}`,
        requestCount + 1,
        { ttl: 86400 } as any,
      );

      // Store email verification code to redis
      await this.cacheService.store.set(
        `emailVerificationRequestCode-${data.email}`,
        code,
        { ttl: 360 } as any,
      );

      return { success: true, code: 201, message: 'Email berhasil terkirim!' };
    } catch (error) {
      throw new Error('Gagal mengirim email!');
    }
  }

  async verifyEmail(email: string) {
    const user = await this.userService.findByEmail(email);
    let waError;

    if (!user) {
      throw new BadRequestException('Invalid token!');
    } else if (user.UserDetail.isEmailVerified) {
      throw new ForbiddenException('Email already verified!');
    }

    try {
      await this.prisma.user.update({
        where: { email },
        data: {
          UserDetail: { update: { isEmailVerified: true } },
        },
      });

      // check if phone verified
      if (user.UserDetail.isPhoneVerified === false) {
        console.log('send phone verification request');

        try {
          await this.phoneVerificationRequest(user.phone);
        } catch (error) {
          console.log(error);
          waError = error;
        }
      }

      return {
        status: 'success',
        code: 201,
        message: 'Email berhasil diverifikasi!',
        details: {
          waError,
        },
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

  async decodeEmailConfirmationCode(data: VerifyEmailDTO) {
    const storedCode = await this.cacheService.get(
      `emailVerificationRequestCode-${data.email}`,
    );

    if (storedCode && storedCode == data.code) {
      return data.email;
    } else if (storedCode && storedCode !== data.code) {
      throw new BadRequestException('Invalid verification code!');
    }
    throw new BadRequestException('Expired verification code!');
  }

  async phoneVerificationRequest(phone: string) {
    // Is user found?
    const user = await this.prisma.user.findUnique({
      where: {
        phone,
      },
      include: { UserDetail: true },
    });

    // If user not found, throw not found
    if (!user) {
      throw {
        message: 'User is not registered, please do registration first!',
        code: HttpStatus.NOT_FOUND,
        error: 'Not Found',
      };
    }

    // If user phone is verified
    if (user.UserDetail.isPhoneVerified === true) {
      throw {
        message: 'Phone already verified!',
        code: HttpStatus.FORBIDDEN,
        error: 'Forbidden',
      };
    }

    // Check if the verification request has not reached the limit
    const requestCount: number = (await this.cacheService.get(
      `phoneVerificationRequestCount-${phone}`,
    )) as number;

    if (
      requestCount &&
      requestCount >= this.configService.get('MAX_WA_OTP_REQUESTS')
    ) {
      throw {
        message: 'Permintaan verifikasi mecapai batas harian. Coba lagi besok!',
        code: HttpStatus.TOO_MANY_REQUESTS,
        error: 'Too many requests!',
      };
    }

    // generate verification code and url
    const code = Math.floor(1000 + Math.random() * 9000);

    // Store code to redis for 5 min
    await this.cacheService.store.set(
      `phoneVerificationRequestCode-${phone}`,
      code,
      { ttl: 300 } as any,
    );

    // Send verification to user
    try {
      await this.whatsappService.sendOTP({ code, toPhone: phone });

      // Store user verification request count to redis
      await this.cacheService.store.set(
        `phoneVerificationRequestCount-${phone}`,
        requestCount + 1,
        { ttl: 86400 } as any,
      );

      return true;
    } catch (error) {
      throw {
        error: 'Gagal meengirim kode!',
        code: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error.message,
      };
    }
  }

  async decodeConfirmationCode(code: number, phone: string) {
    // Get stored code from redis
    const storedCode = await this.cacheService.get(
      `phoneVerificationRequestCode-${phone}`,
    );

    // if verification code valid
    if (storedCode && storedCode === code) {
      return phone;
    } else if (storedCode && storedCode !== code) {
      throw {
        error: 'Bad Request',
        code: HttpStatus.BAD_REQUEST,
        message: 'Kode verifikasi tidak valid!',
      };
    }
    throw {
      error: 'Bad Request',
      code: HttpStatus.BAD_REQUEST,
      message: 'Kode verifikasi kadaluarsa!',
    };
  }

  async verifyPhone(phone: string) {
    const user = await this.userService.findByPhone(phone);

    if (!user) {
      throw {
        error: 'Bad Request',
        code: HttpStatus.BAD_REQUEST,
        message: 'Kode verifikasi tidak valid!',
      };
    } else if (user.UserDetail.isPhoneVerified) {
      throw {
        error: 'Bad Request',
        code: HttpStatus.BAD_REQUEST,
        message: 'Nomor HP telah diverifikasi',
      };
    }

    try {
      return await this.prisma.user.update({
        where: { phone },
        data: {
          UserDetail: { update: { isPhoneVerified: true, isActive: true } },
        },
      });
    } catch (err) {
      throw {
        error: 'Gagal verifikasi nomor HP!',
        code: HttpStatus.INTERNAL_SERVER_ERROR,
        message: err.message,
      };
    }
  }
}
