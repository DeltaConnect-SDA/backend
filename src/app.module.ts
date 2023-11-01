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
import { ImageModule } from './image/image.module';
import { BullModule } from '@nestjs/bull';
import { ImageQueue } from './queue/image.queue';
import { ImageService } from './image/image.service';
import { AnalyticsModule } from './analytics/analytics.module';
import { StatusModule } from './status/status.module';
import { NotificationModule } from './notification/notification.module';
import { NotificationService } from './notification/notification.service';
import { UserService } from './user/user.service';
import { NotificationQueue } from './queue/notification.queue';
import { VerificationModule } from './verification/verification.module';

@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (config: ConfigService) => ({
        redis: {
          host: config.get('REDIS_HOST'),
          port: config.get('REDIS_PORT'),
          password: config.get('REDIS_PASSWORD'),
          no_ready_check: true,
        },
      }),
      inject: [ConfigService],
    }),
    BullModule.registerQueue(
      {
        name: 'imageUpload',
      },
      {
        name: 'sendNotification',
      },
    ),
    CacheModule.registerAsync({
      isGlobal: true,
      imports: [ConfigModule],
      useFactory: async (config: ConfigService) => ({
        store: redisStore,
        host: config.get('REDIS_HOST'),
        port: config.get('REDIS_PORT'),
        password: config.get('REDIS_PASSWORD'),
        no_ready_check: true,
        ttl: 300,
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
    ImageModule,
    AnalyticsModule,
    StatusModule,
    NotificationModule,
    VerificationModule,
  ],
  providers: [
    WhatsappService,
    IsUniqueConstraint,
    ImageQueue,
    ImageService,
    NotificationService,
    NotificationQueue,
    UserService,
  ],
})
export class AppModule {}
