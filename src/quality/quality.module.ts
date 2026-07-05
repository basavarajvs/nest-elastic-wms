import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { InspectionService } from './inspections/inspection.service';
import { QualityHoldService } from './holds/quality-hold.service';
import { NcrService } from './ncr/ncr.service';
import { ComplianceService } from './compliance/compliance.service';
import { ReceivingInspectionService } from './receiving-inspection/receiving-inspection.service';
import { InspectionProfileService } from './inspections/inspection-profile.service';
import { DefectCodeService } from './defects/defect-code.service';
import { InspectionWebController } from './web/inspection.controller';
import { HoldController } from './web/hold.controller';
import { NcrController } from './web/ncr.controller';
import { ComplianceRequirementController, ComplianceAuditController, HazmatController } from './web/compliance.controller';
import { ReceivingInspectionController, QcDispositionController } from './web/receiving-inspection.controller';
import { RfInspectionController } from './rf/inspection.controller';
import { InspectionProfileWebController } from './inspections/web/inspection-profile.controller';
import { DefectCodeWebController } from './defects/web/defect-code.controller';

@Module({
  imports: [PrismaModule],
  controllers: [
    InspectionWebController,
    HoldController,
    NcrController,
    ComplianceRequirementController,
    ComplianceAuditController,
    HazmatController,
    ReceivingInspectionController,
    QcDispositionController,
    RfInspectionController,
    InspectionProfileWebController,
    DefectCodeWebController,
  ],
  providers: [
    InspectionService,
    QualityHoldService,
    NcrService,
    ComplianceService,
    ReceivingInspectionService,
    InspectionProfileService,
    DefectCodeService,
  ],
  exports: [
    InspectionService,
    QualityHoldService,
    NcrService,
    ComplianceService,
    ReceivingInspectionService,
    InspectionProfileService,
    DefectCodeService,
  ],
})
export class QualityModule {}
