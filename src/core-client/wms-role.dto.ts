export class WmsRoleDto {
  roleName: string;
  description?: string;
  permissions: string[];
  isSystemRole?: boolean;
}

export interface PlanLimits {
  maxUsers: number;
  maxStorageLocations: number;
  maxProducts: number;
  maxMonthlyTransactions: number;
  maxFacilities: number;
  storageGb: number;
}
