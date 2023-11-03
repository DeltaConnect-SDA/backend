import { IsNotEmpty, MaxLength, MinLength } from 'class-validator';

export class CreateSuggestionDTO {
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

  @MaxLength(200, { message: 'Lokasi maksimal 200 karakter' })
  @MinLength(4, { message: 'Lokasi minimal 4 karakter' })
  @IsNotEmpty()
  location: string;
}
