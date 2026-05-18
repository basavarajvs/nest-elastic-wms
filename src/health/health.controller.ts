import { ApiExcludeController } from '@nestjs/swagger';
import { Controller, Get, Res, Req, Logger } from '@nestjs/common';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { HealthService } from './health.service';
import { ShutdownService } from '../lifecycle/shutdown.service';
import { CoreIntegrationClientService } from '../integrations/core-integration-client.service';
import { HealthProbeService } from '../cluster/health-probe.service';

@ApiExcludeController()
@Controller()
export class HealthController {
  private readonly logger = new Logger(HealthController.name);

  constructor(
    private readonly healthService: HealthService,
    private readonly shutdownService: ShutdownService,
    private readonly coreIntegration: CoreIntegrationClientService,
    private readonly healthProbe: HealthProbeService,
  ) {}

  @Get('/health')
  async check(@Res() res: FastifyReply) {
    const alive = await this.healthProbe.checkLiveness();
    if (!alive) {
      return res.status(503).send({ status: 'down' });
    }
    const result = await this.healthService.checkHealth();
    return res.status(result.status === 'ok' ? 200 : 503).send(result);
  }

  @Get('/health/ready')
  async ready(@Res() res: FastifyReply) {
    if (this.shutdownService.isShutdown()) {
      return res.status(503).headers({ 'Retry-After': '10' }).send({
        status: 'shutting_down',
        retryAfter: 10,
      });
    }

    const { ready, details } = await this.healthProbe.checkReadiness();
    if (ready) {
      return res.status(200).send({ status: 'ready', details });
    }
    return res.status(503).send({ status: 'not_ready', details });
  }

  @Get('/health/circuits')
  async circuits(@Res() res: FastifyReply) {
    const states = this.coreIntegration.getAllCircuitStates();
    const result: Record<string, string> = {};

    for (const [key, state] of Object.entries(states)) {
      const label = key.replace('core-integrations-', '').replace(/-/g, '_');
      result[label] = state;
    }

    if (Object.keys(result).length === 0) {
      result.shopify = 'CLOSED';
      result.woocommerce = 'CLOSED';
      result.core_api = 'CLOSED';
    }

    return res.status(200).send(result);
  }
}
