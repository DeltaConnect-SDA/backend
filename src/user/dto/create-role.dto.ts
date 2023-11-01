import { IsEnum, IsNotEmpty } from 'class-validator';
import { Role } from 'src/auth/enum/role.enum';

export class CreateRoleDTO {
  @IsNotEmpty()
  @IsEnum(Role)
  type: string;

  @IsNotEmpty()
  name: string;

  @IsNotEmpty()
  description: string;
}
