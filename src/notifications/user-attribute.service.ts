import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

export interface UserAttribute {
  userId: string;
  key: string;
  value: string;
}

@Injectable()
export class UserAttributeService {
  private readonly logger = new Logger(UserAttributeService.name);
  private readonly http: AxiosInstance;

  constructor(private readonly configService: ConfigService) {
    this.http = axios.create({
      baseURL: this.configService.get<string>('CORE_API_URL'),
      timeout: 5000,
      headers: {
        'Content-Type': 'application/json',
        'X-System-Token': this.configService.get<string>('CORE_API_TOKEN') || '',
      },
    });
  }

  async getAttribute(
    userId: string,
    key: string,
    tenantId: string,
  ): Promise<string | null> {
    try {
      const res = await this.http.get<{ value: string }>(
        `/users/${userId}/attributes/${key}`,
        { params: { tenantId } },
      );
      return res.data.value;
    } catch {
      return null;
    }
  }

  async setAttribute(
    userId: string,
    key: string,
    value: string,
    tenantId: string,
  ): Promise<void> {
    try {
      await this.http.put(
        `/users/${userId}/attributes/${key}`,
        { value, tenantId },
      );
    } catch (err: any) {
      this.logger.warn(
        `Failed to set attribute ${key}=${value} for user ${userId}: ${err.message}`,
      );
    }
  }

  async resolveRecipientsByAttribute(
    roleCode: string,
    attributeKey: string,
    attributeValue: string,
    tenantId: string,
  ): Promise<string[]> {
    try {
      const res = await this.http.post<{ userIds: string[] }>(
        `/users/resolve-by-attribute`,
        { roleCode, attributeKey, attributeValue, tenantId },
      );
      return res.data.userIds;
    } catch (err: any) {
      this.logger.warn(
        `Failed to resolve recipients by ${attributeKey}=${attributeValue}: ${err.message}`,
      );
      return [];
    }
  }

  async getUsersByRoleWithAttribute(
    roleCode: string,
    tenantId: string,
    attributeKey?: string,
  ): Promise<Array<{ userId: string; attributes: Record<string, string> }>> {
    try {
      const res = await this.http.post<{
        users: Array<{ userId: string; attributes: Record<string, string> }>;
      }>(`/users/by-role`, { roleCode, tenantId, attributeKey });
      return res.data.users;
    } catch {
      return [];
    }
  }
}
