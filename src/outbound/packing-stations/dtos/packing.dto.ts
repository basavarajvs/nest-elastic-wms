import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsUUID, IsOptional, IsNumber, Min } from 'class-validator';

export class StartSessionDto {
  @ApiProperty()
  @IsUUID()
  facilityId: string;

  @ApiProperty()
  @IsString()
  stationCode: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  orderId?: string;
}

export class ScanItemDto {
  @ApiProperty()
  @IsString()
  productCode: string;

  @ApiProperty()
  @IsNumber()
  @Min(0.001)
  quantity: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  lpn?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  containerId?: string;
}

export class SealContainerDto {
  @ApiProperty()
  @IsUUID()
  containerId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  weight?: number;
}

export class CloseSessionDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
