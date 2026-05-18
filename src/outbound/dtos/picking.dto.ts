import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsUUID, IsOptional, IsNumber, Min } from 'class-validator';

export class ConfirmPickDto {
  @ApiProperty({ type: String, required: true })
  @IsUUID()
  taskId: string;

  @IsNumber()
  @Min(0)
  actualQuantity: number;

  @IsOptional()
  @ApiProperty({ type: String, required: false })
  @IsString()
  lotNumber?: string;

  @IsOptional()
  @ApiProperty({ type: String, required: false })
  @IsString()
  exceptionNotes?: string;
}

export class PickRecoverDto {
  @ApiProperty({ type: String, required: true })
  @IsUUID()
  taskId: string;

  @ApiProperty({ type: String, required: true })
  @IsUUID()
  userId: string;
}
