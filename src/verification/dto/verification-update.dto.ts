import { IsEnum, IsNotEmpty } from 'class-validator';
import { Status } from 'src/enum';

export class VerificationUpdateDTO {
  @IsNotEmpty({ message: 'Id harus diisi!' })
  id: string;

  @IsNotEmpty({ message: 'Status harus diisi!' })
  @IsEnum(Status)
  status: number;

  @IsNotEmpty({ message: 'Catatan harus diisi!' })
  content: string;
}
