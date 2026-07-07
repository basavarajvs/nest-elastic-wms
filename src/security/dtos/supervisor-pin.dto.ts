import { ApiProperty } from '@nestjs/swagger';

export class SupervisorPinDto {
  @ApiProperty() id: string;
  @ApiProperty() userId: string;
  @ApiProperty() is_active: boolean;
  @ApiProperty() expires_at: Date;
  @ApiProperty() created_at: Date;
}

export class PinVerificationResultDto {
  @ApiProperty() valid: boolean;
  @ApiProperty() reason?: string;
  @ApiProperty() userId?: string;
  @ApiProperty() verifiedAt?: string;
}

export class CreatePinDto {
  @ApiProperty() pin: string;
  @ApiProperty({ required: false }) expiryHours?: number;
}

export class VerifyPinDto {
  @ApiProperty() pin: string;
}
