import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export const EVENT_TYPES = {
  INVENTORY_ADJUSTMENT: 'INVENTORY_ADJUSTMENT',
  ORDER_SHIPPED: 'ORDER_SHIPPED',
  ORDER_RECEIVED: 'ORDER_RECEIVED',
  PUTAWAY_COMPLETED: 'PUTAWAY_COMPLETED',
  PICK_COMPLETED: 'PICK_COMPLETED',
  PACK_COMPLETED: 'PACK_COMPLETED',
  CYCLE_COUNT_COMPLETED: 'CYCLE_COUNT_COMPLETED',
  HOLD_PLACED: 'HOLD_PLACED',
  HOLD_RELEASED: 'HOLD_RELEASED',
  QC_FAILED: 'QC_FAILED',
  EXCEPTION_RAISED: 'EXCEPTION_RAISED',
  EQUIPMENT_MAINTENANCE: 'EQUIPMENT_MAINTENANCE',
  TRANSFER_DISPATCHED: 'TRANSFER_DISPATCHED',
  TRANSFER_RECEIVED: 'TRANSFER_RECEIVED',
} as const;

export type EventType = (typeof EVENT_TYPES)[keyof typeof EVENT_TYPES];

export interface EmitEventInput {
  tenantId: string;
  facilityId: bigint | number;
  eventType: string;
  severity?: string;
  relatedObjectType?: string;
  relatedObjectId?: bigint | number;
  description: string;
  metadata?: Record<string, any>;
}

@Injectable()
export class EventService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(tenantId: string, query: any) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 50;
    const offset = (page - 1) * limit;
    const conditions: string[] = ['we.tenant_id = $1::uuid'];
    const params: any[] = [tenantId];
    let idx = 2;

    if (query.eventType) {
      conditions.push(`we.event_type = $${idx}`);
      params.push(query.eventType);
      idx++;
    }
    if (query.severity) {
      conditions.push(`we.severity = $${idx}`);
      params.push(query.severity);
      idx++;
    }
    if (query.relatedObjectType) {
      conditions.push(`we.related_object_type = $${idx}`);
      params.push(query.relatedObjectType);
      idx++;
    }
    if (query.dateFrom) {
      conditions.push(`we.created_at >= $${idx}::timestamp`);
      params.push(query.dateFrom);
      idx++;
    }
    if (query.dateTo) {
      conditions.push(`we.created_at <= $${idx}::timestamp`);
      params.push(query.dateTo);
      idx++;
    }

    const where = `WHERE ${conditions.join(' AND ')}`;
    const table = 'multitenant.warehouse_events';

    const countResult = await this.prisma.$queryRawUnsafe<
      Record<string, any>[]
    >(`SELECT COUNT(*) AS total FROM ${table} we ${where}`, ...params);

    const rows = await this.prisma.$queryRawUnsafe<Record<string, any>[]>(
      `SELECT we.*, wf.facility_name FROM ${table} we
       LEFT JOIN multitenant.warehouse_facilities wf ON we.facility_id = wf.facility_id AND we.tenant_id = wf.tenant_id
       ${where}
       ORDER BY we.created_at DESC
       LIMIT $${idx} OFFSET $${idx + 1}`,
      ...params,
      limit,
      offset,
    );

    return {
      data: rows,
      total: Number(countResult[0]?.total || 0),
      page,
      limit,
    };
  }

  async delete(tenantId: string, id: bigint) {
    const entity = await this.findById(tenantId, id);
    await this.prisma.$executeRawUnsafe(
      `DELETE FROM multitenant.warehouse_events WHERE event_id = $2::bigint AND tenant_id = $1::uuid`,
      tenantId, id,
    );
    return entity;
  }

  async findById(tenantId: string, id: bigint) {
    const rows = await this.prisma.$queryRawUnsafe<Record<string, any>[]>(
      `SELECT we.*, wf.facility_name FROM multitenant.warehouse_events we
       LEFT JOIN multitenant.warehouse_facilities wf ON we.facility_id = wf.facility_id AND we.tenant_id = wf.tenant_id
       WHERE we.tenant_id = $1::uuid AND we.event_id = $2::bigint`,
      tenantId,
      id,
    );
    return rows.length ? rows[0] : null;
  }

  async emit(
    tenantId: string,
    facilityId: bigint | number,
    eventType: string,
    severity: string,
    relatedObjectType: string | null,
    relatedObjectId: bigint | number | null,
    description: string,
    metadata?: Record<string, any> | null,
  ) {
    const notes = metadata ? JSON.stringify(metadata) : null;
    const [row] = await this.prisma.$queryRawUnsafe<Record<string, any>[]>(
      `INSERT INTO multitenant.warehouse_events
       (tenant_id, facility_id, event_type, severity, related_object_type, related_object_id, description, notes, created_at)
       VALUES ($1::uuid, $2::bigint, $3::varchar, $4::varchar, $5::varchar, $6::bigint, $7::text, $8::text, NOW())
       RETURNING *`,
      tenantId,
      facilityId,
      eventType,
      severity,
      relatedObjectType,
      relatedObjectId,
      description,
      notes,
    );
    return row;
  }

  async emitFromMany(events: EmitEventInput[]) {
    if (!events.length) return [];

    const values = events.map((e, i) => {
      const base = i * 8;
      return `($${base + 1}::uuid, $${base + 2}::bigint, $${base + 3}::varchar, $${base + 4}::varchar, $${base + 5}::varchar, $${base + 6}::bigint, $${base + 7}::text, $${base + 8}::text, NOW())`;
    });

    const params: any[] = [];
    for (const e of events) {
      params.push(
        e.tenantId,
        e.facilityId,
        e.eventType,
        e.severity ?? null,
        e.relatedObjectType ?? null,
        e.relatedObjectId ?? null,
        e.description,
        e.metadata ? JSON.stringify(e.metadata) : null,
      );
    }

    return this.prisma.$queryRawUnsafe<Record<string, any>[]>(
      `INSERT INTO multitenant.warehouse_events
       (tenant_id, facility_id, event_type, severity, related_object_type, related_object_id, description, notes, created_at)
       VALUES ${values.join(', ')}
       RETURNING *`,
      ...params,
    );
  }
}
