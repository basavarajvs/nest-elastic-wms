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
        run_type: dto.run_type,
        run_start_date: new Date(dto.run_start_date),
        run_end_date: new Date(dto.run_end_date),
        execution_status: 'PENDING',
        currency_code: dto.currency_code ?? 'USD',
      },
    });
  }

  async findAllBillingRuns(tenantId: string, query: any = {}) {
    const where: any = { tenant_id: tenantId };
    if (query.executionStatus) where.execution_status = query.executionStatus;
    if (query.runType) where.run_type = query.runType;

    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
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

    const nestedEvents = run.fulfillment_billing_run_events
      ?.map(re => re.fulfillment_billing_events)
      .filter(Boolean) || [];
    const enrichedMap = new Map(
      (await this.enrichBillingEvents(tenantId, nestedEvents)).map(e => [e.billing_event_id, e]),
    );

    return {
      ...run,
      fulfillment_billing_run_events: run.fulfillment_billing_run_events?.map(re => ({
        ...re,
        fulfillment_billing_events: enrichedMap.get(Number(re.fulfillment_billing_events?.billing_event_id)) || re.fulfillment_billing_events,
      })),
    };
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
        facility_id: BigInt(dto.facility_id),
        event_type: dto.event_type,
        event_category: dto.event_category,
        source_entity_type: dto.source_entity_type,
        source_entity_id: BigInt(dto.source_entity_id),
        source_entity_reference: dto.source_entity_reference,
        client_id: BigInt(dto.client_id),
        charge_amount: dto.charge_amount,
        charge_quantity: dto.charge_quantity,
        charge_rate: dto.charge_rate,
        currency_code: dto.currency_code ?? 'USD',
        charge_description: dto.charge_description,
        charge_details: dto.charge_details,
        billing_status: 'UNBILLED',
        event_date: new Date(dto.event_date),
      },
    });
  }

  async findAllBillingEvents(tenantId: string, query: any = {}) {
    const where: any = { tenant_id: tenantId };
    if (query.billingStatus) where.billing_status = query.billingStatus;
    if (query.eventType) where.event_type = query.eventType;
    if (query.clientId) where.client_id = BigInt(query.clientId);
    if (query.facilityId) where.facility_id = BigInt(query.facilityId);

    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const [data, total] = await Promise.all([
      this.prisma.fulfillment_billing_events.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { event_date: 'desc' },
      }),
      this.prisma.fulfillment_billing_events.count({ where }),
    ]);
    return { data: await this.enrichBillingEvents(tenantId, data), total, page, limit };
  }

  private async enrichBillingEvents(tenantId: string, events: any[]): Promise<any[]> {
    if (!events.length) return events;

    const facilityIds = [...new Set(events.map(e => e.facility_id).filter(Boolean))];
    const clientIds = [...new Set(events.map(e => e.client_id).filter(Boolean))];
    const billingRunIds = [...new Set(events.map(e => e.billing_run_id).filter(Boolean))];

    const [facilities, clients, billingRuns] = await Promise.all([
      facilityIds.length
        ? this.prisma.warehouse_facilities.findMany({ where: { tenant_id: tenantId, facility_id: { in: facilityIds } }, select: { facility_id: true, facility_name: true } })
        : [],
      clientIds.length
        ? this.prisma.clients.findMany({ where: { tenant_id: tenantId, client_id: { in: clientIds } }, select: { client_id: true, client_name: true } })
        : [],
      billingRunIds.length
        ? this.prisma.fulfillment_billing_runs.findMany({ where: { billing_run_id: { in: billingRunIds } }, select: { billing_run_id: true, run_number: true } })
        : [],
    ]);

    const facilityMap = new Map(facilities.map(f => [Number(f.facility_id), f.facility_name] as [number, string]));
    const clientMap = new Map(clients.map(c => [Number(c.client_id), c.client_name] as [number, string]));
    const billingRunMap = new Map(billingRuns.map(r => [Number(r.billing_run_id), r.run_number] as [number, string]));

    return events.map(event => ({
      ...event,
      facility_name: facilityMap.get(Number(event.facility_id)) || null,
      client_name: clientMap.get(Number(event.client_id)) || null,
      billing_run_number: billingRunMap.get(Number(event.billing_run_id)) || null,
    }));
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
