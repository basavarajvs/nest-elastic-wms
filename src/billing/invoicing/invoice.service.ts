import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class InvoiceService {
  private readonly logger = new Logger(InvoiceService.name);

  constructor(private readonly prisma: PrismaService) {}

  async findAllInvoices(tenantId: string, query: any) {
    const { clientId, paymentStatus } = query;
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 50;
    const skip = (page - 1) * limit;
    const where: any = { tenant_id: tenantId };
    if (clientId) where.client_id = BigInt(clientId);
    if (paymentStatus) where.payment_status = paymentStatus;
    const [data, total] = await Promise.all([
      this.prisma.client_invoices.findMany({
        where,
        skip,
        take: limit,
        orderBy: { invoice_date: 'desc' },
        include: { client_invoice_lines: true, clients: true },
      }),
      this.prisma.client_invoices.count({ where }),
    ]);
    const cycleIds = [...new Set(data.map(d => d.billing_cycle_id).filter(Boolean))] as bigint[];
    const cycles = cycleIds.length
      ? await this.prisma.billing_cycles.findMany({
          where: { billing_cycle_id: { in: cycleIds } },
          select: { billing_cycle_id: true, cycle_name: true },
        })
      : [];
    const cycleMap = new Map(cycles.map(c => [c.billing_cycle_id.toString(), c.cycle_name]));
    return {
      data: data.map((d: any) => ({
        ...d,
        client_name: d.clients?.client_name ?? null,
        cycle_name: d.billing_cycle_id ? cycleMap.get(d.billing_cycle_id.toString()) ?? null : null,
      })),
      total, page, limit,
    };
  }

  async findInvoiceById(tenantId: string, invoiceId: bigint) {
    const inv = await this.prisma.client_invoices.findFirst({
      where: { tenant_id: tenantId, invoice_id: invoiceId },
      include: { client_invoice_lines: true, clients: true },
    });
    if (!inv) throw new NotFoundException('Invoice not found');
    let cycleName: string | null = null;
    if (inv.billing_cycle_id) {
      const cycle = await this.prisma.billing_cycles.findFirst({
        where: { billing_cycle_id: inv.billing_cycle_id },
        select: { cycle_name: true },
      });
      cycleName = cycle?.cycle_name ?? null;
    }
    return {
      ...inv,
      client_name: (inv as any).clients?.client_name ?? null,
      cycle_name: cycleName,
    };
  }

  /** Generate invoice: group charges by client, create invoice + lines */
  async generateInvoice(tenantId: string, clientId: bigint, billingCycleId: bigint) {
    const charges = await this.prisma.storage_charges.findMany({
      where: {
        tenant_id: tenantId,
        owner_client_id: clientId,
        billing_cycle_id: billingCycleId,
      },
    });

    if (charges.length === 0) {
      throw new BadRequestException('No charges found for this client/billing cycle');
    }

    const totalStorage = charges.reduce((s, c) => s + Number(c.charge_amount || 0), 0);

    return this.prisma.$transaction(async (tx: any) => {
      const invoice = await tx.client_invoices.create({
        data: {
          tenant_id: tenantId,
          client_id: clientId,
          billing_cycle_id: billingCycleId,
          invoice_date: new Date(),
          due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          total_storage_charges: totalStorage,
          total_amount: totalStorage,
          payment_status: 'OPEN',
        },
      });

      for (const charge of charges) {
        await tx.client_invoice_lines.create({
          data: {
            tenant_id: tenantId,
            invoice_id: invoice.invoice_id,
            line_type: 'STORAGE',
            description: `Storage ${charge.storage_start_date} - ${charge.storage_end_date || charge.storage_start_date}`,
            quantity: charge.days_in_storage,
            unit_rate: Number(charge.applicable_rate),
            line_amount: Number(charge.charge_amount),
            currency_code: charge.currency || 'USD',
          },
        });
      }

      return tx.client_invoices.findUnique({
        where: { invoice_id: invoice.invoice_id },
        include: { client_invoice_lines: true },
      });
    });
  }

  async delete(tenantId: string, invoiceId: bigint) {
    return this.prisma.client_invoices.deleteMany({
      where: { tenant_id: tenantId, invoice_id: invoiceId },
    });
  }
}
