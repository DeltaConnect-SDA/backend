import { Module } from '@nestjs/common';
import { ImageService } from './image.service';
import { ConfigService } from '@nestjs/config';

@Module({
  providers: [ImageService, ConfigService],
})
export class ImageModule {}
