import { IsOptional, IsBoolean, IsUUID, IsObject } from 'class-validator';

export class UpdateLocationDto {
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsBoolean()
  isBlocked?: boolean;

  @IsOptional()
  @IsObject()
  attributes?: Record<string, any>;

  @IsOptional()
  @IsUUID()
  parentId?: string | null;
}
