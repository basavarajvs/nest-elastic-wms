import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GenerateInvoiceDto, UpdateInvoiceStatusDto } from './dtos/billing.dto';

@Injectable()
export class InvoiceService {
  private readonly logger = new Logger(InvoiceService.name);

  constructor(private readonly prisma: PrismaService) {}

  async generateInvoice(dto: GenerateInvoiceDto, tenantId: string): Promise<any> {
    const charges = await this.prisma.storageCharge.findMany({
      where: {
        tenantId,
        facilityId: dto.facilityId,
        clientId: dto.clientId,
        status: 'PENDING',
        periodStart: new Date(dto.periodStart),
        periodEnd: new Date(dto.periodEnd),
      },
    });

    if (charges.length === 0) {
      throw new BadRequestException('No pending charges found for the given period');
    }

    const subtotal = charges.reduce((sum, c) => sum + Number(c.amount), 0);
    const taxAmount = dto.taxAmount ?? 0;
    const discountAmount = dto.discountAmount ?? 0;
    const totalAmount = subtotal + taxAmount - discountAmount;
    const invoiceNumber = `INV-${Date.now()}`;

    const invoice = await this.prisma.clientInvoice.create({
      data: {
        tenantId,
        facilityId: dto.facilityId,
        invoiceNumber,
        clientId: dto.clientId,
        invoiceDate: new Date(),
        dueDate: new Date(dto.dueDate),
        periodStart: new Date(dto.periodStart),
        periodEnd: new Date(dto.periodEnd),
        subtotal,
        taxAmount,
        discountAmount,
        totalAmount,
        notes: dto.notes ?? undefined,
        lines: {
          create: charges.map((c) => ({
            tenantId,
            chargeId: c.id,
            lineType: 'STORAGE',
            description: c.description ?? `Storage charge ${c.chargeNumber}`,
            quantity: c.quantity,
            unitPrice: c.rateApplied,
            lineTotal: Number(c.amount),
          })),
        },
      },
      include: { lines: true },
    });

    await this.prisma.storageCharge.updateMany({
      where: { id: { in: charges.map((c) => c.id) } },
      data: { status: 'INVOICED', invoiceId: invoice.id },
    });

    return invoice;
  }

  async listInvoices(tenantId: string, filters: { facilityId: string; clientId?: string; status?: string }): Promise<any> {
    const where: any = { tenantId, facilityId: filters.facilityId };
    if (filters.clientId) where.clientId = filters.clientId;
    if (filters.status) where.status = filters.status;
    return this.prisma.clientInvoice.findMany({ where, orderBy: { createdAt: 'desc' } });
  }

  async getInvoice(id: string, tenantId: string): Promise<any> {
    const invoice = await this.prisma.clientInvoice.findFirst({
      where: { id, tenantId },
      include: { lines: true },
    });
    if (!invoice) throw new NotFoundException('Invoice not found');
    return invoice;
  }

  async updateStatus(id: string, dto: UpdateInvoiceStatusDto, tenantId: string): Promise<any> {
    const invoice = await this.prisma.clientInvoice.findFirst({ where: { id, tenantId } });
    if (!invoice) throw new NotFoundException('Invoice not found');

    const updateData: any = { status: dto.status, notes: dto.notes ?? undefined };
    if (dto.status === 'PAID' && dto.paidAt) updateData.paidAt = new Date(dto.paidAt);
    if (dto.status === 'PAID' && !dto.paidAt) updateData.paidAt = new Date();

    return this.prisma.clientInvoice.update({
      where: { id },
      data: updateData,
    });
  }
}
