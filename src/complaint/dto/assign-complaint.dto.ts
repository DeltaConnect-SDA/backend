import { IsNotEmpty, MaxLength, MinLength } from 'class-validator';

export class AssignComplaintDTO {
  @IsNotEmpty({ message: 'Id laporan harus diisi!' })
  id: number;

  @IsNotEmpty({ message: 'Id laporan harus diisi!' })
  roleId: string;

  @MaxLength(120, { message: 'Catatan maksimal 120 karakter!' })
  @MinLength(4, { message: 'Catatan minimal 4 karakter!' })
  notes?: string;
}
