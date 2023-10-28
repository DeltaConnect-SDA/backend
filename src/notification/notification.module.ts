import { Module } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { NotificationController } from './notification.controller';
import { UserService } from 'src/user/user.service';

@Module({
  providers: [NotificationService, UserService],
  controllers: [NotificationController],
})
export class NotificationModule {}
