import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsInt, IsEnum, Min } from 'class-validator';

export class CreateEquipmentDto {
  @ApiProperty() @IsString() facilityId: string;
  @ApiProperty() @IsString() equipmentCode: string;
  @ApiProperty() @IsString() equipmentName: string;
  @ApiProperty({ enum: ['FORKLIFT', 'PALLET_JACK', 'HAND_TRUCK', 'CONVEYOR', 'SCANNER', 'PRINTER'] })
  @IsString() equipmentType: string;
  @ApiPropertyOptional() @IsOptional() @IsString() manufacturer?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() model?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() serialNumber?: string;
  @ApiPropertyOptional() @IsOptional() @IsInt() year?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() locationId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
}

export class UpdateEquipmentDto {
  @ApiPropertyOptional() @IsOptional() @IsString() equipmentName?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() manufacturer?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() model?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() serialNumber?: string;
  @ApiPropertyOptional() @IsOptional() @IsInt() year?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() locationId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
}

export class ChangeEquipmentStatusDto {
  @ApiProperty({ enum: ['AVAILABLE', 'IN_USE', 'MAINTENANCE', 'OUT_OF_SERVICE', 'DECOMMISSIONED'] })
  @IsString() status: string;
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
}

export class CreateMaintenanceDto {
  @ApiProperty() @IsString() equipmentId: string;
  @ApiProperty({ enum: ['PREVENTIVE', 'REPAIR', 'INSPECTION'] }) @IsString() maintenanceType: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional({ enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] }) @IsOptional() @IsString() priority?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() performedByUserId?: string;
  @ApiPropertyOptional() @IsOptional() cost?: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0) downtimeMinutes?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
}

export class CompleteMaintenanceDto {
  @ApiPropertyOptional() @IsOptional() cost?: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0) downtimeMinutes?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() performedByUserId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
}

export class ListEquipmentDto {
  @ApiProperty() @IsString() facilityId: string;
  @ApiPropertyOptional() @IsOptional() @IsString() equipmentType?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() status?: string;
}

export class ListMaintenanceDto {
  @ApiProperty() @IsString() facilityId: string;
  @ApiPropertyOptional() @IsOptional() @IsString() equipmentId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() status?: string;
}
