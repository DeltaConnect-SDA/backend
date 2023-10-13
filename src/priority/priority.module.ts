import { Module } from '@nestjs/common';
import { PriorityService } from './priority.service';
import { PriorityController } from './priority.controller';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  providers: [PriorityService, PrismaService],
  controllers: [PriorityController],
})
export class PriorityModule {}
