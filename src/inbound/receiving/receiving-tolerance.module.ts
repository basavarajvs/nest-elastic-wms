import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { ReceivingToleranceService } from './receiving-tolerance.service';

@Module({
  imports: [PrismaModule],
  providers: [ReceivingToleranceService],
  exports: [ReceivingToleranceService],
})
export class ReceivingToleranceModule {}
