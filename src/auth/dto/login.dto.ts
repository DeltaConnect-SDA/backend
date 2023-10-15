import { IsEmail, IsNotEmpty, MaxLength, MinLength } from 'class-validator';

export class LoginDTO {
  @IsEmail({}, { message: 'Email harus berupa alamat email yang valid!' })
  @IsNotEmpty({ message: 'Email harus diisi.' })
  email: string;

  @IsNotEmpty({ message: 'Password harus diisi.' })
  @MinLength(8, { message: 'Password harus memiliki setidaknya 8 karakter.' })
  @MaxLength(32, { message: 'Password tidak boleh lebih dari 32 karakter.' })
  password: string;
}
