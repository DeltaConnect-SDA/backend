import { IsNotEmpty, MaxLength, MinLength } from 'class-validator';

export class VerificationRequestDTO {
  @IsNotEmpty({ message: 'NIK harus diisi!' })
  @MinLength(16, { message: 'Panjang NIK adalah 16 angka' })
  @MaxLength(16, { message: 'Panjang NIK adalah 16 angka' })
  idNumber: string;
}
