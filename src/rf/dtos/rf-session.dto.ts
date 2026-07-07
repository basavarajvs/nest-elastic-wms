import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RfSessionDto {
  @ApiProperty() sessionId: string;
  @ApiProperty() userId: string;
  @ApiProperty() facilityId: string;
  @ApiProperty() deviceId?: string;
  @ApiProperty() workflowType?: string;
  @ApiProperty() startedAt: Date;
  @ApiProperty() lastActivityAt: Date;
  @ApiProperty() expiresAt: Date;
}

export class RfSessionLoginDto {
  @ApiProperty() facilityId: string;
  @ApiProperty({ required: false }) deviceId?: string;
  @ApiProperty({ required: false }) workflowType?: string;
}

export class HeartbeatResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() expires_at: Date;
}

export class LogoutResponseDto {
  @ApiProperty() success: boolean;
}
