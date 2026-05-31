import { Test, TestingModule } from '@nestjs/testing';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';
import { bootstrapApp, generateJwt, createTestTenant } from './helpers';
import * as crypto from 'crypto';

describe('P2 Modules (e2e)', () => {
  let app: NestFastifyApplication;
  let prisma: PrismaService;
  let tenantId: string;
  let facilityId: string;
  let authToken: string;

  beforeAll(async () => {
    const ctx = await bootstrapApp();
    app = ctx.app;
    prisma = ctx.prisma;

    tenantId = crypto.randomUUID();
    const resources = await createTestTenant(prisma, tenantId);
    facilityId = resources.facilityId;

    authToken = generateJwt({ tenantId, facilityIds: [facilityId] });
  });

  afterAll(async () => {
    // Clean up test tenant data
    await prisma.$executeRawUnsafe(
      `DELETE FROM multitenant.resource_quotas WHERE tenant_id = $1::uuid`,
      tenantId,
    );
    await app.close();
  });

  describe('Packing Stations', () => {
    const stationCode = `STN-${Date.now()}`;
    let stationId: string;

    it('POST /web/packing-stations - creates a packing station', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/wms/web/packing-stations',
        headers: { Authorization: `Bearer ${authToken}` },
        payload: {
          facilityId,
          stationCode,
          stationName: 'Packing Station 1',
          printerType: 'Zebra ZD621',
          scaleType: 'Mettler Toledo',
          isActive: true,
        },
      });
      expect(res.statusCode).toBe(201);
      const body = JSON.parse(res.payload);
      expect(body.stationCode).toBe(stationCode);
      stationId = body.id;
    });

    it('GET /web/packing-stations - lists all stations', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/wms/web/packing-stations',
        headers: { Authorization: `Bearer ${authToken}` },
      });
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload);
      expect(Array.isArray(body)).toBe(true);
      expect(body.some((s: any) => s.stationCode === stationCode)).toBe(true);
    });

    it('GET /web/packing-stations/:id - gets station by ID', async () => {
      const res = await app.inject({
        method: 'GET',
        url: `/api/v1/wms/web/packing-stations/${stationId}`,
        headers: { Authorization: `Bearer ${authToken}` },
      });
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload);
      expect(body.id).toBe(stationId);
    });

    it('PATCH /web/packing-stations/:id - updates station', async () => {
      const res = await app.inject({
        method: 'PATCH',
        url: `/api/v1/wms/web/packing-stations/${stationId}`,
        headers: { Authorization: `Bearer ${authToken}` },
        payload: { isAvailable: false, stationName: 'Updated Station' },
      });
      expect(res.statusCode).toBe(200);
      expect(JSON.parse(res.payload).stationName).toBe('Updated Station');
    });

    it('DELETE /web/packing-stations/:id - deletes station', async () => {
      const res = await app.inject({
        method: 'DELETE',
        url: `/api/v1/wms/web/packing-stations/${stationId}`,
        headers: { Authorization: `Bearer ${authToken}` },
      });
      expect(res.statusCode).toBe(200);
    });
  });

  describe('Loading Docks', () => {
    const dockCode = `DOCK-${Date.now()}`;
    let dockId: string;

    it('POST /web/loading-docks - creates a loading dock', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/wms/web/loading-docks',
        headers: { Authorization: `Bearer ${authToken}` },
        payload: {
          facilityId,
          dockCode,
          dockName: 'Dock 1',
          dockType: 'SHIPPING',
          hasLeveler: true,
          maxTrailerLength: 53,
        },
      });
      expect(res.statusCode).toBe(201);
      dockId = JSON.parse(res.payload).id;
    });

    it('RF GET /rf/loading-docks/available - lists available docks', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/wms/rf/loading-docks/available',
        headers: { Authorization: `Bearer ${authToken}` },
      });
      expect(res.statusCode).toBe(200);
    });

    it('RF POST /rf/loading-docks/:id/assign - assigns a dock', async () => {
      const res = await app.inject({
        method: 'POST',
        url: `/api/v1/wms/rf/loading-docks/${dockId}/assign`,
        headers: { Authorization: `Bearer ${authToken}` },
      });
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload);
      expect(body.isAvailable).toBe(false);
    });
  });

  describe('Exception Management', () => {
    let exceptionId: string;

    it('POST /web/exceptions - creates an exception', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/wms/web/exceptions',
        headers: { Authorization: `Bearer ${authToken}` },
        payload: {
          facilityId,
          exceptionType: 'DAMAGE',
          severity: 'HIGH',
          notes: 'Product damaged during putaway',
        },
      });
      expect(res.statusCode).toBe(201);
      exceptionId = JSON.parse(res.payload).id;
    });

    it('PATCH /web/exceptions/:id - resolves exception', async () => {
      const res = await app.inject({
        method: 'PATCH',
        url: `/api/v1/wms/web/exceptions/${exceptionId}`,
        headers: { Authorization: `Bearer ${authToken}` },
        payload: { status: 'RESOLVED', resolutionDescription: 'Product quarantined' },
      });
      expect(res.statusCode).toBe(200);
      expect(JSON.parse(res.payload).status).toBe('RESOLVED');
    });

    it('RF POST /rf/exceptions/report - reports exception from floor', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/wms/rf/exceptions/report',
        headers: { Authorization: `Bearer ${authToken}` },
        payload: { exceptionType: 'SHORTAGE', notes: 'Expected 10 but found 8' },
      });
      expect(res.statusCode).toBe(201);
    });
  });

  describe('Product Client Assignments', () => {
    const clientId = crypto.randomUUID();
    const productId = crypto.randomUUID();
    let assignmentId: string;

    it('POST /web/product-client-assignments - creates assignment', async () => {
      // First create a client and product
      await (prisma as any).client.create({
        data: { id: clientId, tenantId, clientCode: `CLI-${Date.now()}`, name: 'E2E Client', isActive: true },
      });
      const catId = crypto.randomUUID();
      const uomId = crypto.randomUUID();
      await (prisma as any).productCategory.create({
        data: { id: catId, tenantId, categoryCode: `CAT-${Date.now()}`, name: 'E2E Cat' },
      });
      await (prisma as any).unitOfMeasure.create({
        data: { id: uomId, tenantId, uomCode: `UOM-${Date.now()}`, name: 'E2E UOM', uomType: 'UNIT' },
      });
      await (prisma as any).product.create({
        data: { id: productId, tenantId, categoryId: catId, baseUomId: uomId, productCode: `PROD-${Date.now()}`, name: 'E2E Product', isActive: true },
      });

      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/wms/web/product-client-assignments',
        headers: { Authorization: `Bearer ${authToken}` },
        payload: { facilityId, productId, clientId, isActive: true },
      });
      expect(res.statusCode).toBe(201);
      assignmentId = JSON.parse(res.payload).id;
    });

    it('GET /web/product-client-assignments/by-product/:productId - finds by product', async () => {
      const res = await app.inject({
        method: 'GET',
        url: `/api/v1/wms/web/product-client-assignments/by-product/${productId}`,
        headers: { Authorization: `Bearer ${authToken}` },
      });
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload);
      expect(Array.isArray(body)).toBe(true);
    });
  });

  describe('VAS Execution', () => {
    let taskId: string;

    it('POST /web/vas-tasks - creates a VAS task', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/wms/web/vas-tasks',
        headers: { Authorization: `Bearer ${authToken}` },
        payload: {
          facilityId,
          taskType: 'KITTING',
          quantityRequired: 100,
          priority: 1,
          notes: 'Kit A with components B and C',
        },
      });
      expect(res.statusCode).toBe(201);
      taskId = JSON.parse(res.payload).id;
    });

    it('RF POST /rf/vas-tasks/:id/start - operator starts task', async () => {
      const res = await app.inject({
        method: 'POST',
        url: `/api/v1/wms/rf/vas-tasks/${taskId}/start`,
        headers: { Authorization: `Bearer ${authToken}` },
      });
      expect(res.statusCode).toBe(200);
      expect(JSON.parse(res.payload).status).toBe('IN_PROGRESS');
    });

    it('RF POST /rf/vas-tasks/:id/complete - operator completes task', async () => {
      const res = await app.inject({
        method: 'POST',
        url: `/api/v1/wms/rf/vas-tasks/${taskId}/complete`,
        headers: { Authorization: `Bearer ${authToken}` },
        payload: { quantityCompleted: 100 },
      });
      expect(res.statusCode).toBe(200);
      expect(JSON.parse(res.payload).status).toBe('COMPLETED');
    });
  });

  describe('Carrier Rate Shopping', () => {
    let carrierId: string;
    let rateId: string;

    it('POST /web/carrier-rates - creates a carrier rate', async () => {
      carrierId = crypto.randomUUID();
      await (prisma as any).carrier.create({
        data: { id: carrierId, tenantId, carrierCode: `CAR-${Date.now()}`, name: 'E2E Carrier', isActive: true },
      });

      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/wms/web/carrier-rates',
        headers: { Authorization: `Bearer ${authToken}` },
        payload: {
          carrierId,
          serviceCode: 'GROUND',
          serviceName: 'Ground Shipping',
          zone: 'ZONE_1',
          baseRate: 10.00,
          ratePerKg: 0.50,
          fuelSurcharge: 5.00,
          minCharge: 8.00,
          weightFrom: 0,
          weightTo: 100,
        },
      });
      expect(res.statusCode).toBe(201);
      rateId = JSON.parse(res.payload).id;
    });

    it('POST /web/carrier-rates/quote - gets rate quote', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/wms/web/carrier-rates/quote',
        headers: { Authorization: `Bearer ${authToken}` },
        payload: { carrierId, weight: 50, destinationZone: 'ZONE_1' },
      });
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload);
      expect(Array.isArray(body)).toBe(true);
      expect(body.length).toBeGreaterThan(0);
    });
  });

  describe('Non-Conformance Reports', () => {
    let ncrId: string;

    it('POST /web/non-conformance-reports - creates NCR', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/wms/web/non-conformance-reports',
        headers: { Authorization: `Bearer ${authToken}` },
        payload: {
          facilityId,
          ncrName: 'Damaged pallet',
          severity: 'HIGH',
          description: 'Pallet 123 was found damaged',
        },
      });
      expect(res.statusCode).toBe(201);
      ncrId = JSON.parse(res.payload).id;
    });

    it('PATCH /web/non-conformance-reports/:id - resolves NCR with root cause', async () => {
      const res = await app.inject({
        method: 'PATCH',
        url: `/api/v1/wms/web/non-conformance-reports/${ncrId}`,
        headers: { Authorization: `Bearer ${authToken}` },
        payload: {
          status: 'RESOLVED',
          rootCause: 'Forklift operator error',
          correctiveAction: 'Retrain operator on pallet handling',
        },
      });
      expect(res.statusCode).toBe(200);
      expect(JSON.parse(res.payload).status).toBe('RESOLVED');
    });
  });
});
