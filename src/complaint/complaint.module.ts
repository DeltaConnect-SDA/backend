import { Module } from '@nestjs/common';
import { ComplaintService } from './complaint.service';
import { ComplaintController } from './complaint.controller';
import { PrismaService } from 'src/prisma/prisma.service';
import { BullModule } from '@nestjs/bull';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'imageUpload',
    }),
  ],
  providers: [ComplaintService, PrismaService],
  controllers: [ComplaintController],
})
export class ComplaintModule {}
