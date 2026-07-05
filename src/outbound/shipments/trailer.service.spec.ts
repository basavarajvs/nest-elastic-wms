import { NotFoundException, BadRequestException } from '@nestjs/common';
import { TrailerService } from './trailer.service';

describe('TrailerService', () => {
  let service: TrailerService;
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
    max_weight_kg: null,
    max_volume_cbm: null,
    max_pallets: null,
    max_cartons: null,
    assigned_load_id: null,
    assigned_dock_id: null,
    seal_number: null,
    arrival_time: new Date(),
    departure_time: null,
    notes: null,
    created_by: null,
    updated_by: null,
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
      loads: { findMany: jest.fn().mockResolvedValue([]), count: jest.fn().mockResolvedValue(0) },
      loading_docks: { findMany: jest.fn().mockResolvedValue([]) },
      outbound_shipments: { count: jest.fn().mockResolvedValue(0) },
    };
    service = new TrailerService(mockPrisma as any);
  });

  describe('create', () => {
    it('should create a trailer with defaults', async () => {
      const dto = { facilityId: '1', trailerNumber: 'TRL-001' };
      const result = await service.create(tenantId, dto);
      expect(result.trailer_number).toBe('TRL-001');
      expect(mockPrisma.trailers.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ trailer_number: 'TRL-001', trailer_type: 'DRY_VAN', status: 'ARRIVED' }),
        }),
      );
    });
  });

  describe('findAll', () => {
    it('should return paginated results', async () => {
      const result = await service.findAll(tenantId, { facilityId: '1' });
      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
    });
  });

  describe('findById', () => {
    it('should find by id', async () => {
      const result = await service.findById(tenantId, BigInt(1));
      expect(result).toEqual(mockTrailer);
    });

    it('should throw on missing', async () => {
      mockPrisma.trailers.findFirst.mockResolvedValue(null);
      await expect(service.findById(tenantId, BigInt(999))).rejects.toThrow(NotFoundException);
    });
  });

  describe('assignToLoad', () => {
    it('should assign to load', async () => {
      const result = await service.assignToLoad(tenantId, BigInt(1), BigInt(10));
      expect(result.status).toBe('LOADING');
    });

    it('should reject inactive trailer', async () => {
      mockPrisma.trailers.findFirst.mockResolvedValue({ ...mockTrailer, is_active: false });
      await expect(service.assignToLoad(tenantId, BigInt(1), BigInt(10))).rejects.toThrow(BadRequestException);
    });
  });

  describe('depart', () => {
    it('should depart trailer', async () => {
      const result = await service.depart(tenantId, BigInt(1));
      expect(result.status).toBe('DEPARTED');
    });
  });

  describe('getNextLoadingWork', () => {
    it('should return null when no loads', async () => {
      mockPrisma.loads.findMany.mockResolvedValue([]);
      const result = await service.getNextLoadingWork(tenantId, facilityId, 'user-1');
      expect(result).toBeNull();
    });
  });
});
