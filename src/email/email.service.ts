import { HttpException, Injectable } from '@nestjs/common';
import { SendEmailVerificationDTO } from './dto';
import { ConfigService } from '@nestjs/config';
import { EmailSender, EmailTemplate } from './enum';
import * as Mailjet from 'node-mailjet';

@Injectable()
export class EmailService {
  private readonly mailClient: Mailjet.Client;

  constructor(private config: ConfigService) {
    this.mailClient = Mailjet.Client.apiConnect(
      this.config.get('MJ_APIKEY_PUBLIC'),
      this.config.get('MJ_APIKEY_PRIVATE'),
      {
        config: {},
        options: {},
      },
    );
  }

  async sendVerificationEmail(data: SendEmailVerificationDTO) {
    let result = null;

    try {
      result = this.mailClient
        .post('send', { version: 'v3.1' })
        .request({
          Messages: [
            {
              From: {
                Email: EmailSender.defaultEmail,
                Name: EmailSender.defaultName,
              },
              TO: [
                {
                  Email: data.toEmail,
                  Name: data.name,
                },
              ],
              TemplateID: EmailTemplate.emailVerification,
              TemplateLanguage: true,
              Subject: 'Verifikasi E-mail',
              Variables: {
                name: data.name,
                code: data.code,
                action_url: data.actionUrl,
              },
            },
          ],
        })
        .then((result) => {
          console.log(result.body);
        })
        .catch((err) => {
          console.log(err.statusCode);
        });
    } catch (err) {
      throw new HttpException('api.error.mailjet', err.statusCode);
    }

    console.log(result);

    return result;
  }
}
