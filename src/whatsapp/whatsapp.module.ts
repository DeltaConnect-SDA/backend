import { Module } from '@nestjs/common';
import { WhatsappService } from './whatsapp.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [
    ConfigModule,
    {
      ...HttpModule.registerAsync({
        imports: [ConfigModule],
        useFactory: async (configService: ConfigService) => ({
          baseURL: `https://graph.facebook.com/v18.0/${configService.get(
            'WABA_PHONE_ID',
          )}`,
          headers: {
            Authorization: 'Bearer ' + configService.get('WABA_TOKEN'),
          },
          timeout: 7000,
          maxRedirects: 5,
        }),
        inject: [ConfigService],
      }),
      global: true,
    },
  ],
  providers: [WhatsappService],
})
export class WhatsappModule {}
