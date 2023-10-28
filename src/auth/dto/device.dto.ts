import { IsNotEmpty } from 'class-validator';

export class DeviceDTO {
  @IsNotEmpty()
  userId: string;
  @IsNotEmpty()
  DeviceToken: string;
  @IsNotEmpty()
  DeviceType: string;
}
