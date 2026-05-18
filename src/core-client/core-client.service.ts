import {
  Injectable,
  Logger,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import { WmsRoleDto } from './wms-role.dto';

export interface PlanLimits {
  tenantId: string;
  limits: Array<{
    resourceType: string;
    limitAmount: number;
    currentUsage: number;
  }>;
}

@Injectable()
export class CoreClientService {
  private readonly logger = new Logger(CoreClientService.name);
  private readonly http: AxiosInstance;
  private readonly baseUrl: string;
  private readonly token: string;

  constructor(private readonly configService: ConfigService) {
    this.baseUrl = this.configService.get<string>('CORE_API_URL')!;
    this.token = this.configService.get<string>('CORE_API_TOKEN')!;

    this.http = axios.create({
      baseURL: this.baseUrl,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`,
        'X-System-Token': this.token,
      },
    });

    this.http.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response) {
          const { status } = error.response;
          if (status === 401 || status === 403) {
            this.logger.error(
              `Core API auth failed: ${status} ${error.response.data?.message || ''}`,
            );
            return Promise.reject(error);
          }
          if (status >= 500) {
            this.logger.warn(`Core API 5xx (attempt will retry): ${status}`);
          }
        }
        return Promise.reject(error);
      },
    );
  }

  async getPlanLimits(tenantId: string): Promise<PlanLimits> {
    return this.retry(() =>
      this.http
        .get<PlanLimits>(`/billing/subscriptions/plan-limits`, {
          params: { tenantId },
        })
        .then((r) => r.data),
    );
  }

  async seedWmsRoles(tenantId: string, roles: WmsRoleDto[]): Promise<void> {
    await this.retry(() =>
      this.http.post('/roles', { tenantId, roles }).then((r) => r.data),
    );
  }

  async assignPermissions(
    roleId: string,
    permissions: string[],
  ): Promise<void> {
    await this.retry(() =>
      this.http
        .post(`/roles/${roleId}/permissions`, { permissions })
        .then((r) => r.data),
    );
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.http.get('/health', { timeout: 3000 });
      return true;
    } catch {
      return false;
    }
  }

  private async retry<T>(
    fn: () => Promise<T>,
    attempts = 3,
    delay = 1000,
  ): Promise<T> {
    for (let i = 0; i < attempts; i++) {
      try {
        return await fn();
      } catch (err: any) {
        const status = err?.response?.status;
        if (status === 401 || status === 403) {
          throw new HttpException(
            'Core API authentication failed',
            HttpStatus.BAD_GATEWAY,
          );
        }
        if (i === attempts - 1) throw err;
        this.logger.warn(
          `Core API retry ${i + 1}/${attempts} after error: ${err.message}`,
        );
        await new Promise((r) => setTimeout(r, delay * (i + 1)));
      }
    }
    throw new Error('Unreachable');
  }
}
