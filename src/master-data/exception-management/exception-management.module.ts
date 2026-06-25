import { Module } from '@nestjs/common';
import { ExceptionManagementService } from './exception-management.service';
import { ExceptionCommentService } from './exception-comment.service';
import { ExceptionEscalationService } from './exception-escalation.service';
import { ExceptionManagementWebController } from './web/exception-management.controller';
import { EscalationRuleController } from './web/escalation-rule.controller';
import { ExceptionManagementRfController } from './rf/exception-management.controller';

@Module({
  controllers: [
    ExceptionManagementWebController,
    EscalationRuleController,
    ExceptionManagementRfController,
  ],
  providers: [
    ExceptionManagementService,
    ExceptionCommentService,
    ExceptionEscalationService,
  ],
  exports: [
    ExceptionManagementService,
    ExceptionCommentService,
    ExceptionEscalationService,
  ],
})
export class ExceptionManagementModule {}
