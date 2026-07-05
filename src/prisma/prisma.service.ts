import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { TenantContextService } from '../common/context/tenant-context.service';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  constructor(private readonly tenantContext: TenantContextService) {
    super();
  }

  async onModuleInit() {
    await this.$connect();
    this.$use(async (params, next) => {
      const store = this.tenantContext.get();
      const start = Date.now();

      if (store && store.tenantId && !store.isSystemContext && this.hasTenantId(params.model)) {
        const tenantId = store.tenantId;

        this.injectTenantIdIntoCreate(params, tenantId);
        this.injectTenantIdIntoWhere(params, tenantId);
      }

      try {
        const result = await next(params);
        const elapsed = Date.now() - start;
        if (elapsed > 100) {
          this.logger.warn(
            `Slow query [${elapsed}ms] ${params.model}.${params.action}`,
          );
        }
        return result;
      } catch (err) {
        const elapsed = Date.now() - start;
        this.logger.error(
          `Query failed [${elapsed}ms] ${params.model}.${params.action}: ${(err as Error).message}`,
        );
        throw err;
      }
    });
  }

  private injectTenantIdIntoCreate(params: any, tenantId: string): void {
    if (params.action === 'create' && params.args?.data) {
      if (!params.args.data.tenantId) {
        params.args.data.tenantId = tenantId;
      }
      return;
    }

    if (params.action === 'createMany' && params.args?.data) {
      const data = params.args.data;
      if (Array.isArray(data)) {
        for (const item of data) {
          if (!item.tenantId) item.tenantId = tenantId;
        }
      }
      return;
    }

    if (params.action === 'upsert' && params.args?.create) {
      if (!params.args.create.tenantId) {
        params.args.create.tenantId = tenantId;
      }
    }
  }

  private injectTenantIdIntoWhere(params: any, tenantId: string): void {
    if (!params.args?.where) return;

    const uniqueActions = ['findUnique', 'update', 'delete', 'upsert'];
    const bulkActions = ['findFirst', 'findMany', 'count', 'aggregate', 'updateMany', 'deleteMany'];

    if (bulkActions.includes(params.action)) {
      params.args.where = { ...params.args.where, tenantId };
      return;
    }

    if (
      uniqueActions.includes(params.action) &&
      !params.args.where.id &&
      !params.args.where.tenantId
    ) {
      params.args.where.tenantId = tenantId;
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  hasTenantId(model: string | undefined): boolean {
    if (!model) return false;
    return allTenantModels.has(model);
  }
}

const allTenantModels = new Set<string>([
  'adjustment_approval_requests',
  'advance_ship_notices',
  'aisles',
  'asn_import_documents',
  'asn_import_jobs',
  'asn_import_results',
  'asn_lines',
  'barcode_labels',
  'bays',
  'billing_cycles',
  'carriers',
  'charge_calculation_rules',
  'client_addresses',
  'client_contacts',
  'client_facility_assignments',
  'client_invoice_lines',
  'client_invoices',
  'clients',
  'compliance_audits',
  'compliance_requirements',
  'count_accuracy_history',
  'cross_dock_operations',
  'customer_return_items',
  'customer_returns',
  'customers',
  'cycle_count_metrics',
  'daily_kpi_metrics',
  'dock_appointments',
  'equipment_maintenance',
  'exception_comments',
  'exception_escalation_rules',
  'exception_management',
  'facility_access_control',
  'facility_user_assignments',
  'fulfillment_billing_events',
  'fulfillment_billing_run_events',
  'fulfillment_billing_runs',
  'fulfillment_workflow_definitions',
  'fulfillment_workflow_events',
  'fulfillment_workflow_executions',
  'fulfillment_workflow_transitions',
  'goods_receipt_items',
  'goods_receipt_lines',
  'goods_receipts',
  'hazmat_materials',
  'inventory_adjustment_lines',
  'inventory_adjustments',
  'inventory_allocation_rule_constraints',
  'inventory_allocation_rule_locations',
  'inventory_allocation_rules',
  'inventory_allocations',
  'inventory_count_lines',
  'inventory_counts',
  'inventory_holds',
  'inventory_items',
  'inventory_lots',
  'inventory_on_hand',
  'inventory_policies',
  'inventory_reservations',
  'inventory_transactions',
  'labor_performance_metrics',
  'labor_shift_assignments',
  'labor_shifts',
  'labor_time_logs',
  'license_plate_numbers',
  'loading_docks',
  'load_shipments',
  'loads',
  'location_pick_heatmap',
  'lpn_transactions',
  'non_conformance_reports',
  'outbound_shipment_items',
  'outbound_shipments',
  'packing_containers',
  'packing_materials',
  'packing_session_status_history',
  'packing_sessions',
  'packing_slip_items',
  'packing_slips',
  'packing_stations',
  'picking_tasks',
  'picking_waves',
  'product_attributes',
  'product_barcodes',
  'product_brands',
  'product_categories',
  'product_client_assignments',
  'product_import_jobs',
  'product_import_results',
  'product_packaging_hierarchy',
  'product_suppliers',
  'product_variants',
  'product_velocity_classification',
  'products',
  'purchase_order_lines',
  'purchase_orders',
  'putaway_rules',
  'putaway_tasks',
  'quality_holds',
  'quality_inspection_events',
  'quality_inspection_results',
  'quality_inspections',
  'rack_levels',
  'rack_rows',
  'replenishment_rules',
  'replenishment_tasks',
  'sales_order_lines',
  'sales_orders',
  'shipment_status_history',
  'shipping_labels',
  'storage_billing_cycles',
  'storage_charges',
  'storage_inventory_snapshots',
  'storage_locations',
  'storage_rate_master',
  'storage_rates',
  'storage_vas_invoice_lines',
  'storage_vas_invoices',
  'system_audit_log',
  'units_of_measure',
  'variance_investigations',
  'vas_execution_charges',
  'vas_execution_tasks',
  'vas_service_catalog',
  'vas_service_client_rates',
  'vas_services',
  'vas_task_events',
  'vas_transactions',
  'vas_workstations',
  'vendor_addresses',
  'vendor_contacts',
  'vendors',
  'warehouse_equipment',
  'warehouse_events',
  'warehouse_facilities',
  'warehouse_zones',
  'wave_orders',
  'work_order_components',
  'work_order_operations',
  'work_orders',
  'yard_vehicles',
]);
