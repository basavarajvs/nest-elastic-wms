import { Test, TestingModule } from '@nestjs/testing';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';
import * as crypto from 'crypto';
import * as jwt from 'jsonwebtoken';

export async function bootstrapApp(): Promise<{
  app: NestFastifyApplication;
  prisma: PrismaService;
}> {
  // Use dedicated E2E DB URL or fallback to DATABASE_URL with ?schema=e2e_test
  process.env.E2E_TEST_DB_URL =
    process.env.E2E_TEST_DB_URL ||
    process.env.DATABASE_URL?.replace(/\?schema=multitenant/, '?schema=e2e_test') ||
    'postgresql://elasticwmsdbadmin:elasticwmsdbadmin@localhost:5432/elasticwms?schema=e2e_test';

  process.env.DATABASE_URL = process.env.E2E_TEST_DB_URL;

  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideProvider('ASYNC_LOCAL_STORAGE')
    .useValue(new Map())
    .compile();

  const app = moduleFixture.createNestApplication<NestFastifyApplication>(
    new FastifyAdapter({
      logger: false,
      bodyLimit: 10 * 1024 * 1024,
    }),
  );

  // Disable global guards for testing (we test them explicitly)
  app.useGlobalGuards();
  app.useGlobalInterceptors();
  app.useGlobalFilters();
  app.useGlobalPipes();

  await app.init();
  await app.getHttpAdapter().getInstance().ready();

  const prisma = app.get(PrismaService);

  // Reset tenant context between test runs
  await prisma.$executeRawUnsafe(`SELECT set_config('app.tenant_id', '', false)`);

  return { app, prisma };
}

export function generateJwt(overrides: Record<string, any> = {}): string {
  const secret = process.env.JWT_ACCESS_SECRET || 'test-secret-that-is-at-least-32-chars-long!!';
  const payload = {
    sub: crypto.randomUUID(),
    tenantId: crypto.randomUUID(),
    email: 'test@example.com',
    roles: ['OPERATOR'],
    facilityIds: [crypto.randomUUID()],
    ...overrides,
  };
  return jwt.sign(payload, secret, { expiresIn: '15m' });
}

export function generateSystemToken(): string {
  return process.env.CORE_API_TOKEN || 'test-system-token-that-is-min-32-chars!!';
}

export async function createTestTenant(prisma: PrismaService, tenantId: string, code?: string) {
  const facilityId = crypto.randomUUID();
  const categoryId = crypto.randomUUID();
  const uomId = crypto.randomUUID();
  const locationId = crypto.randomUUID();
  const productId = crypto.randomUUID();

  // Create facility
  await (prisma as any).warehouseFacility.create({
    data: {
      id: facilityId,
      tenantId,
      facilityCode: code || `E2E-${tenantId.substring(0, 8)}`,
      name: `E2E Facility ${tenantId.substring(0, 8)}`,
      facilityType: 'WAREHOUSE',
      isActive: true,
    },
  });

  // Create UOM
  await (prisma as any).unitOfMeasure.create({
    data: {
      id: uomId,
      tenantId,
      uomCode: 'EA',
      name: 'Each',
      uomType: 'UNIT',
    },
  });

  // Create category
  await (prisma as any).productCategory.create({
    data: {
      id: categoryId,
      tenantId,
      categoryCode: 'E2E-CAT',
      name: 'E2E Category',
    },
  });

  // Create product
  await (prisma as any).product.create({
    data: {
      id: productId,
      tenantId,
      categoryId,
      baseUomId: uomId,
      productCode: `E2E-PROD-${tenantId.substring(0, 6)}`,
      name: `E2E Product ${tenantId.substring(0, 6)}`,
      isActive: true,
    },
  });

  // Create location
  await (prisma as any).storageLocation.create({
    data: {
      id: locationId,
      tenantId,
      facilityId,
      locationCode: `E2E-LOC-${tenantId.substring(0, 6)}`,
      locationType: 'STORAGE',
      isActive: true,
      isPutaway: true,
      isPickable: true,
    },
  });

  // Create resource quota
  await (prisma as any).resourceQuota.create({
    data: {
      tenantId,
      resourceType: 'warehouses',
      limitAmount: 5,
      currentUsage: 0,
    },
  });

  // Cache tenant code in Redis (mocked or real)
  try {
    const redisKey = `tenant:code:${code || `E2E-CODE-${tenantId.substring(0, 6)}`}`;
    await (prisma as any).$queryRawUnsafe(
      `SELECT redis_set('${redisKey}', '${tenantId}')`,
    );
  } catch {
    // Redis not available in test
  }

  return { facilityId, categoryId, uomId, productId, locationId };
}

export async function createLpn(
  prisma: PrismaService,
  tenantId: string,
  facilityId: string,
  productId: string,
  locationId: string,
  uomId: string,
  lpnNumber: string,
  status: string = 'RECEIVED',
  quantity: number = 10,
) {
  const lpnId = crypto.randomUUID();
  const grnId = crypto.randomUUID();
  const grnLineId = crypto.randomUUID();

  // Create GRN
  await (prisma as any).goodsReceiptNote.create({
    data: {
      id: grnId,
      tenantId,
      facilityId,
      grnNumber: `GRN-${lpnNumber}`,
      status: 'RECEIVED',
      supplierName: 'E2E Supplier',
    },
  });

  // Create GRN line
  await (prisma as any).goodsReceiptLine.create({
    data: {
      id: grnLineId,
      tenantId,
      grnId,
      productId,
      uomId,
      expectedQty: quantity,
      receivedQty: quantity,
      status: 'RECEIVED',
    },
  });

  // Create LPN
  await (prisma as any).lPN.create({
    data: {
      id: lpnId,
      tenantId,
      facilityId,
      lpnNumber,
      lpnType: 'PALLET',
      status,
      locationId,
      productId,
      quantity,
      uomId,
      grnLineId,
    },
  });

  return { lpnId, grnId, grnLineId };
}
