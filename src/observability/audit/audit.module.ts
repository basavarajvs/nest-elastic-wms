import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuditLogService } from './audit-log.service';
import { AuditInterceptor } from './audit.interceptor';
import { AuditController } from './web/audit.controller';

@Module({
  imports: [PrismaModule],
  controllers: [AuditController],
  providers: [
    AuditLogService,
    AuditInterceptor,
  ],
  exports: [
    AuditLogService,
    AuditInterceptor,
  ],
})
export class AuditModule {}
