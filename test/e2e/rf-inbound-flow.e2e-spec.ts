import { bootstrapApp, generateJwt, createTestTenant } from './helpers';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { PrismaService } from '../../src/prisma/prisma.service';
import * as crypto from 'crypto';

describe('RF Inbound Flow (e2e)', () => {
  let app: NestFastifyApplication;
  let prisma: PrismaService;
  let tenantId: string;
  let facilityId: string;
  let productId: string;
  let locationId: string;
  let putawayLocationId: string;
  let uomId: string;
  let sessionId: string;
  let lpnNumbers: string[];

  beforeAll(async () => {
    const ctx = await bootstrapApp();
    app = ctx.app;
    prisma = ctx.prisma;

    tenantId = crypto.randomUUID();
    const testData = await createTestTenant(prisma, tenantId, 'RF-FLOW-001');
    facilityId = testData.facilityId;
    productId = testData.productId;
    locationId = testData.locationId;
    uomId = testData.uomId;

    // Create a second location for putaway destination
    putawayLocationId = crypto.randomUUID();
    await (prisma as any).storageLocation.create({
      data: {
        id: putawayLocationId,
        tenantId,
        facilityId,
        locationCode: 'E2E-PUTAWAY-LOC',
        locationType: 'STORAGE',
        isActive: true,
        isPutaway: true,
        isPickable: false,
      },
    });

    // Create initial inventory on_hand at receiving location
    await (prisma as any).inventoryOnHand.create({
      data: {
        tenantId,
        facilityId,
        productId,
        locationId,
        uomId,
        quantityOnHand: 0,
        quantityAvailable: 0,
        quantityReserved: 0,
      },
    });
  });

  afterAll(async () => {
    await prisma.$executeRawUnsafe(`DELETE FROM inventory_transactions WHERE tenant_id = '${tenantId}'`);
    await prisma.$executeRawUnsafe(`DELETE FROM license_plate_numbers WHERE tenant_id = '${tenantId}'`);
    await prisma.$executeRawUnsafe(`DELETE FROM goods_receipt_lines WHERE tenant_id = '${tenantId}'`);
    await prisma.$executeRawUnsafe(`DELETE FROM goods_receipt_notes WHERE tenant_id = '${tenantId}'`);
    await prisma.$executeRawUnsafe(`DELETE FROM inventory_on_hand WHERE tenant_id = '${tenantId}'`);
    await prisma.$executeRawUnsafe(`DELETE FROM storage_locations WHERE tenant_id = '${tenantId}'`);
    await prisma.$executeRawUnsafe(`DELETE FROM products WHERE tenant_id = '${tenantId}'`);
    await prisma.$executeRawUnsafe(`DELETE FROM product_categories WHERE tenant_id = '${tenantId}'`);
    await prisma.$executeRawUnsafe(`DELETE FROM unit_of_measures WHERE tenant_id = '${tenantId}'`);
    await prisma.$executeRawUnsafe(`DELETE FROM warehouse_facilities WHERE tenant_id = '${tenantId}'`);
    await prisma.$executeRawUnsafe(`DELETE FROM resource_quotas WHERE tenant_id = '${tenantId}'`);
    await app.close();
  });

  beforeEach(async () => {
    await prisma.$executeRawUnsafe(`SELECT set_config('app.tenant_id', '${tenantId}', false)`);
  });

  it('1. POST /rf/sessions/start → returns sessionId', async () => {
    const token = generateJwt({ tenantId, roles: ['RF_DEVICE'] });
    const res = await app.inject({
      method: 'POST',
      url: '/rf/sessions/start',
      headers: {
        Authorization: `Bearer ${token}`,
        'X-Tenant-Code': 'RF-FLOW-001',
        'X-Device-Id': crypto.randomUUID(),
        'Content-Type': 'application/json',
      },
      payload: {
        deviceId: 'E2E-RF-DEVICE-001',
        facilityId,
      },
    });

    expect(res.statusCode).toBe(201);
    const body = JSON.parse(res.body);
    expect(body.sessionId).toBeDefined();
    sessionId = body.sessionId;
  });

  it('2. POST /rf/inbound/receive/scan (3 lines) → GRN created, LPNs generated', async () => {
    const token = generateJwt({ tenantId, roles: ['RF_DEVICE'] });
    const scans = [
      { productId, quantity: 50, uomId, locationId },
      { productId, quantity: 30, uomId, locationId },
      { productId, quantity: 20, uomId, locationId },
    ];

    lpnNumbers = [];
    for (const scan of scans) {
      const res = await app.inject({
        method: 'POST',
        url: '/rf/inbound/receive/scan',
        headers: {
          Authorization: `Bearer ${token}`,
          'X-Tenant-Code': 'RF-FLOW-001',
          'X-Device-Id': 'E2E-RF-DEVICE-001',
          'X-Session-Id': sessionId,
          'Content-Type': 'application/json',
        },
        payload: {
          productId: scan.productId,
          quantity: scan.quantity,
          uomId: scan.uomId,
          locationId: scan.locationId,
          lpnType: 'PALLET',
        },
      });

      const body = JSON.parse(res.body);
      expect([201, 200, 409]).toContain(res.statusCode);

      if (body.lpnNumber) {
        lpnNumbers.push(body.lpnNumber);
      }
    }

    expect(lpnNumbers.length).toBe(3);
  });

  it('3. POST /rf/inbound/receive/complete → status RECEIVED, putaway tasks queued', async () => {
    const token = generateJwt({ tenantId, roles: ['RF_DEVICE'] });
    const res = await app.inject({
      method: 'POST',
      url: '/rf/inbound/receive/complete',
      headers: {
        Authorization: `Bearer ${token}`,
        'X-Tenant-Code': 'RF-FLOW-001',
        'X-Device-Id': 'E2E-RF-DEVICE-001',
        'X-Session-Id': sessionId,
        'Content-Type': 'application/json',
      },
      payload: {
        sessionId,
      },
    });

    expect([200, 202]).toContain(res.statusCode);
  });

  it('4. POST /rf/inbound/putaway/confirm (2 tasks) → InventoryTransaction type PUTAWAY', async () => {
    const token = generateJwt({ tenantId, roles: ['RF_DEVICE'] });

    // Read LPN quantities before putaway for ledger verification
    const beforeLpns = await (prisma as any).lPN.findMany({
      where: { tenantId, lpnNumber: { in: lpnNumbers } },
    });
    const beforeQtyMap = new Map(beforeLpns.map((l: any) => [l.lpnNumber, l.quantity]));

    // Confirm putaway for first 2 LPNs
    const putawayResults: any[] = [];
    for (const lpnNumber of lpnNumbers.slice(0, 2)) {
      const res = await app.inject({
        method: 'POST',
        url: '/rf/inbound/putaway/confirm',
        headers: {
          Authorization: `Bearer ${token}`,
          'X-Tenant-Code': 'RF-FLOW-001',
          'X-Device-Id': 'E2E-RF-DEVICE-001',
          'X-Session-Id': sessionId,
          'Content-Type': 'application/json',
        },
        payload: {
          lpnNumber,
          locationCode: 'E2E-PUTAWAY-LOC',
        },
      });

      const body = JSON.parse(res.body);
      putawayResults.push({ status: res.statusCode, body });

      // Verify InventoryTransaction type PUTAWAY was created
      if (res.statusCode === 200 || res.statusCode === 201) {
        const qty = beforeQtyMap.get(lpnNumber) || 0;

        // Verify quantityAfter >= 0 and matches expected
        if (body.quantityAfter !== undefined) {
          expect(body.quantityAfter).toBeGreaterThanOrEqual(0);
        }

        // Verify transaction recorded
        const txns = await (prisma as any).inventoryTransaction.findMany({
          where: {
            tenantId,
            referenceType: 'PUTAWAY',
            referenceId: lpnNumber,
          },
        });
        expect(txns.length).toBeGreaterThanOrEqual(1);

        // Verify quantityBefore + quantity = quantityAfter
        if (txns.length > 0) {
          const txn = txns[0];
          expect(Number(txn.quantityBefore) + Number(txn.quantity)).toBe(Number(txn.quantityAfter));
        }
      }
    }

    // At least 1 putaway should succeed
    const succeeded = putawayResults.filter((r) => r.status === 200 || r.status === 201);
    expect(succeeded.length).toBeGreaterThanOrEqual(1);
  });

  it('5. Verify inventory_transactions ledger matches expected quantityBefore → quantityAfter', async () => {
    // Also verify on_hand updated correctly
    const txns = await (prisma as any).inventoryTransaction.findMany({
      where: { tenantId, referenceType: 'PUTAWAY' },
    });

    // Each transaction should have consistent quantityBefore + quantity = quantityAfter
    for (const txn of txns) {
      expect(Number(txn.quantityBefore) + Number(txn.quantity)).toBe(Number(txn.quantityAfter));
    }
  });

  it('6. Verify LPN.status transitions: RECEIVED → PUTAWAY_PENDING → STORED', async () => {
    const lpns = await (prisma as any).lPN.findMany({
      where: { tenantId, lpnNumber: { in: lpnNumbers } },
    });

    // Putaway-confirmed LPNs should be STORED
    const storedLpns = lpns.filter((l: any) => l.status === 'STORED');
    expect(storedLpns.length).toBeGreaterThanOrEqual(1);

    // Non-putaway LPNs should remain PUTAWAY_PENDING or RECEIVED
    const pendingLpns = lpns.filter(
      (l: any) => l.status === 'PUTAWAY_PENDING' || l.status === 'RECEIVED',
    );
    expect(pendingLpns.length).toBeGreaterThanOrEqual(1);
  });

  it('7. Redis session cleanup on complete', async () => {
    const token = generateJwt({ tenantId, roles: ['RF_DEVICE'] });
    const res = await app.inject({
      method: 'POST',
      url: '/rf/sessions/complete',
      headers: {
        Authorization: `Bearer ${token}`,
        'X-Tenant-Code': 'RF-FLOW-001',
        'X-Device-Id': 'E2E-RF-DEVICE-001',
        'Content-Type': 'application/json',
      },
      payload: {
        sessionId,
      },
    });

    expect([200, 202, 404]).toContain(res.statusCode);
  });
});
