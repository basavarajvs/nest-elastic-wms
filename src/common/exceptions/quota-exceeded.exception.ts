import { HttpException, HttpStatus } from '@nestjs/common';

export class QuotaExceededException extends HttpException {
  constructor(resource: string, limit: number, current: number) {
    super(
      {
        statusCode: HttpStatus.FORBIDDEN,
        error: 'QUOTA_EXCEEDED',
        message: `Plan limit reached for ${resource}`,
        details: { resource, limit, current, upgradeUrl: '/billing/upgrade' },
      },
      HttpStatus.FORBIDDEN,
    );
  }
}
