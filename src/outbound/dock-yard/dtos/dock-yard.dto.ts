import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsDateString, IsNotEmpty } from 'class-validator';

export class CreateAppointmentDto {
  @ApiProperty() @IsString() facilityId: string;
  @ApiProperty() @IsString() dockId: string;
  @ApiProperty() @IsString() appointmentNumber: string;
  @ApiProperty({ enum: ['RECEIVING', 'SHIPPING', 'BOTH'] }) @IsString() appointmentType: string;
  @ApiPropertyOptional() @IsOptional() @IsString() carrierName?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() carrierCode?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() driverName?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() driverPhone?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() vehiclePlate?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() trailerId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() referenceType?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() referenceNumber?: string;
  @ApiProperty() @IsDateString() scheduledStart: string;
  @ApiProperty() @IsDateString() scheduledEnd: string;
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
}

export class RegisterVehicleDto {
  @ApiProperty() @IsString() facilityId: string;
  @ApiProperty({ enum: ['TRUCK', 'TRAILER', 'CONTAINER'] }) @IsString() vehicleType: string;
  @ApiProperty() @IsString() vehiclePlate: string;
  @ApiPropertyOptional() @IsOptional() @IsString() carrierCode?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() driverName?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() driverPhone?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() sealNumber?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() yardLocation?: string;
}

export class AssignDockDto {
  @ApiProperty() @IsString() dockId: string;
}

export class ListAppointmentsDto {
  @ApiProperty() @IsString() facilityId: string;
  @ApiPropertyOptional() @IsOptional() @IsString() dockId?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() date?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() status?: string;
}
