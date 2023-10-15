import { IsUnique } from 'src/shared/validation/isUnique';
import {
  IsEmail,
  IsMobilePhone,
  IsNotEmpty,
  MaxLength,
  MinLength,
} from 'class-validator';

export class RegisterDTO {
  @MaxLength(20, { message: 'Nama depan maksimal 20 karakter' })
  @MinLength(3, { message: 'Nama depan minimal 3 karakter' })
  @IsNotEmpty({ message: 'Nama depan harus diisi!' })
  firstName: string;

  @MaxLength(50, { message: 'Nama belakang maksimal 50 karakter' })
  @MinLength(3, { message: 'Nama belakang minimal 3 karakter' })
  @IsNotEmpty({ message: 'Nama belakang harus diisi!' })
  lastName: string;

  @IsUnique(
    { entityName: 'User', propertyName: 'email' },
    { message: 'Email telah digunakan!' },
  )
  @IsEmail({}, { message: 'Email harus berupa alamat email yang valid!' })
  @IsNotEmpty({ message: 'Email harus diisi.' })
  email: string;

  @IsUnique(
    { entityName: 'User', propertyName: 'phone' },
    { message: 'Nomor HP telah digunakan!' },
  )
  @IsMobilePhone('id-ID', {}, { message: 'Nomor Hp tidak sesuai!' })
  @IsNotEmpty({ message: 'Nomor Hp harus diisi.' })
  phone: string;

  @IsNotEmpty({ message: 'Password harus diisi.' })
  @MinLength(8, { message: 'Password harus memiliki setidaknya 8 karakter.' })
  @MaxLength(32, { message: 'Password tidak boleh lebih dari 32 karakter.' })
  password: string;
}
