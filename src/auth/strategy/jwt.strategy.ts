import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    configService: ConfigService,
    private prismaService: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        JwtStrategy.extractJWTFromBearer,
        JwtStrategy.extractJWTFromCookie,
      ]),
      secretOrKey: configService.get('JWT_SECRET'),
    });
  }

  private static extractJWTFromCookie(req: Request): string | null {
    if (req.cookies && req.cookies.access_token) {
      return req.cookies.access_token;
    }
    return null;
  }

  private static extractJWTFromBearer(req: Request): string | null {
    let token = null;
    if (req.headers['authorization']) {
      token = req.headers['authorization'].replace('Bearer', '');
    }
    return token;
  }

  async validate(payload: { sub: string; email: string }) {
    const user = await this.prismaService.user.findUnique({
      where: { id: payload.sub },
      include: { UserDetail: true, role: true },
    });
    delete user?.password;
    delete user?.UserDetail.identityNumber;
    return user;
  }
}
