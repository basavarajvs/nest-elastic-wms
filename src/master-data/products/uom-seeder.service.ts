import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';

const STANDARD_UOMS = [
  { code: 'EA', name: 'Each', isBase: true },
  { code: 'CS', name: 'Case', isBase: false },
  { code: 'PLT', name: 'Pallet', isBase: false },
  { code: 'KG', name: 'Kilogram', isBase: true },
  { code: 'LB', name: 'Pound', isBase: true },
];

@Injectable()
export class UomSeederService implements OnModuleInit {
  private readonly logger = new Logger(UomSeederService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit() {
    if (this.configService.get('NODE_ENV') === 'test') return;
    this.logger.log('UOM seeder initialized — seeding per tenant on demand');
  }

  async seedForTenant(tenantId: string): Promise<void> {
    for (const uom of STANDARD_UOMS) {
      await (this.prisma as any).unitOfMeasure.upsert({
        where: {
          units_of_measure_code_uq: { tenantId, code: uom.code },
        },
        update: { name: uom.name, isBase: uom.isBase },
        create: {
          tenantId,
          code: uom.code,
          name: uom.name,
          isBase: uom.isBase,
        },
      });
    }
    this.logger.log(`Standard UOMs seeded for tenant ${tenantId}`);
  }
}
