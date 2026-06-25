import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsUUID, IsOptional, IsInt, IsBoolean, MaxLength, Min } from 'class-validator';

export class CreateEscalationRuleDto {
  @ApiProperty({ type: String })
  @IsUUID()
  facilityId: string;

  @ApiProperty({ type: String })
  @IsString()
  @MaxLength(100)
  ruleName: string;

  @ApiProperty({ type: String })
  @IsString()
  @MaxLength(50)
  exceptionType: string;

  @ApiProperty({ type: String })
  @IsString()
  @MaxLength(20)
  severityMinimum: string;

  @ApiProperty({ type: Number })
  @IsInt()
  @Min(1)
  unresolvedHours: number;

  @ApiProperty({ type: String })
  @IsUUID()
  escalateToUserId: string;

  @ApiPropertyOptional({ type: Boolean, default: true })
  @IsOptional()
  @IsBoolean()
  notifyViaEmail?: boolean;

  @ApiPropertyOptional({ type: Boolean, default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class EscalationRuleResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  facilityId: string;

  @ApiProperty()
  ruleName: string;

  @ApiProperty()
  exceptionType: string;

  @ApiProperty()
  severityMinimum: string;

  @ApiProperty()
  unresolvedHours: number;

  @ApiProperty()
  escalateToUserId: string;

  @ApiProperty()
  notifyViaEmail: boolean;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
