import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { StagingService } from './staging.service';

@Module({
  imports: [PrismaModule],
  providers: [StagingService],
  exports: [StagingService],
})
export class StagingModule {}
