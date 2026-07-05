import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';

@Processor('workflow-recovery')
export class WorkflowRecoveryProcessor extends WorkerHost {
  private readonly logger = new Logger(WorkflowRecoveryProcessor.name);

  async process(job: Job<any>): Promise<void> {
    const { instanceId, tenantId, machineKey, processKey, type } = job.data;

    this.logger.log(
      `Recovering instance ${instanceId} (type: ${type || 'state-machine'})`,
    );

    try {
      switch (type) {
        case 'bpmn':
          await this.recoverBpmnInstance(instanceId, tenantId, processKey);
          break;
        default:
          await this.recoverStateMachineInstance(
            instanceId,
            tenantId,
            machineKey,
          );
      }

      this.logger.log(`Successfully recovered instance ${instanceId}`);
    } catch (err) {
      this.logger.error(
        `Failed to recover instance ${instanceId}: ${(err as Error).message}`,
      );
      throw err;
    }
  }

  private async recoverBpmnInstance(
    instanceId: string,
    tenantId: string,
    processKey: string,
  ): Promise<void> {
    this.logger.debug(
      `BPMN recovery logic for ${instanceId} (process: ${processKey})`,
    );
  }

  private async recoverStateMachineInstance(
    instanceId: string,
    tenantId: string,
    machineKey: string,
  ): Promise<void> {
    this.logger.debug(
      `State machine recovery logic for ${instanceId} (machine: ${machineKey})`,
    );
  }
}
