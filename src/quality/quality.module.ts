import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { InspectionService } from './inspections/inspection.service';
import { InspectionDefectService } from './inspection-defect.service';
import { TemperatureLogService } from './temperature-log.service';
import { QualityHoldService } from './holds/quality-hold.service';
import { NcrService } from './ncr/ncr.service';
import { ComplianceService } from './compliance/compliance.service';
import { ReceivingInspectionService } from './receiving-inspection/receiving-inspection.service';
import { InspectionProfileService } from './inspections/inspection-profile.service';
import { DefectCodeService } from './defects/defect-code.service';
import { InspectionWebController } from './web/inspection.controller';
import { InspectionDefectController } from './web/inspection-defect.controller';
import { TemperatureLogController } from './web/temperature-log.controller';
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
    InspectionDefectController,
    TemperatureLogController,
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
    InspectionDefectService,
    TemperatureLogService,
    QualityHoldService,
    NcrService,
    ComplianceService,
    ReceivingInspectionService,
    InspectionProfileService,
    DefectCodeService,
  ],
  exports: [
    InspectionService,
    InspectionDefectService,
    TemperatureLogService,
    QualityHoldService,
    NcrService,
    ComplianceService,
    ReceivingInspectionService,
    InspectionProfileService,
    DefectCodeService,
  ],
})
export class QualityModule {}
