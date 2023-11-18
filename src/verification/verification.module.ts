import { Module } from '@nestjs/common';
import { VerificationService } from './verification.service';
import { VerificationController } from './verification.controller';
import { BullModule } from '@nestjs/bull';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'sendNotification',
    }),
  ],
  providers: [VerificationService],
  controllers: [VerificationController],
})
export class VerificationModule {}
