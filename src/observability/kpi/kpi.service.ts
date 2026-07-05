import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class KpiService {
  private readonly logger = new Logger(KpiService.name);
  constructor(private readonly prisma: PrismaService) {}

  async getDaily(tenantId: string, query: any) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 50;
    const offset = (page - 1) * limit;
    const conditions: string[] = ['tenant_id = $1::uuid'];
    const params: any[] = [tenantId];
    let idx = 2;

    if (query.facilityId) {
      conditions.push(`facility_id = $${idx}::bigint`);
      params.push(BigInt(query.facilityId));
      idx++;
    }
    if (query.dateFrom) {
      conditions.push(`metric_date >= $${idx}::date`);
      params.push(query.dateFrom);
      idx++;
    }
    if (query.dateTo) {
      conditions.push(`metric_date <= $${idx}::date`);
      params.push(query.dateTo);
      idx++;
    }

    const where = `WHERE ${conditions.join(' AND ')}`;
    const table = 'multitenant.daily_kpi_metrics';

    const countResult = await this.prisma.$queryRawUnsafe<
      Record<string, any>[]
    >(`SELECT COUNT(*) AS total FROM ${table} ${where}`, ...params);

    const rows = await this.prisma.$queryRawUnsafe<Record<string, any>[]>(
      `SELECT * FROM ${table} ${where}
       ORDER BY metric_date DESC
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

  async getSummary(tenantId: string, query: any) {
    const conditions: string[] = ['tenant_id = $1::uuid'];
    const params: any[] = [tenantId];
    let idx = 2;

    if (query.facilityId) {
      conditions.push(`facility_id = $${idx}::bigint`);
      params.push(BigInt(query.facilityId));
      idx++;
    }
    if (query.dateFrom) {
      conditions.push(`metric_date >= $${idx}::date`);
      params.push(query.dateFrom);
      idx++;
    }
    if (query.dateTo) {
      conditions.push(`metric_date <= $${idx}::date`);
      params.push(query.dateTo);
      idx++;
    }

    const where = `WHERE ${conditions.join(' AND ')}`;

    const [row] = await this.prisma.$queryRawUnsafe<Record<string, any>[]>(
      `SELECT
         SUM(COALESCE(asns_received, 0)) AS asns_received,
         SUM(COALESCE(orders_shipped, 0)) AS orders_shipped,
         SUM(COALESCE(units_shipped, 0)) AS units_shipped,
         SUM(COALESCE(picking_tasks_completed, 0)) AS picking_tasks_completed,
         SUM(COALESCE(packing_tasks_completed, 0)) AS packing_tasks_completed,
         SUM(COALESCE(total_inventory_units, 0)) AS total_inventory_units,
         SUM(COALESCE(total_inventory_value, 0)) AS total_inventory_value,
         AVG(COALESCE(location_utilization_pct, 0)) AS location_utilization_pct,
         AVG(COALESCE(order_fill_rate_pct, 0)) AS order_fill_rate_pct,
         AVG(COALESCE(on_time_shipment_rate_pct, 0)) AS on_time_shipment_rate_pct,
         AVG(COALESCE(inventory_accuracy_pct, 0)) AS inventory_accuracy_pct,
         SUM(COALESCE(total_charges_generated, 0)) AS total_charges_generated
       FROM multitenant.daily_kpi_metrics ${where}`,
      ...params,
    );

    if (!row) return [];

    const metricMapping: Record<string, string> = {
      asns_received: 'asns_received',
      orders_shipped: 'orders_shipped',
      units_shipped: 'units_shipped',
      picking_tasks_completed: 'picking_tasks_completed',
      packing_tasks_completed: 'packing_tasks_completed',
      total_inventory_units: 'total_inventory_units',
      total_inventory_value: 'total_inventory_value',
      location_utilization_pct: 'location_utilization_pct',
      order_fill_rate_pct: 'order_fill_rate_pct',
      on_time_shipment_rate_pct: 'on_time_shipment_rate_pct',
      inventory_accuracy_pct: 'inventory_accuracy_pct',
      total_charges_generated: 'total_charges_generated',
    };

    return Object.entries(metricMapping).map(([key, label]) => ({
      metric_name: label,
      total_value: Number(row[key] ?? 0),
    }));
  }

  async computeDailyKpis(tenantId: string, facilityId: bigint | number) {
    const sql = `
      WITH
      asns AS (
        SELECT COUNT(*)::int AS cnt
        FROM multitenant.advance_ship_notices
        WHERE tenant_id = $1::uuid AND facility_id = $2::bigint
          AND created_at::date = CURRENT_DATE
      ),
      shipped_orders AS (
        SELECT COUNT(*)::int AS cnt
        FROM multitenant.sales_orders
        WHERE tenant_id = $1::uuid AND facility_id = $2::bigint
          AND status = 'SHIPPED' AND updated_at::date = CURRENT_DATE
      ),
      released_orders AS (
        SELECT COUNT(*)::int AS cnt
        FROM multitenant.sales_orders
        WHERE tenant_id = $1::uuid AND facility_id = $2::bigint
          AND status = 'RELEASED' AND updated_at::date = CURRENT_DATE
      ),
      units_shipped_today AS (
        SELECT COALESCE(SUM(osi.quantity_shipped), 0)::numeric(12,3) AS total
        FROM multitenant.outbound_shipment_items osi
        JOIN multitenant.outbound_shipments os
          ON os.shipment_id = osi.shipment_id AND os.tenant_id = osi.tenant_id
        WHERE osi.tenant_id = $1::uuid AND osi.facility_id = $2::bigint
          AND os.shipped_date::date = CURRENT_DATE
      ),
      picking AS (
        SELECT COUNT(*)::int AS cnt
        FROM multitenant.picking_tasks
        WHERE tenant_id = $1::uuid AND facility_id = $2::bigint
          AND status = 'COMPLETED' AND updated_at::date = CURRENT_DATE
      ),
      packing AS (
        SELECT COUNT(*)::int AS cnt
        FROM multitenant.packing_sessions
        WHERE tenant_id = $1::uuid AND facility_id = $2::bigint
          AND status = 'PACKING_COMPLETED' AND updated_at::date = CURRENT_DATE
      ),
      inventory AS (
        SELECT
          COALESCE(SUM(ioh.quantity_on_hand), 0)::numeric(12,3) AS total_units,
          COALESCE(SUM(ioh.quantity_on_hand * COALESCE(p.cost_price, 0)), 0)::numeric(15,2) AS total_value,
          COUNT(DISTINCT ioh.location_id)::int AS occupied_locations
        FROM multitenant.inventory_on_hand ioh
        LEFT JOIN multitenant.products p
          ON p.product_id = ioh.product_id AND p.tenant_id = ioh.tenant_id
        WHERE ioh.tenant_id = $1::uuid AND ioh.facility_id = $2::bigint
          AND ioh.quantity_on_hand > 0
      ),
      locs AS (
        SELECT COUNT(*)::int AS total
        FROM multitenant.storage_locations
        WHERE tenant_id = $1::uuid AND facility_id = $2::bigint
          AND is_active = true
      ),
      ontime AS (
        SELECT
          COUNT(*)::int AS total_shipped,
          COUNT(*) FILTER (
            WHERE shipped_date <= scheduled_ship_date OR scheduled_ship_date IS NULL
          )::int AS on_time
        FROM multitenant.outbound_shipments
        WHERE tenant_id = $1::uuid AND facility_id = $2::bigint
          AND status = 'SHIPPED' AND shipped_date::date = CURRENT_DATE
      ),
      accuracy AS (
        SELECT AVG(overall_accuracy_percentage)::numeric(5,2) AS avg_acc
        FROM multitenant.cycle_count_metrics
        WHERE tenant_id = $1::uuid AND facility_id = $2::bigint
          AND metric_date = CURRENT_DATE
      )
      SELECT
        (SELECT cnt FROM asns) AS asns_received,
        (SELECT cnt FROM shipped_orders) AS orders_shipped,
        (SELECT total FROM units_shipped_today) AS units_shipped,
        (SELECT cnt FROM picking) AS picking_tasks_completed,
        (SELECT cnt FROM packing) AS packing_tasks_completed,
        (SELECT total_units FROM inventory) AS total_inventory_units,
        (SELECT total_value FROM inventory) AS total_inventory_value,
        (SELECT occupied_locations FROM inventory) AS inventory_locations_occupied,
        (SELECT total FROM locs) AS inventory_locations_available,
        CASE
          WHEN (SELECT total FROM locs) > 0
          THEN ((SELECT occupied_locations FROM inventory)::numeric / (SELECT total FROM locs) * 100)::numeric(5,2)
          ELSE 0::numeric(5,2)
        END AS location_utilization_pct,
        CASE
          WHEN (SELECT cnt FROM released_orders) > 0
          THEN ((SELECT cnt FROM shipped_orders)::numeric / (SELECT cnt FROM released_orders) * 100)::numeric(5,2)
          ELSE 0::numeric(5,2)
        END AS order_fill_rate_pct,
        CASE
          WHEN (SELECT total_shipped FROM ontime) > 0
          THEN ((SELECT on_time FROM ontime)::numeric / (SELECT total_shipped FROM ontime) * 100)::numeric(5,2)
          ELSE 0::numeric(5,2)
        END AS on_time_shipment_rate_pct,
        COALESCE((SELECT avg_acc FROM accuracy), 0)::numeric(5,2) AS inventory_accuracy_pct
    `;

    const [metrics] = await this.prisma.$queryRawUnsafe<Record<string, any>[]>(
      sql,
      tenantId,
      facilityId,
    );

    await this.prisma.$executeRawUnsafe(
      `INSERT INTO multitenant.daily_kpi_metrics
       (tenant_id, facility_id, metric_date, asns_received, orders_shipped, units_shipped,
        picking_tasks_completed, packing_tasks_completed,
        total_inventory_units, total_inventory_value,
        inventory_locations_occupied, inventory_locations_available,
        location_utilization_pct, order_fill_rate_pct, on_time_shipment_rate_pct,
        inventory_accuracy_pct, calculated_at)
       VALUES ($1::uuid, $2::bigint, CURRENT_DATE,
         $3::int, $4::int, $5::numeric,
         $6::int, $7::int,
         $8::numeric, $9::numeric,
         $10::int, $11::int,
         $12::numeric, $13::numeric, $14::numeric,
         $15::numeric, NOW())
       ON CONFLICT (tenant_id, facility_id, metric_date)
       DO UPDATE SET
         asns_received = EXCLUDED.asns_received,
         orders_shipped = EXCLUDED.orders_shipped,
         units_shipped = EXCLUDED.units_shipped,
         picking_tasks_completed = EXCLUDED.picking_tasks_completed,
         packing_tasks_completed = EXCLUDED.packing_tasks_completed,
         total_inventory_units = EXCLUDED.total_inventory_units,
         total_inventory_value = EXCLUDED.total_inventory_value,
         inventory_locations_occupied = EXCLUDED.inventory_locations_occupied,
         inventory_locations_available = EXCLUDED.inventory_locations_available,
         location_utilization_pct = EXCLUDED.location_utilization_pct,
         order_fill_rate_pct = EXCLUDED.order_fill_rate_pct,
         on_time_shipment_rate_pct = EXCLUDED.on_time_shipment_rate_pct,
         inventory_accuracy_pct = EXCLUDED.inventory_accuracy_pct,
         calculated_at = NOW()`,
      tenantId,
      facilityId,
      metrics.asns_received,
      metrics.orders_shipped,
      metrics.units_shipped,
      metrics.picking_tasks_completed,
      metrics.packing_tasks_completed,
      metrics.total_inventory_units,
      metrics.total_inventory_value,
      metrics.inventory_locations_occupied,
      metrics.inventory_locations_available,
      metrics.location_utilization_pct,
      metrics.order_fill_rate_pct,
      metrics.on_time_shipment_rate_pct,
      metrics.inventory_accuracy_pct,
    );

    this.logger.log(
      `KPIs computed for tenant=${tenantId} facility=${facilityId} date=${new Date().toISOString().slice(0, 10)}`,
    );

    return metrics;
  }

  @Cron('0 3 * * *')
  async computeAllDailyKpis() {
    this.logger.log('Starting daily KPI computation for all tenants...');

    const tenants = await this.prisma.$queryRawUnsafe<
      { tenant_id: string; facility_id: bigint }[]
    >(
      `SELECT DISTINCT ioh.tenant_id, ioh.facility_id
       FROM multitenant.inventory_on_hand ioh
       UNION
       SELECT DISTINCT wf.tenant_id, wf.facility_id
       FROM multitenant.warehouse_facilities wf
       WHERE wf.is_active = true`,
    );

    let successCount = 0;
    let failCount = 0;

    for (const row of tenants) {
      try {
        await this.computeDailyKpis(row.tenant_id, row.facility_id);
        successCount++;
      } catch (err) {
        failCount++;
        this.logger.error(
          `KPI computation failed for tenant=${row.tenant_id} facility=${row.facility_id}`,
          err instanceof Error ? err.message : err,
        );
      }
    }

    this.logger.log(
      `Daily KPI computation complete: ${successCount} succeeded, ${failCount} failed`,
    );
  }
}
