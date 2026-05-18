import { Module, OnModuleInit, Logger } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { PrismaModule } from '../prisma/prisma.module';
import { StateMachineService } from './state-machine.service';
import { RuleEngineService } from './rule-engine.service';
import { BpmnService } from './bpmn.service';
import { WorkflowOrchestratorService } from './workflow-orchestrator.service';
import { BpmnStateSerializer } from './bpmn-state-serializer';
import { ContextTrimmerService } from './context-trimmer.service';
import { BpmnEscalationJob } from './bpmn-escalation.job';
import { BpmnRecoveryJob } from './bpmn-recovery.job';
import { StateMachineAuditInterceptor } from './state-machine-audit.interceptor';
import { EngineResourceGuard } from './engine-resource.guard';
import { WmsStateMachineController } from './web/state-machine.controller';
import { WmsRuleController } from './web/rule.controller';
import { WmsBpmnController } from './web/bpmn.controller';
import { ExecutionController } from './web/execution.controller';

@Module({
  imports: [
    BullModule.registerQueue(
      { name: 'bpmn-escalation' },
      { name: 'bpmn-recovery' },
    ),
  ],
  controllers: [
    WmsStateMachineController,
    WmsRuleController,
    WmsBpmnController,
    ExecutionController,
  ],
  providers: [
    StateMachineService,
    RuleEngineService,
    BpmnService,
    WorkflowOrchestratorService,
    BpmnStateSerializer,
    ContextTrimmerService,
    BpmnEscalationJob,
    BpmnRecoveryJob,
    StateMachineAuditInterceptor,
    EngineResourceGuard,
  ],
  exports: [
    StateMachineService,
    RuleEngineService,
    BpmnService,
    WorkflowOrchestratorService,
    BpmnStateSerializer,
    ContextTrimmerService,
  ],
})
export class CustomizationModule implements OnModuleInit {
  private readonly logger = new Logger(CustomizationModule.name);

  constructor(
    private readonly stateMachineService: StateMachineService,
  ) {}

  async onModuleInit() {
    try {
      await this.stateMachineService.warmActiveMachines([]);
    } catch (err: any) {
      this.logger.warn(`Machine cache pre-warm skipped (no tenant IDs available at init): ${err.message}`);
    }
  }
}
