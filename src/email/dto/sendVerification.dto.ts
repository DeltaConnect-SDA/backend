import { IsEmail, IsNotEmpty } from 'class-validator';

export class SendEmailVerificationDTO {
  @IsNotEmpty()
  name: string;

  @IsEmail()
  @IsNotEmpty()
  toEmail: string;

  @IsNotEmpty()
  code: number;

  @IsNotEmpty()
  actionUrl: string;
}
