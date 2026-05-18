import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsUUID, IsOptional, IsNumber } from 'class-validator';

export class ApproveApprovalDto {
  @IsOptional()
  @ApiProperty({ type: String, required: false })
  @IsString()
  comments?: string;
}

export class RejectApprovalDto {
  @ApiProperty({ type: String, required: true })
  @IsString()
  reason: string;
}
