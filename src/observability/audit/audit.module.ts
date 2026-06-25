import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuditService } from './audit.service';
import { WarehouseEventService } from './warehouse-event.service';
import { AuditController } from './web/audit.controller';

@Module({
  imports: [PrismaModule],
  providers: [AuditService, WarehouseEventService],
  controllers: [AuditController],
  exports: [AuditService, WarehouseEventService],
})
export class AuditModule {}
