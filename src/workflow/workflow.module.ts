import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { PrismaModule } from '../prisma/prisma.module';
import { StateMachineService } from './state-machine/state-machine.service';
import { RuleEngineService } from './rule-engine/rule-engine.service';
import { BpmnService } from './bpmn/bpmn.service';
import { WorkflowOrchestratorService } from './orchestrator/workflow-orchestrator.service';
import { StateMachineController } from './state-machine/web/state-machine.controller';
import { RuleController } from './rule-engine/web/rule.controller';
import { BpmnController } from './bpmn/web/bpmn.controller';
import { ExecutionController } from './orchestrator/web/execution.controller';
import { WorkflowRecoveryProcessor } from './orchestrator/workflow-recovery.processor';

@Module({
  imports: [
    PrismaModule,
    BullModule.registerQueue({ name: 'workflow-recovery' }),
  ],
  controllers: [
    StateMachineController,
    RuleController,
    BpmnController,
    ExecutionController,
  ],
  providers: [
    StateMachineService,
    RuleEngineService,
    BpmnService,
    WorkflowOrchestratorService,
    WorkflowRecoveryProcessor,
  ],
  exports: [
    StateMachineService,
    RuleEngineService,
    BpmnService,
    WorkflowOrchestratorService,
  ],
})
export class WorkflowModule {}
