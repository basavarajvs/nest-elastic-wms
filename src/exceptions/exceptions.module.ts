import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ExceptionManagementService } from './exception-management.service';
import { ExceptionCommentService } from './exception-comment.service';
import { ExceptionEscalationService } from './exception-escalation.service';
import { ExceptionWebController, EscalationRuleWebController } from './web/exception.controller';
import { ExceptionRfController } from './rf/exception.controller';

@Module({
  imports: [PrismaModule],
  controllers: [ExceptionWebController, EscalationRuleWebController, ExceptionRfController],
  providers: [ExceptionManagementService, ExceptionCommentService, ExceptionEscalationService],
  exports: [ExceptionManagementService, ExceptionCommentService, ExceptionEscalationService],
})
export class ExceptionsModule {}
