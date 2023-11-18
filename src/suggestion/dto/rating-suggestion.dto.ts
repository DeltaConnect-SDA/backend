import { IsNotEmpty, Max, MaxLength, Min } from 'class-validator';

export class SuggestionRatingDTO {
  @IsNotEmpty({ message: 'Penilaian harus diisi!' })
  @Max(5, { message: 'Penilaian maksimal 5 bintang!' })
  @Min(1, { message: 'Penilaian minimal 1 bintang' })
  rate: number;

  @IsNotEmpty({ message: 'Penilaian harus diisi!' })
  @MaxLength(300, { message: 'Penilaian maksimal 300 karakter!' })
  rateText: string;
}
