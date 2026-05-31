import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsUUID, IsNumber, IsOptional, IsBoolean, Min } from 'class-validator';

export class CreatePackagingDto {
  @ApiProperty({ type: String })
  @IsUUID()
  productId: string;

  @ApiProperty({ type: String })
  @IsUUID()
  fromUomId: string;

  @ApiProperty({ type: String })
  @IsUUID()
  toUomId: string;

  @ApiProperty({ type: Number })
  @IsNumber()
  @Min(0.001)
  conversionFactor: number;

  @IsOptional()
  @ApiPropertyOptional({ type: Boolean })
  @IsBoolean()
  isActive?: boolean;
}

export class UpdatePackagingDto {
  @IsOptional()
  @ApiPropertyOptional({ type: Number })
  @IsNumber()
  @Min(0.001)
  conversionFactor?: number;

  @IsOptional()
  @ApiPropertyOptional({ type: Boolean })
  @IsBoolean()
  isActive?: boolean;
}
