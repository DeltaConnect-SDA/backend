import {
  IsEmail,
  IsMobilePhone,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class RegisterDTO {
  @IsString()
  @IsNotEmpty({ message: 'Nama harus diisi!' })
  @MinLength(3, { message: 'Nama depan minimal 3 karakter' })
  @MaxLength(20, { message: 'Nama depan maksimal 10 karakter' })
  firstName: string;

  @IsString()
  @IsNotEmpty({ message: 'Nama belakang harus diisi!' })
  @MinLength(3, { message: 'Nama belakang minimal 3 karakter' })
  @MaxLength(10, { message: 'Nama belakang maksimal 10 karakter' })
  lastName: string;

  @IsString()
  @IsEmail({}, { message: 'Email harus berupa alamat email yang valid!' })
  @IsNotEmpty({ message: 'Email harus diisi.' })
  email: string;

  @IsMobilePhone('id-ID', {}, { message: 'Nomor Hp tidak sesuai!' })
  @IsNotEmpty({ message: 'Nomor Hp harus diisi.' })
  phone: string;

  @IsString()
  @IsNotEmpty({ message: 'Password harus diisi.' })
  @MinLength(8, { message: 'Password harus memiliki setidaknya 8 karakter.' })
  @MaxLength(32, { message: 'Password tidak boleh lebih dari 32 karakter.' })
  password: string;
}
