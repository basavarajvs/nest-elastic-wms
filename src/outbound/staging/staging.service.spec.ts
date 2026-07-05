import { NotFoundException, BadRequestException } from '@nestjs/common';
import { StagingService } from './staging.service';

describe('StagingService', () => {
  let service: StagingService;
  const tenantId = 'test-tenant-uuid';
  const facilityId = BigInt(1);

  const mockLpn = {
    lpn_id: BigInt(1),
    lpn_number: 'CTN-001',
    tenant_id: tenantId,
    facility_id: facilityId,
    location_id: BigInt(1),
    product_id: BigInt(1),
    parent_lpn_id: null,
    lpn_type: 'CARTON',
    status: 'PACKED',
    assigned_shipment_id: BigInt(100),
    assigned_load_id: null,
    staging_location_id: null,
    staged_at: null,
    loaded_at: null,
    created_at: new Date(),
    updated_at: new Date(),
    version: BigInt(0),
  };

  const mockLane = {
    lane_id: BigInt(1),
    tenant_id: tenantId,
    facility_id: facilityId,
    lane_code: 'STAGE-DOOR-01',
    lane_type: 'DOOR',
    description: null,
    zone_id: null,
    assigned_carrier_id: null,
    assigned_door_id: null,
    assigned_route_id: null,
    max_cartons: 50,
    current_carton_count: 10,
    is_active: true,
    created_at: new Date(),
    updated_at: new Date(),
    version: BigInt(0),
  };

  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      license_plate_numbers: {
        findFirst: jest.fn().mockResolvedValue(mockLpn),
        findMany: jest.fn().mockResolvedValue([mockLpn]),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      staging_lanes: {
        findFirst: jest.fn().mockResolvedValue(mockLane),
        findMany: jest.fn().mockResolvedValue([mockLane]),
        create: jest.fn().mockResolvedValue(mockLane),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      outbound_shipments: { updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
    };
    service = new StagingService(mockPrisma as any);
  });

  it('getNextStagingWork should return carton and lane', async () => {
    const result = await service.getNextStagingWork(tenantId, facilityId, 'user-1');
    expect(result.carton).toBeDefined();
    expect(result.suggestedLane).toBeDefined();
  });

  it('scanCartonForStaging should validate PACKED status', async () => {
    const result = await service.scanCartonForStaging(tenantId, facilityId, 'CTN-001');
    expect(result.status).toBe('PACKED');
  });

  it('scanCartonForStaging should throw on wrong status', async () => {
    mockPrisma.license_plate_numbers.findFirst.mockResolvedValue({ ...mockLpn, status: 'PICKED' });
    await expect(service.scanCartonForStaging(tenantId, facilityId, 'CTN-001')).rejects.toThrow(BadRequestException);
  });

  it('moveToStagingLane should update carton status', async () => {
    const result = await service.moveToStagingLane(tenantId, facilityId, BigInt(1), BigInt(1), 'user-1');
    expect(mockPrisma.license_plate_numbers.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: 'STAGED' }) }),
    );
  });

  it('moveToStagingLane should throw on full lane', async () => {
    mockPrisma.staging_lanes.findFirst.mockResolvedValue({ ...mockLane, current_carton_count: 50, max_cartons: 50 });
    await expect(service.moveToStagingLane(tenantId, facilityId, BigInt(1), BigInt(1), 'user-1')).rejects.toThrow(BadRequestException);
  });

  it('verifyStagingLane should find lane', async () => {
    const result = await service.verifyStagingLane(tenantId, facilityId, 'STAGE-DOOR-01');
    expect(result.lane_code).toBe('STAGE-DOOR-01');
  });

  it('createLane should create lane', async () => {
    const result = await service.createLane(tenantId, { facilityId: '1', laneCode: 'NEW-LANE' });
    expect(mockPrisma.staging_lanes.create).toHaveBeenCalled();
  });

  it('getLaneContents should return cartons', async () => {
    const result = await service.getLaneContents(tenantId, facilityId, BigInt(1));
    expect(result.cartonCount).toBe(1);
  });

  it('getNextStagingWork should return null when no work', async () => {
    mockPrisma.license_plate_numbers.findFirst.mockResolvedValue(null);
    const result = await service.getNextStagingWork(tenantId, facilityId, 'user-1');
    expect(result).toBeNull();
  });
});
