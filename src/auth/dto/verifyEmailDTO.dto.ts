import {
  IsJWT,
  IsNotEmpty,
  IsNumber,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class VerifyEmailDTO {
  @IsString()
  @IsNotEmpty({ message: 'Token cannot be empty' })
  @IsJWT({ message: 'Token format invalid!' })
  token: string;

  code: number;
}
