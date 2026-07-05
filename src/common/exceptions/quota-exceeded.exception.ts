import { HttpException, HttpStatus } from '@nestjs/common';

export class QuotaExceededException extends HttpException {
  constructor(
    resourceType: string,
    limit: number,
    current: number,
  ) {
    super(
      {
        message: `Quota exceeded for ${resourceType}: ${current}/${limit}`,
        resourceType,
        limit,
        current,
        retryAfter: '30d',
      },
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }
}
