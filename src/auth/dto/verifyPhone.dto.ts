import { Type } from 'class-transformer';
import { IsInt, IsPhoneNumber } from 'class-validator';

export class VerifyPhoneDTO {
  @IsPhoneNumber('ID')
  phone: string;

  @IsInt()
  @Type(() => Number)
  code: number;
}
