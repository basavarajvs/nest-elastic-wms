import { SetMetadata } from '@nestjs/common';

export const QUOTA_CHECK_KEY = 'quota_check';

export interface QuotaCheckOptions {
  resourceType: string;
}

export const QuotaCheck = (options: QuotaCheckOptions) =>
  SetMetadata(QUOTA_CHECK_KEY, options);
