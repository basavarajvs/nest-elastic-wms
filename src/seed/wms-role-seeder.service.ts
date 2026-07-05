import { Injectable, Logger } from '@nestjs/common';
import { WMS_ROLE_DEFINITIONS, WmsRoleDefinition } from '../casl/permission-registry';

export interface WmsRoleDto {
  roleCode: string;
  permissions: { action: string; subject: string }[];
}

export interface CoreClientService {
  seedWmsRoles(tenantId: string, roles: WmsRoleDto[]): Promise<void>;
  assignPermissions(roleId: string, permissions: string[]): Promise<void>;
}

@Injectable()
export class WmsRoleSeederService {
  private readonly logger = new Logger(WmsRoleSeederService.name);

  getRoleDefinitions(): WmsRoleDefinition[] {
    return WMS_ROLE_DEFINITIONS;
  }

  async seedRoles(tenantId: string): Promise<void> {
    const roleDtos = this.buildRoleDtos();
    this.logger.log(`Seeding ${roleDtos.length} WMS roles for tenant ${tenantId}`);
  }

  private buildRoleDtos(): WmsRoleDto[] {
    return WMS_ROLE_DEFINITIONS.map((def) => ({
      roleCode: def.roleCode,
      permissions: def.permissions.map((p) => ({
        action: p.action,
        subject: p.subject,
      })),
    }));
  }
}
