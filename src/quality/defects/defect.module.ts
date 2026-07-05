import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { DefectCodeService } from './defect-code.service';

@Module({
  imports: [PrismaModule],
  providers: [DefectCodeService],
  exports: [DefectCodeService],
})
export class DefectModule {}
