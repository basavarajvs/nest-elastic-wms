import { SetMetadata } from '@nestjs/common';

export const QUOTA_CHECK_KEY = 'quota_resource';

export const QuotaCheck = (resourceType: string) =>
  SetMetadata(QUOTA_CHECK_KEY, resourceType);
