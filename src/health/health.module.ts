import { Module } from '@nestjs/common';
import { HealthController } from './web/health.controller';

@Module({
  controllers: [HealthController],
})
export class HealthModule {}
