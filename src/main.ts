import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import {
  BadRequestException,
  Logger,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import * as compression from 'compression';
import { ConfigService } from '@nestjs/config';
import { ValidationError, useContainer } from 'class-validator';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['debug', 'error', 'log'],
  });
  const configService: ConfigService = app.get(ConfigService);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      exceptionFactory: (validationErrors: ValidationError[] = []) => {
        return new BadRequestException(
          validationErrors.map((error) => ({
            field: error.property,
            error: Object.values(error.constraints),
          })),
        );
      },
    }),
  );
  useContainer(app.select(AppModule), { fallbackOnErrors: true });
  app.enableCors({
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
    preflightContinue: false,
    allowedHeaders: 'Content-Type, Accept',
  });
  app.use(cookieParser());
  app.enableVersioning({
    type: VersioningType.URI,
  });
  app.use(compression());
  const PORT = configService.get('PORT') || 80;
  await app.listen(PORT);
  Logger.log(`Listening on http://localhost:${PORT}`);
}
bootstrap();
