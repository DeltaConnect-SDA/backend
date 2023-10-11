import { IsNotEmpty } from 'class-validator';

export class VerifyEmailDTO {
  token?: string;

  @IsNotEmpty({ message: 'Code cannot be empty!' })
  code: string;

  @IsNotEmpty({ message: 'Email cannot be empty!' })
  email: string;
}
