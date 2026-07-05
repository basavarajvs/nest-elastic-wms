import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FulfillmentBillingService {
  private readonly logger = new Logger(FulfillmentBillingService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ─── Billing Runs ──────────────────────────────────────────────────

  async createBillingRun(tenantId: string, dto: any) {
    const runNumber = await this.generateRunNumber(dto.runStartDate);

    return this.prisma.fulfillment_billing_runs.create({
      data: {
        tenant_id: tenantId,
        run_number: runNumber,
        run_type: dto.runType,
        run_start_date: new Date(dto.runStartDate),
        run_end_date: new Date(dto.runEndDate),
        execution_status: 'PENDING',
        currency_code: dto.currencyCode ?? 'USD',
      },
    });
  }

  async findAllBillingRuns(tenantId: string, query: any = {}) {
    const where: any = { tenant_id: tenantId };
    if (query.executionStatus) where.execution_status = query.executionStatus;
    if (query.runType) where.run_type = query.runType;

    const page = query.page || 1;
    const limit = query.limit || 20;
    const [data, total] = await Promise.all([
      this.prisma.fulfillment_billing_runs.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: {
          _count: { select: { fulfillment_billing_run_events: true } },
        },
      }),
      this.prisma.fulfillment_billing_runs.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async findBillingRunById(tenantId: string, id: bigint) {
    const run = await this.prisma.fulfillment_billing_runs.findFirst({
      where: { tenant_id: tenantId, billing_run_id: id },
      include: {
        fulfillment_billing_run_events: {
          include: { fulfillment_billing_events: true },
        },
      },
    });
    if (!run) throw new NotFoundException('Billing run not found');
    return run;
  }

  async updateBillingRunStatus(tenantId: string, id: bigint, status: string) {
    await this.findBillingRunById(tenantId, id);
    return this.prisma.fulfillment_billing_runs.update({
      where: { billing_run_id: id },
      data: { execution_status: status },
    });
  }

  async delete(tenantId: string, id: bigint) {
    return this.prisma.fulfillment_billing_runs.deleteMany({
      where: { tenant_id: tenantId, billing_run_id: id },
    });
  }

  // ─── Billing Events ────────────────────────────────────────────────

  async createBillingEvent(tenantId: string, dto: any) {
    return this.prisma.fulfillment_billing_events.create({
      data: {
        tenant_id: tenantId,
        facility_id: BigInt(dto.facilityId),
        event_type: dto.eventType,
        event_category: dto.eventCategory,
        source_entity_type: dto.sourceEntityType,
        source_entity_id: BigInt(dto.sourceEntityId),
        source_entity_reference: dto.sourceEntityReference,
        client_id: BigInt(dto.clientId),
        charge_amount: dto.chargeAmount,
        charge_quantity: dto.chargeQuantity,
        charge_rate: dto.chargeRate,
        currency_code: dto.currencyCode ?? 'USD',
        charge_description: dto.chargeDescription,
        charge_details: dto.chargeDetails,
        billing_status: 'UNBILLED',
        event_date: new Date(dto.eventDate),
      },
    });
  }

  async findAllBillingEvents(tenantId: string, query: any = {}) {
    const where: any = { tenant_id: tenantId };
    if (query.billingStatus) where.billing_status = query.billingStatus;
    if (query.eventType) where.event_type = query.eventType;
    if (query.clientId) where.client_id = BigInt(query.clientId);
    if (query.facilityId) where.facility_id = BigInt(query.facilityId);

    const page = query.page || 1;
    const limit = query.limit || 20;
    const [data, total] = await Promise.all([
      this.prisma.fulfillment_billing_events.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { event_date: 'desc' },
      }),
      this.prisma.fulfillment_billing_events.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  // ─── Link Events to Run ────────────────────────────────────────────

  async linkEventsToRun(tenantId: string, billingRunId: bigint, eventIds: bigint[]) {
    const run = await this.findBillingRunById(tenantId, billingRunId);
    if (run.execution_status === 'COMPLETED') {
      throw new Error('Cannot link events to a completed billing run');
    }

    const links = eventIds.map((eventId) => ({
      billing_run_id: billingRunId,
      billing_event_id: eventId,
    }));

    await this.prisma.fulfillment_billing_run_events.createMany({
      data: links,
      skipDuplicates: true,
    });

    await this.prisma.fulfillment_billing_events.updateMany({
      where: { billing_event_id: { in: eventIds }, tenant_id: tenantId },
      data: {
        billing_status: 'BILLED',
        billing_run_id: billingRunId,
        billed_at: new Date(),
      },
    });

    const totalAmount = await this.calculateRunTotal(tenantId, billingRunId);
    await this.prisma.fulfillment_billing_runs.update({
      where: { billing_run_id: billingRunId },
      data: { total_amount: totalAmount },
    });

    return { linked: links.length };
  }

  // ─── Calculate Charges ─────────────────────────────────────────────

  async calculateRunTotal(tenantId: string, billingRunId: bigint) {
    const result = await this.prisma.fulfillment_billing_events.aggregate({
      where: {
        tenant_id: tenantId,
        billing_run_id: billingRunId,
      },
      _sum: { charge_amount: true },
    });
    return result._sum.charge_amount ?? 0;
  }

  async calculateEventCharges(tenantId: string, query: any = {}) {
    const where: any = { tenant_id: tenantId };
    if (query.clientId) where.client_id = BigInt(query.clientId);
    if (query.eventType) where.event_type = query.eventType;
    if (query.dateFrom || query.dateTo) {
      where.event_date = {};
      if (query.dateFrom) where.event_date.gte = new Date(query.dateFrom);
      if (query.dateTo) where.event_date.lte = new Date(query.dateTo);
    }

    return this.prisma.fulfillment_billing_events.aggregate({
      where,
      _sum: { charge_amount: true, charge_quantity: true },
      _count: true,
    });
  }

  // ─── Helpers ───────────────────────────────────────────────────────

  private async generateRunNumber(runStartDate: string | Date): Promise<string> {
    const date = new Date(runStartDate);
    const datePart = date.toISOString().slice(0, 10).replace(/-/g, '');

    const lastRun = await this.prisma.fulfillment_billing_runs.findFirst({
      where: { run_number: { startsWith: `BILL-${datePart}-` } },
      orderBy: { run_number: 'desc' },
    });

    let seq = 1;
    if (lastRun) {
      const parts = lastRun.run_number.split('-');
      seq = parseInt(parts[parts.length - 1], 10) + 1;
    }

    return `BILL-${datePart}-${String(seq).padStart(3, '0')}`;
  }
}
