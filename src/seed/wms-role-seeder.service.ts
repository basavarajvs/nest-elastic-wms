import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CoreClientService, PlanLimits } from '../core-client/core-client.service';
import { WmsRoleDto } from '../core-client/wms-role.dto';
import {
  WMS_ROLE_DEFINITIONS,
  WmsRoleDefinition,
} from '../casl/permission-registry';

@Injectable()
export class WmsRoleSeederService implements OnModuleInit {
  private readonly logger = new Logger(WmsRoleSeederService.name);

  constructor(
    private readonly coreClient: CoreClientService,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit() {
    if (this.configService.get('NODE_ENV') === 'test') return;

    this.logger.log('WMS role seeder initialized — seeding on tenant provision');
  }

  async seedRolesForTenant(tenantId: string): Promise<void> {
    const roleDtos: WmsRoleDto[] = WMS_ROLE_DEFINITIONS.map(
      (def: WmsRoleDefinition) => ({
        roleCode: def.roleCode,
        roleName: this.mapRoleName(def.roleCode),
        roleDescription: this.mapRoleDescription(def.roleCode),
        permissions: def.permissions.map(
          (p) => `${p.subject.toUpperCase()}:${p.action.toUpperCase()}`,
        ),
      }),
    );

    try {
      await this.coreClient.seedWmsRoles(tenantId, roleDtos);
      this.logger.log(
        `WMS roles seeded for tenant ${tenantId}: ${roleDtos.map((r) => r.roleCode).join(', ')}`,
      );
    } catch (err: any) {
      // Idempotent — roles may already exist; log and continue
      this.logger.warn(
        `Role seeding for tenant ${tenantId} (may already exist): ${err.message}`,
      );
    }
  }

  private mapRoleName(code: string): string {
    const names: Record<string, string> = {
      WAREHOUSE_ADMIN: 'Warehouse Admin',
      WAREHOUSE_SUPERVISOR: 'Warehouse Supervisor',
      WAREHOUSE_OPERATOR: 'Warehouse Operator',
      INVENTORY_CLERK: 'Inventory Clerk',
    };
    return names[code] || code;
  }

  private mapRoleDescription(code: string): string {
    const descriptions: Record<string, string> = {
      WAREHOUSE_ADMIN: 'Full facility/location/inventory/order management',
      WAREHOUSE_SUPERVISOR:
        'Approves adjustments, oversees tasks, read-only config',
      WAREHOUSE_OPERATOR:
        'RF floor user. Receive ASN/GRN, pick, pack, ship, move inventory',
      INVENTORY_CLERK:
        'Cycle counts, QC, adjustments, location maintenance',
    };
    return descriptions[code] || '';
  }
}
