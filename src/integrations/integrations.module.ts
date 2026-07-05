import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { WebhookService } from './webhooks/webhook.service';
import { EntityMappingService } from './entity-mapping/entity-mapping.service';
import { SyncLogService } from './sync-logs/sync-log.service';
import { IntegrationWebController } from './web/integration.controller';

@Module({
  imports: [PrismaModule],
  controllers: [IntegrationWebController],
  providers: [WebhookService, EntityMappingService, SyncLogService],
  exports: [WebhookService, EntityMappingService, SyncLogService],
})
export class IntegrationsModule {}
