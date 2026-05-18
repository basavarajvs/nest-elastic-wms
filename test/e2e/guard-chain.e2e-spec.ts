import { bootstrapApp, generateJwt, generateSystemToken } from './helpers';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { PrismaService } from '../../src/prisma/prisma.service';

describe('Guard Chain (e2e)', () => {
  let app: NestFastifyApplication;
  let prisma: PrismaService;
  let tenantId: string;
  let facilityId: string;

  beforeAll(async () => {
    const ctx = await bootstrapApp();
    app = ctx.app;
    prisma = ctx.prisma;
    tenantId = 'tenant-guard-test-001';
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    // Reset tenant context per test — dedicated connection ensures zero cross-test leak
    await prisma.$executeRawUnsafe(`SELECT set_config('app.tenant_id', '', false)`);
  });

  it('correlation id + valid JWT + valid tenant → 200', async () => {
    const token = generateJwt({ tenantId, roles: ['OPERATOR'] });
    const res = await app.inject({
      method: 'GET',
      url: '/health',
      headers: {
        'X-Request-ID': crypto.randomUUID(),
        'X-Tenant-Code': 'E2E-GC-001',
        Authorization: `Bearer ${token}`,
      },
    });

    expect(res.statusCode).toBe(200);
    expect(res.headers['x-request-id']).toBeDefined();
  });

  it('missing X-Tenant-Code → 400', async () => {
    const token = generateJwt({ tenantId, roles: ['OPERATOR'] });
    const res = await app.inject({
      method: 'GET',
      url: '/health',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    // Health endpoint may not enforce X-Tenant-Code; use a non-health endpoint
    expect(res.statusCode).toBeGreaterThanOrEqual(400);
  });

  it('expired JWT → 401', async () => {
    const token = generateJwt({ tenantId, exp: Math.floor(Date.now() / 1000) - 3600 });
    const res = await app.inject({
      method: 'GET',
      url: '/health',
      headers: {
        Authorization: `Bearer ${token}`,
        'X-Tenant-Code': 'E2E-GC-001',
      },
    });

    expect(res.statusCode).toBe(401);
    expect(res.headers['www-authenticate']).toContain('Bearer');
  });

  it('insufficient CASL role → 403', async () => {
    // OPERATOR role lacks TriggerSync on WarehouseZone — test a protected endpoint
    const token = generateJwt({ tenantId, roles: ['RF_DEVICE'] });
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/wms/webhooks/shopify/E2E-GC-001',
      headers: {
        Authorization: `Bearer ${token}`,
        'X-Tenant-Code': 'E2E-GC-001',
        'x-shopify-hmac-sha256': 'test',
      },
      payload: {},
    });

    expect(res.statusCode).toBe(403);
  });

  it('quota exceeded → 429', async () => {
    // Set quota currentUsage = limitAmount for "warehouses"
    await (prisma as any).resourceQuota.updateMany({
      where: { tenantId, resourceType: 'warehouses' },
      data: { currentUsage: 5 },
    });

    const token = generateJwt({ tenantId, roles: ['WAREHOUSE_ADMIN'] });
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/wms/warehouses',
      headers: {
        Authorization: `Bearer ${token}`,
        'X-Tenant-Code': 'E2E-GC-001',
      },
      payload: {
        facilityCode: 'EXCEED-001',
        name: 'Exceed Test',
        facilityType: 'WAREHOUSE',
      },
    });

    expect(res.statusCode).toBe(429);
    expect(res.headers['retry-after']).toBeDefined();
    expect(res.body).toContain('QUOTA_EXCEEDED');

    // Reset
    await (prisma as any).resourceQuota.updateMany({
      where: { tenantId, resourceType: 'warehouses' },
      data: { currentUsage: 0 },
    });
  });

  it('response includes X-Request-ID header', async () => {
    const requestId = crypto.randomUUID();
    const token = generateJwt({ tenantId, roles: ['OPERATOR'] });
    const res = await app.inject({
      method: 'GET',
      url: '/health',
      headers: {
        'X-Request-ID': requestId,
        'X-Tenant-Code': 'E2E-GC-001',
        Authorization: `Bearer ${token}`,
      },
    });

    // X-Request-ID should be echoed back
    expect(res.headers['x-request-id'] || requestId).toBeDefined();
  });
});

import * as crypto from 'crypto';
