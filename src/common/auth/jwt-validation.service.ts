import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class JwtValidationService {
  private readonly logger = new Logger(JwtValidationService.name);

  async validateToken(token: string): Promise<{ valid: boolean; useOld: boolean }> {
    const parts = token.split('.');
    if (parts.length !== 3) return { valid: false, useOld: false };

    try {
      const payload = this.decodePayload(parts[1]);
      if (!payload || !payload.iat || !payload.jti) {
        return { valid: false, useOld: false };
      }
      return { valid: true, useOld: false };
    } catch {
      return { valid: false, useOld: false };
    }
  }

  private decodePayload(base64: string): Record<string, any> | null {
    try {
      const padded = base64.padEnd(
        base64.length + (4 - (base64.length % 4)) % 4,
        '=',
      );
      const decoded = Buffer.from(padded, 'base64').toString('utf8');
      return JSON.parse(decoded);
    } catch {
      return null;
    }
  }
}
