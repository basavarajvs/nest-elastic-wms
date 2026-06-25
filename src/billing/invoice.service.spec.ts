import { Test, TestingModule } from '@nestjs/testing';
import { InvoiceService } from './invoice.service';
import { PrismaService } from '../prisma/prisma.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

const mockPrisma = {
  storageCharge: {
    findMany: jest.fn(),
    updateMany: jest.fn(),
  },
  clientInvoice: {
    create: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
  },
};

describe('InvoiceService', () => {
  let service: InvoiceService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [InvoiceService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();
    service = module.get(InvoiceService);
    jest.clearAllMocks();
  });

  describe('generateInvoice', () => {
    it('should create invoice from pending charges', async () => {
      mockPrisma.storageCharge.findMany.mockResolvedValue([
        { id: 'chg-1', chargeNumber: 'CHG-001', quantity: 10, rateApplied: 5, amount: 50, description: 'test' },
        { id: 'chg-2', chargeNumber: 'CHG-002', quantity: 5, rateApplied: 5, amount: 25, description: 'test2' },
      ]);
      mockPrisma.clientInvoice.create.mockResolvedValue({ id: 'inv-1', lines: [] });
      mockPrisma.storageCharge.updateMany.mockResolvedValue({ count: 2 });

      const result = await service.generateInvoice({
        facilityId: 'fac-1', clientId: 'c-1',
        periodStart: '2026-06-01', periodEnd: '2026-06-30',
        dueDate: '2026-07-15',
      }, 't-1');

      expect(result.id).toBe('inv-1');
      expect(mockPrisma.clientInvoice.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            subtotal: 75,
            totalAmount: 75,
            lines: expect.objectContaining({
              create: expect.arrayContaining([
                expect.objectContaining({ lineTotal: 50 }),
                expect.objectContaining({ lineTotal: 25 }),
              ]),
            }),
          }),
        }),
      );
    });

    it('should throw when no pending charges', async () => {
      mockPrisma.storageCharge.findMany.mockResolvedValue([]);
      await expect(service.generateInvoice({
        facilityId: 'fac-1', clientId: 'c-1',
        periodStart: '2026-06-01', periodEnd: '2026-06-30',
        dueDate: '2026-07-15',
      }, 't-1')).rejects.toThrow(BadRequestException);
    });
  });

  describe('listInvoices / getInvoice', () => {
    it('should list invoices', async () => {
      mockPrisma.clientInvoice.findMany.mockResolvedValue([{ id: 'inv-1' }]);
      const result = await service.listInvoices('t-1', { facilityId: 'fac-1' });
      expect(result).toHaveLength(1);
    });

    it('should return invoice with lines', async () => {
      mockPrisma.clientInvoice.findFirst.mockResolvedValue({ id: 'inv-1', lines: [] });
      const result = await service.getInvoice('inv-1', 't-1');
      expect(result.id).toBe('inv-1');
    });

    it('should throw on getInvoice not found', async () => {
      mockPrisma.clientInvoice.findFirst.mockResolvedValue(null);
      await expect(service.getInvoice('bad-id', 't-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateStatus', () => {
    it('should update status and set paidAt', async () => {
      mockPrisma.clientInvoice.findFirst.mockResolvedValue({ id: 'inv-1', status: 'SENT' });
      mockPrisma.clientInvoice.update.mockResolvedValue({ id: 'inv-1', status: 'PAID' });
      const result = await service.updateStatus('inv-1', { status: 'PAID' }, 't-1');
      expect(mockPrisma.clientInvoice.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'PAID', paidAt: expect.any(Date) }),
        }),
      );
      expect(result.status).toBe('PAID');
    });

    it('should throw when invoice not found', async () => {
      mockPrisma.clientInvoice.findFirst.mockResolvedValue(null);
      await expect(service.updateStatus('bad-id', { status: 'PAID' }, 't-1')).rejects.toThrow(NotFoundException);
    });
  });
});
