import { IsPhoneNumber } from 'class-validator';

export class sendOTPMessageDTO {
  code: number;

  @IsPhoneNumber('ID')
  toPhone: string;
}
