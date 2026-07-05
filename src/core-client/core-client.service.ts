import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import { PlanLimits, WmsRoleDto } from './wms-role.dto';

@Injectable()
export class CoreClientService {
  private readonly logger = new Logger(CoreClientService.name);
  private readonly client: AxiosInstance;

  constructor(private readonly config: ConfigService) {
    const token = this.config.get<string>('CORE_API_TOKEN');
    this.client = axios.create({
      baseURL: this.config.get<string>('CORE_API_URL'),
      headers: {
        Authorization: `Bearer ${token}`,
        'X-System-Token': token,
      },
      timeout: 10000,
    });

    this.client.interceptors.response.use(
      (res) => res,
      (err) => {
        const status = err.response?.status;
        if (status === 401 || status === 403) {
          this.logger.error(`Core API auth error [${status}]: ${JSON.stringify(err.response?.data)}`);
        } else if (status && status >= 500) {
          this.logger.warn(`Core API server error [${status}]: ${JSON.stringify(err.response?.data)}`);
        }
        return Promise.reject(err);
      },
    );
  }

  async getPlanLimits(tenantId: string): Promise<PlanLimits> {
    return this.withRetry(() =>
      this.client.get<PlanLimits>(`/api/tenants/${tenantId}/limits`).then((r) => r.data),
    );
  }

  async healthCheck(): Promise<boolean> {
    try {
      const res = await this.client.get('/api/health');
      return res.status === 200;
    } catch {
      return false;
    }
  }

  async seedWmsRoles(tenantId: string, roles: WmsRoleDto[]): Promise<void> {
    await this.client.post(`/api/tenants/${tenantId}/roles`, roles);
  }

  async assignPermissions(roleId: string, permissions: string[]): Promise<void> {
    await this.client.post(`/api/roles/${roleId}/permissions`, { permissions });
  }

  async dispatchNotification(payload: { tenantId: string; type: string; title: string; body: string }): Promise<void> {
    await this.client.post('/api/notifications', payload);
  }

  private async withRetry<T>(fn: () => Promise<T>): Promise<T> {
    const delays = [1000, 2000];
    let lastErr: any;
    for (let i = 0; i <= delays.length; i++) {
      try {
        return await fn();
      } catch (err: any) {
        lastErr = err;
        const status = err.response?.status;
        if (status === 401 || status === 403) {
          throw new HttpException('Core API authentication failed', HttpStatus.BAD_GATEWAY);
        }
        if (i < delays.length) {
          await new Promise((r) => setTimeout(r, delays[i]));
        }
      }
    }
    throw lastErr;
  }
}
