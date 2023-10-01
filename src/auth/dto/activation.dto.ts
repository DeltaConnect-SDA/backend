import { IsEmail, IsMobilePhone, IsNotEmpty, IsString } from 'class-validator';

export class ActivationDTO {
  @IsString()
  @IsEmail({}, { message: 'Email harus berupa alamat email yang valid!' })
  @IsNotEmpty({ message: 'Email harus diisi.' })
  email: string;

  @IsMobilePhone('id-ID', {}, { message: 'Nomor Hp tidak sesuai!' })
  @IsNotEmpty({ message: 'Nomor Hp harus diisi.' })
  phone: string;
}
