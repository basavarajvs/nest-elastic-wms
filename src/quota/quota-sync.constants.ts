export const QUOTA_SYNC_QUEUE = 'quota-sync-retry';

export const QUOTA_RESOURCE_TYPES = ['users', 'storage_locations', 'products', 'monthly_transactions', 'facilities', 'storage_gb'] as const;

export type QuotaResourceType = (typeof QUOTA_RESOURCE_TYPES)[number];
