import { ApiProperty } from '@nestjs/swagger';

export class HealthModulesDto {
  @ApiProperty()
  database: string;
  @ApiProperty()
  redis: string;
}

export class HealthCheckResponseDto {
  @ApiProperty()
  status: string;
  @ApiProperty({ type: HealthModulesDto })
  modules: HealthModulesDto;
  @ApiProperty()
  timestamp: string;
}
