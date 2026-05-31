import { Test, TestingModule } from '@nestjs/testing';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AllocationService } from '../outbound/allocation.service';
import { PrismaService } from '../prisma/prisma.service';
import { AsnService } from '../inbound/asn.service';
import { LpnService } from '../inbound/lpn.service';
import { CycleCountService } from '../inventory/counts/cycle-count.service';
import { InventoryAdjustmentService } from '../inventory/inventory-adjustment.service';
import { OrderService } from '../outbound/order.service';
import { REDIS_CLIENT } from '../common/cache/redis.constants';

const mockRedis: Record<string, jest.Mock> = {
  get: jest.fn().mockResolvedValue(null),
  set: jest.fn().mockResolvedValue('OK'),
  setex: jest.fn().mockResolvedValue('OK'),
  del: jest.fn().mockResolvedValue(1),
};

interface MockPrisma {
  [key: string]: any;
  $queryRawUnsafe: jest.Mock;
  $transaction: jest.Mock;
  $executeRawUnsafe: jest.Mock;
  withTransaction: jest.Mock;
}

const mockPrisma: MockPrisma = {
  salesOrder: { findFirst: jest.fn(), findMany: jest.fn(), update: jest.fn(), count: jest.fn() },
  salesOrderLine: { findFirst: jest.fn(), findMany: jest.fn(), update: jest.fn() },
  inventoryOnHand: { findFirst: jest.fn(), findMany: jest.fn(), update: jest.fn(), updateMany: jest.fn(), create: jest.fn() },
  inventoryAllocation: { findFirst: jest.fn(), findMany: jest.fn(), create: jest.fn(), update: jest.fn() },
  inventoryTransaction: { create: jest.fn() },
  advanceShipNotice: { findFirst: jest.fn(), count: jest.fn(), create: jest.fn(), update: jest.fn() },
  lPN: { findFirst: jest.fn(), findMany: jest.fn(), create: jest.fn(), update: jest.fn() },
  cycleCount: { findFirst: jest.fn(), count: jest.fn(), update: jest.fn() },
  cycleCountLine: { findFirst: jest.fn(), findMany: jest.fn(), update: jest.fn(), count: jest.fn() },
  inventoryAdjustment: { findFirst: jest.fn(), create: jest.fn(), update: jest.fn(), count: jest.fn() },
  adjustmentApproval: { findFirst: jest.fn(), create: jest.fn() },
  approvalThresholdConfig: { findFirst: jest.fn(), findMany: jest.fn() },
  product: { findFirst: jest.fn() },
  productCategory: { findFirst: jest.fn() },
  unitOfMeasure: { findFirst: jest.fn() },
  inventoryPolicy: { findFirst: jest.fn() },
  $queryRawUnsafe: jest.fn(),
  $transaction: jest.fn((fn: any) => fn(mockPrisma)),
  $executeRawUnsafe: jest.fn(),
  withTransaction: jest.fn((_tid: string, fn: any) => fn(mockPrisma)),
};

const mockEventEmitter = { emit: jest.fn() };

