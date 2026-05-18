import { IsString, IsUUID, IsOptional, IsArray, IsObject, IsNumber } from 'class-validator';

export class CreateWaveDto {
  @IsUUID()
  facilityId: string;

  @IsOptional()
  @IsObject()
  selectionCriteria?: Record<string, any>;
}
