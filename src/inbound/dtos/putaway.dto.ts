import { IsString, IsUUID, IsOptional, IsNumber, Min } from 'class-validator';

export class AssignTaskDto {
  @IsUUID()
  taskId: string;

  @IsUUID()
  userId: string;
}

export class ConfirmPutawayDto {
  @IsUUID()
  taskId: string;

  @IsUUID()
  scannedLocationId: string;

  @IsOptional()
  @IsString()
  scannedLocationCode?: string;

  @IsOptional()
  @IsString()
  supervisorPinOverride?: string;
}
