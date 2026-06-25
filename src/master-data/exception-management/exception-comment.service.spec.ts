import { Test, TestingModule } from '@nestjs/testing';
import { ExceptionCommentService } from './exception-comment.service';
import { PrismaService } from '../../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

const mockPrisma = {
  exceptionManagement: {
    findFirst: jest.fn(),
  },
  exceptionComment: {
    create: jest.fn(),
    findMany: jest.fn(),
  },
};

describe('ExceptionCommentService', () => {
  let service: ExceptionCommentService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ExceptionCommentService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();
    service = module.get(ExceptionCommentService);
    jest.clearAllMocks();
  });

  describe('addComment', () => {
    it('should create a comment on an existing exception', async () => {
      mockPrisma.exceptionManagement.findFirst.mockResolvedValue({ id: 'exc-1' });
      mockPrisma.exceptionComment.create.mockResolvedValue({
        id: 'cmt-1',
        exceptionId: 'exc-1',
        body: 'Test comment',
        authorUserId: 'usr-1',
        isInternal: false,
      });

      const result = await service.addComment('exc-1', { body: 'Test comment' }, 't-1', 'usr-1');
      expect(mockPrisma.exceptionComment.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            body: 'Test comment',
            authorUserId: 'usr-1',
            isInternal: false,
          }),
        }),
      );
      expect(result.id).toBe('cmt-1');
    });

    it('should throw when exception not found', async () => {
      mockPrisma.exceptionManagement.findFirst.mockResolvedValue(null);
      await expect(service.addComment('bad-id', { body: 'comment' }, 't-1', 'usr-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('listComments', () => {
    it('should list comments ordered by createdAt asc', async () => {
      mockPrisma.exceptionManagement.findFirst.mockResolvedValue({ id: 'exc-1' });
      mockPrisma.exceptionComment.findMany.mockResolvedValue([
        { id: 'cmt-1', body: 'First' },
        { id: 'cmt-2', body: 'Second' },
      ]);

      const result = await service.listComments('exc-1', 't-1');
      expect(mockPrisma.exceptionComment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { tenantId: 't-1', exceptionId: 'exc-1' },
          orderBy: { createdAt: 'asc' },
        }),
      );
      expect(result).toHaveLength(2);
    });

    it('should throw when exception not found', async () => {
      mockPrisma.exceptionManagement.findFirst.mockResolvedValue(null);
      await expect(service.listComments('bad-id', 't-1')).rejects.toThrow(NotFoundException);
    });
  });
});
