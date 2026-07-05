import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { InspectionService } from './inspections/inspection.service';
import { QualityHoldService } from './holds/quality-hold.service';
import { NcrService } from './ncr/ncr.service';
import { ComplianceService } from './compliance/compliance.service';
import { ReceivingInspectionService } from './receiving-inspection/receiving-inspection.service';
import { InspectionController } from './web/inspection.controller';
import { HoldController } from './web/hold.controller';
import { NcrController } from './web/ncr.controller';
import { ComplianceRequirementController, ComplianceAuditController, HazmatController } from './web/compliance.controller';
import { ReceivingInspectionController, QcDispositionController } from './web/receiving-inspection.controller';
import { RfInspectionController } from './rf/inspection.controller';

@Module({
  imports: [PrismaModule],
  controllers: [
    InspectionController,
    HoldController,
    NcrController,
    ComplianceRequirementController,
    ComplianceAuditController,
    HazmatController,
    ReceivingInspectionController,
    QcDispositionController,
    RfInspectionController,
  ],
  providers: [
    InspectionService,
    QualityHoldService,
    NcrService,
    ComplianceService,
    ReceivingInspectionService,
  ],
  exports: [
    InspectionService,
    QualityHoldService,
    NcrService,
    ComplianceService,
    ReceivingInspectionService,
  ],
})
export class QualityModule {}
