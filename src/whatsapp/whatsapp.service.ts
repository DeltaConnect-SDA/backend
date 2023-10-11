import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { Message } from './types';
import { sendOTPMessageDTO } from './dto';
import { MessageLangCode, MessageTemplate } from './enum';

@Injectable()
export class WhatsappService {
  constructor(private readonly httpService: HttpService) {}

  async sendOTP(data: sendOTPMessageDTO) {
    const response = await this.sendMessage({
      recipient_type: 'individual',
      to: data.toPhone,
      type: 'template',
      template: {
        name: MessageTemplate.SEND_OTP,
        language: { code: MessageLangCode.ID },
        components: [
          {
            type: 'body',
            parameters: [{ type: 'text', text: data.code.toString() }],
          },
          {
            type: 'button',
            sub_type: 'url',
            index: 0,
            parameters: [
              {
                type: 'text',
                text: data.code.toString(),
              },
            ],
          },
        ],
      },
    }).catch((err) => {
      throw err;
    });

    return response;
  }
  async sendMessage(payload: Omit<Message, 'messaging_product'>) {
    return this.httpService.axiosRef.post('/messages', {
      ...payload,
      messaging_product: 'whatsapp',
    });
  }
}
