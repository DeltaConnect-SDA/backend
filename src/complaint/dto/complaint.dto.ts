import { IsNotEmpty, MaxLength, MinLength } from 'class-validator';

export class ComplaintDTO {
  @MaxLength(70, { message: 'Judul maksimal 70 karakter' })
  @MinLength(4, { message: 'Judul minimal 4 karakter' })
  @IsNotEmpty()
  title: string;

  @IsNotEmpty()
  categoryId: number;

  @IsNotEmpty()
  priorityId: number;

  @MaxLength(1200, { message: 'Deskripsi maksimal 1200 karakter' })
  @MinLength(70, { message: 'Deskripsi minimal 70 karakter' })
  @IsNotEmpty()
  description: string;

  @MaxLength(200, { message: 'Detail lokasi maksimal 200 karakter' })
  @MinLength(4, { message: 'Detail lokasi minimal 4 karakter' })
  @IsNotEmpty()
  detail_location: string;

  @IsNotEmpty()
  GPSaddress: string;

  @IsNotEmpty()
  lat: string;

  @IsNotEmpty()
  long: string;

  @IsNotEmpty()
  village: string;
}
