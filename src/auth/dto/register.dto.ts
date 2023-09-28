import {
  IsEmail,
  IsMobilePhone,
  IsNotEmpty,
  MaxLength,
  MinLength,
} from 'class-validator';

export class RegisterDTO {
  @IsNotEmpty({ message: 'Nama harus diisi!' })
  @MinLength(3, { message: 'Nama depan minimal 3 karakter' })
  @MaxLength(10, { message: 'Nama depan maksimal 10 karakter' })
  firstName: string;

  @IsNotEmpty()
  lastName: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsMobilePhone('id-ID')
  @IsNotEmpty()
  phone: number;

  @IsNotEmpty()
  password: string;
}
