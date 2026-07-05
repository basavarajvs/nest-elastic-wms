import { BadRequestException, NotFoundException } from '@nestjs/common';
import { InboundTrailerService } from './trailer.service';

describe('InboundTrailerService', () => {
  let service: InboundTrailerService;
  const tenantId = 'test-tenant-uuid';
  const facilityId = BigInt(1);

  const mockTrailer = {
    trailer_id: BigInt(1),
    tenant_id: tenantId,
    facility_id: facilityId,
    trailer_number: 'TRL-001',
    carrier_id: null,
    trailer_type: 'DRY_VAN',
    status: 'ARRIVED',
    is_active: true,
    assigned_dock_id: null,
    assigned_load_id: null,
    arrival_time: new Date(),
    departure_time: null,
    created_at: new Date(),
    updated_at: new Date(),
    version: BigInt(0),
  };

  const mockDock = {
    dock_id: BigInt(1),
    tenant_id: tenantId,
    facility_id: facilityId,
    dock_code: 'DOOR-01',
    dock_name: 'Door 1',
    dock_type: 'RECEIVING',
    is_active: true,
    is_available: true,
    created_at: new Date(),
    updated_at: new Date(),
    version: BigInt(0),
  };

  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      trailers: {
        create: jest.fn().mockResolvedValue(mockTrailer),
        findFirst: jest.fn().mockResolvedValue(mockTrailer),
        findMany: jest.fn().mockResolvedValue([mockTrailer]),
        count: jest.fn().mockResolvedValue(1),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      loading_docks: {
        findFirst: jest.fn().mockResolvedValue(mockDock),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
    };
    service = new InboundTrailerService(mockPrisma as any);
  });

  it('checkIn should create a new trailer', async () => {
    mockPrisma.trailers.findFirst
      .mockResolvedValueOnce(null); // no existing active trailer
    const result = await service.checkIn(tenantId, facilityId, { trailerNumber: 'TRL-001' });
    expect(result.status).toBe('ARRIVED');
    expect(mockPrisma.trailers.create).toHaveBeenCalled();
  });

  it('checkIn should reject duplicate check-in', async () => {
    mockPrisma.trailers.findFirst
      .mockResolvedValueOnce(mockTrailer); // existing active trailer
    await expect(service.checkIn(tenantId, facilityId, { trailerNumber: 'TRL-001' })).rejects.toThrow(BadRequestException);
  });

  it('assignDock should assign trailer to dock', async () => {
    const result = await service.assignDock(tenantId, facilityId, BigInt(1), 'DOOR-01');
    expect(result.status).toBe('AT_DOCK');
    expect(mockPrisma.loading_docks.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ is_available: false }) }),
    );
  });

  it('assignDock should reject inactive dock', async () => {
    mockPrisma.loading_docks.findFirst.mockResolvedValue({ ...mockDock, is_active: false });
    await expect(service.assignDock(tenantId, facilityId, BigInt(1), 'DOOR-01')).rejects.toThrow(BadRequestException);
  });

  it('assignDock should reject unavailable dock', async () => {
    mockPrisma.loading_docks.findFirst.mockResolvedValue({ ...mockDock, is_available: false });
    await expect(service.assignDock(tenantId, facilityId, BigInt(1), 'DOOR-01')).rejects.toThrow(BadRequestException);
  });

  it('assignDock should reject non-ARRIVED trailer', async () => {
    mockPrisma.trailers.findFirst.mockResolvedValue({ ...mockTrailer, status: 'LOADING' });
    await expect(service.assignDock(tenantId, facilityId, BigInt(1), 'DOOR-01')).rejects.toThrow(BadRequestException);
  });

  it('findById should return trailer', async () => {
    const result = await service.findById(tenantId, BigInt(1));
    expect(result.trailer_number).toBe('TRL-001');
  });

  it('findById should throw on not found', async () => {
    mockPrisma.trailers.findFirst.mockResolvedValue(null);
    await expect(service.findById(tenantId, BigInt(999))).rejects.toThrow(NotFoundException);
  });

  it('findAll should return paginated results', async () => {
    const result = await service.findAll(tenantId, { facilityId: '1' });
    expect(result.data).toHaveLength(1);
    expect(result.total).toBe(1);
  });

  it('depart should release dock and set departed', async () => {
    mockPrisma.trailers.findFirst.mockResolvedValue({ ...mockTrailer, assigned_dock_id: BigInt(1) });
    const result = await service.depart(tenantId, BigInt(1));
    expect(result.status).toBe('DEPARTED');
    expect(mockPrisma.loading_docks.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ is_available: true }) }),
    );
  });

  it('depart should reject already departed', async () => {
    mockPrisma.trailers.findFirst.mockResolvedValue({ ...mockTrailer, status: 'DEPARTED' });
    await expect(service.depart(tenantId, BigInt(1))).rejects.toThrow(BadRequestException);
  });
});
