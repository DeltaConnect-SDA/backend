import { Injectable, Logger } from '@nestjs/common';
import { Expo, ExpoPushMessage } from 'expo-server-sdk';
import { ConfigService } from '@nestjs/config';
import { UserService } from 'src/user/user.service';

@Injectable()
export class NotificationService {
  private expo: Expo;
  constructor(
    private configService: ConfigService,
    private userService: UserService,
  ) {
    this.expo = new Expo({
      accessToken: configService.get('EXPO_ACCESS_TOKEN'),
    });
  }

  async sendPushNotification(
    expoPushToken: string,
    data: ExpoPushMessage,
    deviceId?: string,
  ) {
    const chunks = this.expo.chunkPushNotifications([
      { to: expoPushToken, ...data },
    ]);
    const tickets = [];

    for (const chunk of chunks) {
      try {
        const ticketChunk = await this.expo.sendPushNotificationsAsync(chunk);
        tickets.push(...ticketChunk);
      } catch (err) {
        Logger.error(err, 'Send push notification chunk');
      }
    }

    let response = null;

    for (const ticket of tickets) {
      if (ticket.status === 'error') {
        if (ticket.details && ticket.details.error === 'DeviceNotRegistered') {
          response = 'DeviceNotRegistered';
          await this.userService.removeDevice(deviceId);
          Logger.warn(`Delete device : ${deviceId}`);
        }
      }

      if (ticket.status === 'ok') {
        response = ticket.id;
      }
    }

    return response;
  }
}
