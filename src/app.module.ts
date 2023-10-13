import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { EmailModule } from './email/email.module';
import { CacheModule } from '@nestjs/cache-manager';
import { WhatsappService } from './whatsapp/whatsapp.service';
import { WhatsappModule } from './whatsapp/whatsapp.module';
import { HttpModule } from '@nestjs/axios';
import * as redisStore from 'cache-manager-redis-store';
import * as Joi from 'joi';
import { IsUniqueConstraint } from './shared/validation/is-unique-constraint';
import { CategoryModule } from './category/category.module';
import { PriorityModule } from './priority/priority.module';
import { ComplaintModule } from './complaint/complaint.module';

@Module({
  imports: [
    CacheModule.registerAsync({
      isGlobal: true,
      imports: [ConfigModule],
      useFactory: async (config: ConfigService) => ({
        store: redisStore,
        host: config.get('REDIS_HOST'),
        port: config.get('REDIS_PORT'),
      }),
      inject: [ConfigService],
    }),
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        DATABASE_URL: Joi.string(),
        PORT: Joi.number().port().default(3000),
        APP_HOST: Joi.string().domain(),
        APP_NAME: Joi.string(),
        REDIS_PORT: Joi.number().default(6379),
        REDIS_HOST: Joi.string(),
        EMAIL_CONFIRMATION_URL: Joi.string(),
        JWT_VERIFICATION_TOKEN_EXPIRATION_TIME: Joi.number(),
        JWT_VERIFICATION_TOKEN_SECRET: Joi.string(),
      }),
    }),
    AuthModule,
    UserModule,
    PrismaModule,
    EmailModule,
    WhatsappModule,
    HttpModule,
    CategoryModule,
    PriorityModule,
    ComplaintModule,
  ],
  providers: [WhatsappService, IsUniqueConstraint],
})
export class AppModule {}
