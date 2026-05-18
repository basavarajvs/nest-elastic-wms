import { IsString, IsUUID, IsOptional, IsNumber } from 'class-validator';

export class StartPackingDto {
  @IsUUID()
  userId: string;

  @IsOptional()
  @IsString()
  stationCode?: string;
}

export class ScanLpnToContainerDto {
  @IsUUID()
  sessionId: string;

  @IsUUID()
  lpnId: string;

  @IsString()
  containerCode: string;
}

export class SealContainerDto {
  @IsUUID()
  containerId: string;

  @IsOptional()
  @IsNumber()
  weight?: number;
}
