import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import axios, { AxiosInstance } from 'axios';
import { IntegrationConfigDto } from './dtos/integration.dto';

export enum CircuitState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  HALF_OPEN = 'HALF_OPEN',
}

interface CircuitBreakerState {
  state: CircuitState;
  failureCount: number;
  lastFailureAt: number;
  openedAt: number;
}

@Injectable()
export class CoreIntegrationClientService {
  private readonly logger = new Logger(CoreIntegrationClientService.name);
  private readonly http: AxiosInstance;
  private readonly circuitBreakers = new Map<string, CircuitBreakerState>();

  private readonly FAILURE_THRESHOLD = 5;
  private readonly OPEN_TIMEOUT_MS = 15 * 60 * 1000;

  constructor(
    private readonly configService: ConfigService,
    private readonly eventEmitter: EventEmitter2,
  ) {
    const baseUrl = this.configService.get<string>('CORE_API_URL')!;
    const token = this.configService.get<string>('CORE_API_TOKEN')!;
    this.http = axios.create({
      baseURL: baseUrl,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        'X-System-Token': token,
      },
    });
  }

  async fetchIntegrationConfigs(tenantId: string): Promise<IntegrationConfigDto[]> {
    const circuitKey = `core-integrations-${tenantId}`;
    this.assertCircuit(circuitKey);

    try {
      const { data } = await this.http.get<IntegrationConfigDto[]>('/integrations', {
        params: { tenantId, status: 'active' },
      });
      this.onSuccess(circuitKey);
      return data;
    } catch (err: any) {
      return this.handleFailure(circuitKey, err);
    }
  }

  async decryptCredentials(encryptedPayload: string): Promise<Record<string, string>> {
    const circuitKey = 'core-decrypt';
    this.assertCircuit(circuitKey);

    try {
      const { data } = await this.http.post<{ decrypted: Record<string, string> }>(
        '/integrations/decrypt',
        { payload: encryptedPayload },
      );
      this.onSuccess(circuitKey);
      return data.decrypted;
    } catch (err: any) {
      return this.handleFailure(circuitKey, err);
    }
  }

  async reportUsageMetrics(tenantId: string, metrics: Record<string, number>): Promise<void> {
    try {
      await this.http.post('/usage/metrics', { tenantId, metrics });
    } catch (err: any) {
      this.logger.warn(`Failed to report usage metrics: ${err.message}`);
    }
  }

  getCircuitState(tenantId: string): CircuitState {
    return this.circuitBreakers.get(`core-integrations-${tenantId}`)?.state || CircuitState.CLOSED;
  }

  getAllCircuitStates(): Record<string, CircuitState> {
    const states: Record<string, CircuitState> = {};
    for (const [key, cb] of this.circuitBreakers.entries()) {
      states[key] = cb.state;
    }
    return states;
  }

  private assertCircuit(key: string): void {
    const cb = this.circuitBreakers.get(key);
    if (!cb) return;
    if (cb.state === CircuitState.OPEN) {
      if (Date.now() - cb.openedAt >= this.OPEN_TIMEOUT_MS) {
        cb.state = CircuitState.HALF_OPEN;
        this.logger.log(`Circuit ${key} → HALF_OPEN, allowing probe`);
        this.eventEmitter.emit('integration.adapter.circuit-half-open', { key });
      } else {
        throw new Error(`Circuit breaker OPEN for ${key}. Retry after ${this.OPEN_TIMEOUT_MS - (Date.now() - cb.openedAt)}ms`);
      }
    }
  }

  private onSuccess(key: string): void {
    const cb = this.circuitBreakers.get(key);
    if (cb) {
      if (cb.state === CircuitState.HALF_OPEN) {
        this.logger.log(`Circuit ${key} → CLOSED (probe succeeded)`);
        this.eventEmitter.emit('integration.adapter.circuit-closed', { key });
      }
      cb.state = CircuitState.CLOSED;
      cb.failureCount = 0;
    }
  }

  private async handleFailure(key: string, err: any): Promise<never> {
    let cb = this.circuitBreakers.get(key);
    if (!cb) {
      cb = { state: CircuitState.CLOSED, failureCount: 0, lastFailureAt: 0, openedAt: 0 };
      this.circuitBreakers.set(key, cb);
    }
    cb.failureCount++;
    cb.lastFailureAt = Date.now();

    if (cb.failureCount >= this.FAILURE_THRESHOLD) {
      cb.state = CircuitState.OPEN;
      cb.openedAt = Date.now();
      this.logger.error(`Circuit ${key} → OPEN after ${cb.failureCount} failures`);
      this.eventEmitter.emit('integration.adapter.circuit-open', { key, failureCount: cb.failureCount });
    }

    throw err;
  }
}
