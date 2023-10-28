import { Process, Processor, OnQueueActive } from '@nestjs/bull';
import { Job } from 'bull';
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { log } from 'console';
import { ExpoPushMessage } from 'expo-server-sdk';
import { NotificationService } from 'src/notification/notification.service';

@Injectable()
@Processor('sendNotification')
export class NotificationQueue {
  constructor(
    private notificationService: NotificationService,
    private prismaSerive: PrismaService,
  ) {}

  @OnQueueActive()
  onActive(job: Job) {
    console.log(
      `Processing job ${job.id} of type ${job.name} with data ${job.data}...`,
    );
  }

  @Process('sendComplaintUpdateNotification')
  async sendComplaintUpdateNotification(
    job: Job<{
      userId: string;
      deviceToken: string;
      deviceId: string;
      route?: string;
      param?: string;
      content: ExpoPushMessage;
    }>,
  ) {
    const { data } = job;
    const { content, deviceToken, deviceId, userId, route, param } = data;

    try {
      Logger.log('Send push notification');
      // send push notification
      await this.notificationService.sendPushNotification(
        deviceToken,
        content,
        deviceId,
      );

      Logger.log('Store notification to DB');
      // store notification to DB
      await this.prismaSerive.user.update({
        where: {
          id: userId,
        },
        data: {
          Notification: {
            create: {
              title: content.title,
              content: content.body,
              route: route || null,
              param: param || null,
            },
          },
        },
      });
    } catch (err) {
      log(err);
      throw new Error(err);
    }
  }
}
