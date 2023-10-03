import { IsEmail, IsNotEmpty } from 'class-validator';

export class VerficationTokenPayload {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsNotEmpty()
  code: number;
}
