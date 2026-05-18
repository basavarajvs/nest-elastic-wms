import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsUUID, IsOptional, IsNumber } from 'class-validator';

export class StartPackingDto {
  @ApiProperty({ type: String, required: true })
  @IsUUID()
  userId: string;

  @IsOptional()
  @ApiProperty({ type: String, required: false })
  @IsString()
  stationCode?: string;
}

export class ScanLpnToContainerDto {
  @ApiProperty({ type: String, required: true })
  @IsUUID()
  sessionId: string;

  @ApiProperty({ type: String, required: true })
  @IsUUID()
  lpnId: string;

  @ApiProperty({ type: String, required: true })
  @IsString()
  containerCode: string;
}

export class SealContainerDto {
  @ApiProperty({ type: String, required: true })
  @IsUUID()
  containerId: string;

  @IsOptional()
  @ApiProperty({ type: Number, required: false })
  @IsNumber()
  weight?: number;
}
