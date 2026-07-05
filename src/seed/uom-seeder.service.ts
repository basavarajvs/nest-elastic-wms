import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface UomDefinition {
  uomCode: string;
  uomName: string;
  description: string;
}

const STANDARD_UOMS: UomDefinition[] = [
  { uomCode: 'EA', uomName: 'Each', description: 'Individual unit' },
  { uomCode: 'CS', uomName: 'Case', description: 'Standard case/box' },
  { uomCode: 'PL', uomName: 'Pallet', description: 'Full pallet' },
  { uomCode: 'KG', uomName: 'Kilogram', description: 'Metric weight unit' },
  { uomCode: 'LB', uomName: 'Pound', description: 'Imperial weight unit' },
  { uomCode: 'L', uomName: 'Liter', description: 'Metric volume unit' },
  { uomCode: 'GAL', uomName: 'Gallon', description: 'US gallon' },
  { uomCode: 'M', uomName: 'Meter', description: 'Metric length unit' },
  { uomCode: 'CM', uomName: 'Centimeter', description: 'Metric small length unit' },
  { uomCode: 'BX', uomName: 'Box', description: 'Box container' },
  { uomCode: 'PK', uomName: 'Pack', description: 'Pack of items' },
  { uomCode: 'RL', uomName: 'Roll', description: 'Roll of material' },
];

@Injectable()
export class UomSeederService {
  private readonly logger = new Logger(UomSeederService.name);

  constructor(private readonly prisma: PrismaService) {}

  async seedUoms(tenantId: string): Promise<void> {
    this.logger.log(`Seeding standard UOMs for tenant ${tenantId}`);

    for (const uom of STANDARD_UOMS) {
      try {
        const existing = await this.prisma.$queryRawUnsafe<{ cnt: bigint }[]>(
          `SELECT COUNT(*) as cnt FROM multitenant.units_of_measure WHERE tenant_id = $1::uuid AND uom_code = $2`,
          tenantId,
          uom.uomCode,
        );

        if (existing[0].cnt > 0n) {
          this.logger.debug(`UOM ${uom.uomCode} already exists for tenant ${tenantId}, skipping`);
          continue;
        }

        await this.prisma.$executeRawUnsafe(
          `INSERT INTO multitenant.units_of_measure (tenant_id, uom_code, uom_name, description, is_active, created_at, updated_at)
           VALUES ($1::uuid, $2, $3, $4, true, NOW(), NOW())`,
          tenantId,
          uom.uomCode,
          uom.uomName,
          uom.description,
        );

        this.logger.debug(`Seeded UOM ${uom.uomCode} for tenant ${tenantId}`);
      } catch (err) {
        this.logger.error(
          `Failed to seed UOM ${uom.uomCode} for tenant ${tenantId}: ${(err as Error).message}`,
        );
      }
    }

    this.logger.log(`Completed UOM seeding for tenant ${tenantId}`);
  }
}
