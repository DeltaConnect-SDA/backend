import {
  IsEmail,
  IsMobilePhone,
  IsNotEmpty,
  MaxLength,
  MinLength,
} from 'class-validator';
import { IsUnique } from 'src/shared/validation/isUnique';

export class CreateOfficerDTO {
  @IsNotEmpty()
  firstName: string;

  @IsNotEmpty()
  LastName: string;

  @IsNotEmpty()
  roleId: string;

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
