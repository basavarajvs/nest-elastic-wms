import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsUUID, IsOptional, IsNumber, Min } from 'class-validator';

export class AssignTaskDto {
  @ApiProperty({ type: String, required: true })
  @IsUUID()
  taskId: string;

  @ApiProperty({ type: String, required: true })
  @IsUUID()
  userId: string;
}

export class UpdatePutawayTaskStatusDto {
  @ApiProperty({ type: String, required: true })
  @IsString()
  status: string;
}

export class ConfirmPutawayDto {
  @ApiProperty({ type: String, required: true })
  @IsUUID()
  taskId: string;

  @ApiProperty({ type: String, required: true })
  @IsUUID()
  scannedLocationId: string;

  @IsOptional()
  @ApiProperty({ type: String, required: false })
  @IsString()
  scannedLocationCode?: string;

  @IsOptional()
  @ApiProperty({ type: String, required: false })
  @IsString()
  supervisorPinOverride?: string;
}