describe('Integration Tests', () => {
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      providers: [
        AllocationService,
        AsnService,
        LpnService,
        CycleCountService,
        InventoryAdjustmentService,
        OrderService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: EventEmitter2, useValue: mockEventEmitter },
        { provide: REDIS_CLIENT, useValue: mockRedis },
      ],
    }).compile();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await module.close();
  });

  // ═══════════════════════════════════════════════════
  // 1. Allocation Concurrency
  // ═══════════════════════════════════════════════════
  describe('Allocation Concurrency', () => {
    const tenantId = 't-1';
    const facilityId = 'f-1';
    const orderId = 'order-1';
    const lineId = 'line-1';
    const productId = 'prod-1';

    it('should allocate only available quantity when stock is less than requested', async () => {
      mockPrisma.salesOrder.findFirst.mockResolvedValue({
        id: orderId, facilityId,
        lines: [{ id: lineId, status: 'CREATED', productId, requestedQuantity: 100 }],
      });
      mockPrisma.$queryRawUnsafe.mockResolvedValue([
        { id: 'stock-1', product_id: productId, location_id: 'loc-1', lot_id: 'lot-1', quantity_on_hand: 50, quantity_allocated: 0, quantity_reserved: 0, available: 50 },
      ]);
      mockPrisma.inventoryAllocation.create.mockResolvedValue({ id: 'alloc-1', quantityAllocated: 50 });
      mockPrisma.inventoryAllocation.findMany.mockResolvedValue([]);
      mockPrisma.inventoryOnHand.updateMany.mockResolvedValue({ count: 1 });
      mockPrisma.salesOrderLine.findMany.mockResolvedValue([{ id: lineId, status: 'CREATED' }]);
      mockPrisma.salesOrderLine.update.mockResolvedValue({});
      mockPrisma.salesOrder.update.mockResolvedValue({});

      const svc = module.get(AllocationService);
      const result = await svc.softAllocate(orderId, tenantId);

      expect(mockPrisma.inventoryAllocation.create).toHaveBeenCalledTimes(1);
      expect(result[0].quantityAllocated).toBe(50);
    });

    it('should handle split allocation across multiple stock rows', async () => {
      mockPrisma.salesOrder.findFirst.mockResolvedValue({
        id: orderId, facilityId,
        lines: [{ id: lineId, status: 'CREATED', productId, requestedQuantity: 100 }],
      });
      mockPrisma.$queryRawUnsafe.mockResolvedValue([
        { id: 's1', product_id: productId, location_id: 'loc-a', lot_id: 'l1', quantity_on_hand: 30, quantity_allocated: 0, quantity_reserved: 0, available: 30 },
        { id: 's2', product_id: productId, location_id: 'loc-b', lot_id: 'l2', quantity_on_hand: 70, quantity_allocated: 0, quantity_reserved: 0, available: 70 },
      ]);
      mockPrisma.inventoryAllocation.create
        .mockResolvedValueOnce({ id: 'a1', quantityAllocated: 30 })
        .mockResolvedValueOnce({ id: 'a2', quantityAllocated: 70 });
      mockPrisma.inventoryAllocation.findMany.mockResolvedValue([]);
      mockPrisma.inventoryOnHand.updateMany.mockResolvedValue({ count: 1 });
      mockPrisma.salesOrderLine.findMany.mockResolvedValue([{ id: lineId, status: 'ALLOCATED' }]);
      mockPrisma.salesOrderLine.update.mockResolvedValue({});
      mockPrisma.salesOrder.update.mockResolvedValue({});

      const svc = module.get(AllocationService);
      const result = await svc.softAllocate(orderId, tenantId);

      expect(mockPrisma.inventoryAllocation.create).toHaveBeenCalledTimes(2);
      expect(result).toHaveLength(2);
      expect(mockPrisma.salesOrderLine.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: lineId }, data: { status: 'ALLOCATED' } }),
      );
    });

    it('should create allocation records with expected fields', async () => {
      mockPrisma.salesOrder.findFirst.mockResolvedValue({
        id: orderId, facilityId,
        lines: [{ id: lineId, status: 'CREATED', productId, requestedQuantity: 50 }],
      });
      mockPrisma.$queryRawUnsafe.mockResolvedValue([
        { id: 'stock-1', product_id: productId, location_id: 'loc-1', lot_id: 'lot-1', quantity_on_hand: 50, quantity_allocated: 0, quantity_reserved: 0, available: 50 },
      ]);
      mockPrisma.inventoryAllocation.create.mockResolvedValue({ id: 'alloc-1', quantityAllocated: 50 });
      mockPrisma.inventoryAllocation.findMany.mockResolvedValue([]);
      mockPrisma.inventoryOnHand.updateMany.mockResolvedValue({ count: 1 });
      mockPrisma.salesOrderLine.findMany.mockResolvedValue([{ id: lineId, status: 'ALLOCATED' }]);
      mockPrisma.salesOrderLine.update.mockResolvedValue({});
      mockPrisma.salesOrder.update.mockResolvedValue({});

      const svc = module.get(AllocationService);
      await svc.softAllocate(orderId, tenantId);

      const call = mockPrisma.inventoryAllocation.create.mock.calls[0][0];
      expect(call.data).toMatchObject({
        allocationType: 'SALES_ORDER_PICK',
        status: 'SOFT',
        productId,
        orderId,
        orderLineId: lineId,
      });
      expect(call.data.expiresAt).toBeDefined();
    });
  });

  // ═══════════════════════════════════════════════════
  // 2. RF Receiving (ASN → status transition → LPN)
  // ═══════════════════════════════════════════════════
  describe('RF Receiving Workflow', () => {
    const tenantId = 't-2';
    const facilityId = 'f-2';
    const asnId = 'asn-1';
    const productId = 'prod-2';

    it('should create ASN and transition through statuses', async () => {
      mockPrisma.advanceShipNotice.count.mockResolvedValue(0);
      mockPrisma.advanceShipNotice.create.mockResolvedValue({
        id: asnId, asnNumber: 'ASN-20260101-0001', status: 'CREATED',
        lines: [{ id: 'al-1', productId, expectedQuantity: 50 }],
      });
      mockPrisma.advanceShipNotice.findFirst.mockResolvedValueOnce({ id: asnId, status: 'CREATED' });
      mockPrisma.advanceShipNotice.update.mockResolvedValue({ id: asnId, status: 'IN_TRANSIT' });

      const asnSvc = module.get(AsnService);
      const created = await asnSvc.create({
        facilityId, vendorId: 'v-1', poNumber: 'PO-001',
        lines: [{ productId, expectedQuantity: 50, uomId: 'uom-ea' }],
      }, tenantId);
      expect(created.status).toBe('CREATED');

      const updated = await asnSvc.updateStatus(asnId, 'IN_TRANSIT', tenantId);
      expect(updated.status).toBe('IN_TRANSIT');
    });

    it('should reject invalid ASN status transitions', async () => {
      mockPrisma.advanceShipNotice.findFirst.mockResolvedValue({ id: asnId, status: 'CLOSED' });
      const asnSvc = module.get(AsnService);
      await expect(asnSvc.updateStatus(asnId, 'IN_TRANSIT', tenantId)).rejects.toThrow('Invalid status transition');
    });

    it('should enforce LPN type hierarchy on nesting', async () => {
      mockRedis.set.mockResolvedValue('OK');
      mockPrisma.lPN.findFirst
        .mockResolvedValueOnce({ id: 'case-1', lpnType: 'CASE', status: 'RECEIVED' })
        .mockResolvedValueOnce({ id: 'pallet-1', lpnType: 'PALLET', status: 'RECEIVED' });
      mockPrisma.$queryRawUnsafe.mockResolvedValue([{ id: 'case-1', parent_lpn_id: null, depth: 1 }]);
      mockPrisma.lPN.update.mockResolvedValue({ id: 'case-1', parentLpnId: 'pallet-1', status: 'NESTED' });

      const lpnSvc = module.get(LpnService);
      await lpnSvc.nestLpn({ childLpnId: 'case-1', parentLpnId: 'pallet-1' }, tenantId);
      expect(mockPrisma.lPN.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'case-1' }, data: expect.objectContaining({ parentLpnId: 'pallet-1' }) }),
      );
    });

    it('should reject nesting CARTON into EACH (invalid hierarchy)', async () => {
      mockRedis.set.mockResolvedValue('OK');
      mockPrisma.lPN.findFirst
        .mockResolvedValueOnce({ id: 'child-carton', lpnType: 'CARTON', status: 'RECEIVED' })
        .mockResolvedValueOnce({ id: 'parent-each', lpnType: 'EACH', status: 'RECEIVED' });
      const lpnSvc = module.get(LpnService);
      await expect(lpnSvc.nestLpn({ childLpnId: 'child-carton', parentLpnId: 'parent-each' }, tenantId))
        .rejects.toThrow('Cannot nest CARTON into EACH');
    });
  });

  // ═══════════════════════════════════════════════════
  // 3. Cycle Count Variance
  // ═══════════════════════════════════════════════════
  describe('Cycle Count Variance', () => {
    const tenantId = 't-3';
    const lineId = 'cl-1';
    const countId = 'count-1';
    const productId = 'prod-3';

    beforeEach(() => {
      mockRedis.set.mockResolvedValue('OK');
      mockRedis.del.mockResolvedValue(1);
    });

    it('should detect variance when counted quantity differs from system', async () => {
      const countLine = { id: lineId, countId, productId, locationId: 'loc-3', systemQuantity: 100, countedQuantity: null, varianceQuantity: null, status: 'PENDING', lotId: null };
      mockPrisma.cycleCountLine.findFirst.mockResolvedValue(countLine);
      mockPrisma.cycleCountLine.findFirst.mockResolvedValue({ ...countLine, count: { id: countId, assignedToUserId: 'u-1' } });
      mockPrisma.cycleCountLine.update.mockResolvedValue({ ...countLine, countedQuantity: 85, varianceQuantity: -15, status: 'COUNTED' });

      const ccSvc = module.get(CycleCountService);
      await ccSvc.submitLine({ lineId, countedQuantity: 85 }, tenantId);

      const call = mockPrisma.cycleCountLine.update.mock.calls[0][0];
      expect(call.data.varianceQuantity).toBe(-15);
      expect(call.data.countedQuantity).toBe(85);
      expect(call.data.status).toBe('COUNTED');
    });

    it('should emit count.line.counted event with variance', async () => {
      const countLine = { id: lineId, countId, productId, locationId: 'loc-3', systemQuantity: 100, countedQuantity: null, varianceQuantity: null, status: 'PENDING', lotId: null };
      mockPrisma.cycleCountLine.findFirst.mockResolvedValue({ ...countLine, count: { id: countId, assignedToUserId: 'u-1' } });
      mockPrisma.cycleCountLine.update.mockResolvedValue({ ...countLine, countedQuantity: 85, varianceQuantity: -15, status: 'COUNTED' });

      const ccSvc = module.get(CycleCountService);
      await ccSvc.submitLine({ lineId, countedQuantity: 85 }, tenantId);
      expect(mockEventEmitter.emit).toHaveBeenCalledWith('count.line.counted', { lineId, variance: -15, tenantId });
    });

    it('should reject duplicate count submission via Redis lock', async () => {
      mockRedis.set.mockResolvedValue(null); // lock acquisition fails

      const ccSvc = module.get(CycleCountService);
      await expect(ccSvc.submitLine({ lineId, countedQuantity: 50 }, tenantId))
        .rejects.toThrow('AlreadyCounted');
    });

    it('should compute proper variance direction', async () => {
      const countLine = { id: lineId, countId, productId, locationId: 'loc-3', systemQuantity: 100, countedQuantity: null, varianceQuantity: null, status: 'PENDING', lotId: null };
      mockPrisma.cycleCountLine.findFirst.mockResolvedValue({ ...countLine, count: { id: countId, assignedToUserId: 'u-1' } });
      mockPrisma.cycleCountLine.update.mockResolvedValue({ ...countLine, countedQuantity: 120, varianceQuantity: 20, status: 'COUNTED' });

      const ccSvc = module.get(CycleCountService);
      await ccSvc.submitLine({ lineId, countedQuantity: 120 }, tenantId);

      const call = mockPrisma.cycleCountLine.update.mock.calls[0][0];
      expect(call.data.varianceQuantity).toBe(20); // positive = overage
    });
  });

  // ═══════════════════════════════════════════════════
  // 4. Approval Escalation
  // ═══════════════════════════════════════════════════
  describe('Approval Escalation', () => {
    const tenantId = 't-4';
    const facilityId = 'f-4';

    it('should auto-approve small adjustments within autoThreshold', async () => {
      mockPrisma.approvalThresholdConfig.findFirst.mockResolvedValue({
        autoThreshold: 100, supervisorThreshold: 1000, version: '1.0',
      });
      mockPrisma.inventoryAdjustment.findFirst.mockResolvedValue({
        id: 'adj-auto', tenantId, facilityId, status: 'DRAFT',
        reasonCode: 'CYCLE_COUNT', requestedByUserId: 'u-1',
        lines: [{ id: 'l1', productId: 'p-1', locationId: 'loc-1', lotId: null,
          quantityBefore: 100, quantityAdjustment: 5, quantityAfter: 105, uomId: 'uom-ea' }],
      });
      mockPrisma.$transaction.mockImplementation((fn: any) => fn(mockPrisma));
      mockPrisma.inventoryAdjustment.update.mockResolvedValue({});

      const adjSvc = module.get(InventoryAdjustmentService);
      const result = await adjSvc.submit('adj-auto', tenantId);
      expect(result.status).toBe('APPROVED');
    });

    it('should route to PENDING_APPROVAL when variance exceeds autoThreshold', async () => {
      mockPrisma.approvalThresholdConfig.findFirst.mockResolvedValue({
        autoThreshold: 100, supervisorThreshold: 1000, version: '1.0',
      });
      mockPrisma.inventoryAdjustment.findFirst.mockResolvedValue({
        id: 'adj-pend', tenantId, facilityId, status: 'DRAFT',
        reasonCode: 'DAMAGE', requestedByUserId: 'u-1',
        lines: [{ id: 'l2', productId: 'p-2', locationId: 'loc-2', lotId: null,
          quantityBefore: 100, quantityAdjustment: 500, quantityAfter: 600, uomId: 'uom-ea' }],
      });
      mockPrisma.$transaction.mockImplementation((fn: any) => fn(mockPrisma));
      mockPrisma.inventoryAdjustment.update.mockResolvedValue({});
      mockPrisma.adjustmentApproval.create.mockResolvedValue({
        id: 'app-1', status: 'PENDING', approvalLevel: 'SUPERVISOR',
      });

      const adjSvc = module.get(InventoryAdjustmentService);
      const result = await adjSvc.submit('adj-pend', tenantId);
      expect(result.status).toBe('PENDING_APPROVAL');
      expect(mockPrisma.adjustmentApproval.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            varianceValue: 500,
            approvalLevel: 'SUPERVISOR',
            status: 'PENDING',
          }),
        }),
      );
    });

    it('should escalate to MANAGER level when variance exceeds supervisor threshold', async () => {
      mockPrisma.approvalThresholdConfig.findFirst.mockResolvedValue({
        autoThreshold: 100, supervisorThreshold: 1000, version: '1.0',
      });
      mockPrisma.inventoryAdjustment.findFirst.mockResolvedValue({
        id: 'adj-esc', tenantId, facilityId, status: 'DRAFT',
        reasonCode: 'DAMAGE', requestedByUserId: 'u-1',
        lines: [{ id: 'l3', productId: 'p-3', locationId: 'loc-3', lotId: null,
          quantityBefore: 1000, quantityAdjustment: 5000, quantityAfter: 6000, uomId: 'uom-ea' }],
      });
      mockPrisma.$transaction.mockImplementation((fn: any) => fn(mockPrisma));
      mockPrisma.inventoryAdjustment.update.mockResolvedValue({});
      mockPrisma.adjustmentApproval.create.mockResolvedValue({
        id: 'app-2', status: 'PENDING', approvalLevel: 'MANAGER',
      });

      const adjSvc = module.get(InventoryAdjustmentService);
      const result = await adjSvc.submit('adj-esc', tenantId);
      expect(result.status).toBe('PENDING_APPROVAL');
      expect(mockPrisma.adjustmentApproval.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            approvalLevel: 'MANAGER',
          }),
        }),
      );
    });
  });

  // ═══════════════════════════════════════════════════
  // 5. OrderService syncStatusFromLines event wiring
  // ═══════════════════════════════════════════════════
  describe('Order Status Sync via Events', () => {
    const tenantId = 't-5';
    const orderId = 'order-5';
    const lineId = 'line-5';

    it('should sync order header status when all lines are ALLOCATED', async () => {
      mockPrisma.salesOrder.findFirst.mockResolvedValue({
        id: orderId, lines: [{ id: lineId, status: 'ALLOCATED' }],
      });
      mockPrisma.salesOrder.update.mockResolvedValue({ id: orderId, status: 'ALLOCATED' });

      const svc = module.get(OrderService);
      const result = await svc.syncStatusFromLines(orderId, tenantId);
      expect(result.status).toBe('ALLOCATED');
    });

    it('should sync to SHIPPED when all lines are shipped', async () => {
      mockPrisma.salesOrder.findFirst.mockResolvedValue({
        id: orderId, lines: [{ id: lineId, status: 'SHIPPED' }],
      });
      mockPrisma.salesOrder.update.mockResolvedValue({ id: orderId, status: 'SHIPPED' });

      const svc = module.get(OrderService);
      const result = await svc.syncStatusFromLines(orderId, tenantId);
      expect(result.status).toBe('SHIPPED');
    });

    it('should sync to WAVED when any line is in picking state', async () => {
      mockPrisma.salesOrder.findFirst.mockResolvedValue({
        id: orderId, lines: [
          { id: lineId, status: 'ALLOCATED' },
          { id: 'l2', status: 'PICK_IN_PROGRESS' },
        ],
      });
      mockPrisma.salesOrder.update.mockResolvedValue({ id: orderId, status: 'WAVED' });

      const svc = module.get(OrderService);
      const result = await svc.syncStatusFromLines(orderId, tenantId);
      expect(result.status).toBe('WAVED');
    });

    it('should respond to allocation.soft_done event via OnEvent', async () => {
      mockPrisma.salesOrder.findFirst.mockResolvedValue({
        id: orderId, lines: [{ id: lineId, status: 'ALLOCATED' }],
      });
      mockPrisma.salesOrder.update.mockResolvedValue({});

      const svc = module.get(OrderService);
      await svc.onAllocationSoftDone({ orderId, tenantId });

      expect(mockPrisma.salesOrder.findFirst).toHaveBeenCalled();
    });

    it('should respond to picking.completed event via OnEvent', async () => {
      mockPrisma.salesOrderLine.findFirst.mockResolvedValue({ id: lineId, salesOrderId: orderId });
      mockPrisma.salesOrder.findFirst.mockResolvedValue({
        id: orderId, lines: [{ id: lineId, status: 'PICKED' }],
      });
      mockPrisma.salesOrder.update.mockResolvedValue({});

      const svc = module.get(OrderService);
      await svc.onPickingCompleted({ orderLineId: lineId, tenantId });

      expect(mockPrisma.salesOrderLine.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: lineId, tenantId } }),
      );
      expect(mockPrisma.salesOrder.update).toHaveBeenCalled();
    });
  });
});
