-- CreateTable
CREATE TABLE "multitenant"."inventory_transfers" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "facility_id" UUID NOT NULL,
    "transfer_number" VARCHAR(50) NOT NULL,
    "transfer_type" "multitenant"."TransferType" NOT NULL DEFAULT 'INTRA_FACILITY',
    "status" "multitenant"."TransferStatus" NOT NULL DEFAULT 'DRAFT',
    "from_location_id" UUID,
    "to_location_id" UUID NOT NULL,
    "to_facility_id" UUID,
    "requested_by_user_id" UUID,
    "dispatched_by_user_id" UUID,
    "received_by_user_id" UUID,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "inventory_transfers_pkey" PRIMARY KEY ("id")
);


-- CreateTable
CREATE TABLE "multitenant"."inventory_transfer_lines" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "facility_id" UUID NOT NULL,
    "transfer_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "lot_id" UUID,
    "uom_id" UUID NOT NULL,
    "quantity_requested" DOUBLE PRECISION NOT NULL,
    "quantity_shipped" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "quantity_received" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" VARCHAR(20) NOT NULL DEFAULT 'REQUESTED',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "inventory_transfer_lines_pkey" PRIMARY KEY ("id")
);


-- CreateTable
CREATE TABLE "multitenant"."cycle_counts" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "facility_id" UUID NOT NULL,
    "count_number" VARCHAR(50) NOT NULL,
    "count_method" "multitenant"."CountMethod" NOT NULL DEFAULT 'BLIND',
    "status" "multitenant"."CountStatus" NOT NULL DEFAULT 'SCHEDULED',
    "scope_type" VARCHAR(20) NOT NULL,
    "scope_identifier" VARCHAR(50),
    "frequency_type" "multitenant"."CountFrequencyType" NOT NULL DEFAULT 'MANUAL',
    "assigned_to_user_id" UUID,
    "scheduled_date" TIMESTAMPTZ,
    "started_at" TIMESTAMPTZ,
    "completed_at" TIMESTAMPTZ,
    "auto_adjust" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "cycle_counts_pkey" PRIMARY KEY ("id")
);


-- CreateTable
CREATE TABLE "multitenant"."cycle_count_lines" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "facility_id" UUID NOT NULL,
    "count_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "location_id" UUID NOT NULL,
    "lot_id" UUID,
    "uom_id" UUID NOT NULL,
    "system_quantity" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "counted_quantity" DOUBLE PRECISION,
    "variance_quantity" DOUBLE PRECISION,
    "status" VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    "counted_by_user_id" UUID,
    "counted_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "cycle_count_lines_pkey" PRIMARY KEY ("id")
);


-- CreateTable
CREATE TABLE "multitenant"."adjustment_approvals" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "facility_id" UUID NOT NULL,
    "count_line_id" UUID,
    "transfer_line_id" UUID,
    "variance_value" DOUBLE PRECISION NOT NULL,
    "variance_qty" DOUBLE PRECISION NOT NULL,
    "approval_level" "multitenant"."ApprovalLevel" NOT NULL DEFAULT 'AUTO_APPROVED',
    "status" "multitenant"."ApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "threshold_version" VARCHAR(20),
    "requested_by_user_id" UUID NOT NULL,
    "assigned_to_user_id" UUID,
    "approved_by_user_id" UUID,
    "comments" TEXT,
    "rejection_reason" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "adjustment_approvals_pkey" PRIMARY KEY ("id")
);


-- CreateTable
CREATE TABLE "multitenant"."approval_threshold_configs" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "version" VARCHAR(20) NOT NULL,
    "auto_threshold" DOUBLE PRECISION NOT NULL,
    "supervisor_threshold" DOUBLE PRECISION NOT NULL,
    "manager_threshold" DOUBLE PRECISION NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "applied_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "approval_threshold_configs_pkey" PRIMARY KEY ("id")
);


-- CreateTable
CREATE TABLE "multitenant"."count_scheduler_metrics" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "run_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "generation_duration_ms" INTEGER NOT NULL,
    "success_rate" DOUBLE PRECISION NOT NULL,
    "total_generated" INTEGER NOT NULL,
    "failed_product_codes" JSON,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "count_scheduler_metrics_pkey" PRIMARY KEY ("id")
);


-- CreateTable
CREATE TABLE "multitenant"."system_setting_histories" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "setting_key" VARCHAR(100) NOT NULL,
    "old_value" JSON,
    "new_value" JSON,
    "changed_by" VARCHAR(100),
    "changed_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "system_setting_histories_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "resource_quotas_tenant_id_resource_type_key" ON "multitenant"."resource_quotas"("tenant_id", "resource_type");

-- CreateIndex
CREATE UNIQUE INDEX "warehouse_facilities_tenant_id_facility_code_key" ON "multitenant"."warehouse_facilities"("tenant_id", "facility_code");

-- CreateIndex
CREATE UNIQUE INDEX "warehouse_zones_tenant_id_facility_id_zone_code_key" ON "multitenant"."warehouse_zones"("tenant_id", "facility_id", "zone_code");

-- CreateIndex
CREATE INDEX "idx_sl_tenant_facility_zone" ON "multitenant"."storage_locations"("tenant_id", "facility_id", "zone_id");

-- CreateIndex
CREATE UNIQUE INDEX "storage_locations_tenant_id_facility_id_location_code_key" ON "multitenant"."storage_locations"("tenant_id", "facility_id", "location_code");

-- CreateIndex
CREATE INDEX "idx_pc_tenant_status" ON "multitenant"."product_categories"("tenant_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "product_categories_tenant_id_category_code_key" ON "multitenant"."product_categories"("tenant_id", "category_code");

-- CreateIndex
CREATE UNIQUE INDEX "units_of_measure_tenant_id_code_key" ON "multitenant"."units_of_measure"("tenant_id", "code");

-- CreateIndex
CREATE INDEX "idx_prod_tenant_active" ON "multitenant"."products"("tenant_id", "is_active");

-- CreateIndex
CREATE INDEX "idx_prod_velocity" ON "multitenant"."products"("tenant_id", "velocity_class");

-- CreateIndex
CREATE UNIQUE INDEX "products_tenant_id_product_code_key" ON "multitenant"."products"("tenant_id", "product_code");

-- CreateIndex
CREATE UNIQUE INDEX "product_barcodes_barcode_value_key" ON "multitenant"."product_barcodes"("barcode_value");

-- CreateIndex
CREATE INDEX "idx_pb_barcode_tenant" ON "multitenant"."product_barcodes"("barcode_value", "tenant_id");

-- CreateIndex
CREATE INDEX "idx_pb_tenant_active" ON "multitenant"."product_barcodes"("tenant_id", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "product_attributes_tenant_id_product_id_key_key" ON "multitenant"."product_attributes"("tenant_id", "product_id", "key");

-- CreateIndex
CREATE INDEX "idx_pij_tenant_status" ON "multitenant"."product_import_jobs"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "idx_pir_job_status" ON "multitenant"."product_import_results"("tenant_id", "job_id", "status");

-- CreateIndex
CREATE INDEX "idx_lot_fefo" ON "multitenant"."inventory_lots"("tenant_id", "product_id", "expiry_date");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_lots_tenant_id_facility_id_product_id_lot_number_key" ON "multitenant"."inventory_lots"("tenant_id", "facility_id", "product_id", "lot_number");

-- CreateIndex
CREATE INDEX "idx_onhand_product" ON "multitenant"."inventory_on_hand"("tenant_id", "facility_id", "product_id");

-- CreateIndex
CREATE INDEX "idx_onhand_location" ON "multitenant"."inventory_on_hand"("tenant_id", "facility_id", "location_id");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_on_hand_tenant_id_facility_id_product_id_location_key" ON "multitenant"."inventory_on_hand"("tenant_id", "facility_id", "product_id", "location_id", "lot_id");

-- CreateIndex
CREATE INDEX "idx_txn_product_time" ON "multitenant"."inventory_transactions"("tenant_id", "product_id", "transaction_at" DESC);

-- CreateIndex
CREATE INDEX "idx_txn_location" ON "multitenant"."inventory_transactions"("tenant_id", "location_id");

-- CreateIndex
CREATE INDEX "idx_txn_reference" ON "multitenant"."inventory_transactions"("tenant_id", "reference_type", "reference_id");

-- CreateIndex
CREATE INDEX "idx_hold_status" ON "multitenant"."inventory_holds"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "idx_hold_lot_status" ON "multitenant"."inventory_holds"("tenant_id", "lot_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_adjustments_tenant_id_facility_id_adjustment_numb_key" ON "multitenant"."inventory_adjustments"("tenant_id", "facility_id", "adjustment_number");

-- CreateIndex
CREATE INDEX "idx_adj_line_adjustment" ON "multitenant"."inventory_adjustment_lines"("tenant_id", "adjustment_id");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_policies_tenant_id_facility_id_product_id_locatio_key" ON "multitenant"."inventory_policies"("tenant_id", "facility_id", "product_id", "location_id");

-- CreateIndex
CREATE INDEX "idx_asn_status" ON "multitenant"."advance_ship_notices"("tenant_id", "facility_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "advance_ship_notices_tenant_id_facility_id_asn_number_key" ON "multitenant"."advance_ship_notices"("tenant_id", "facility_id", "asn_number");

-- CreateIndex
CREATE INDEX "idx_asnl_asn" ON "multitenant"."asn_lines"("tenant_id", "asn_id");

-- CreateIndex
CREATE INDEX "idx_grn_status" ON "multitenant"."goods_receipts"("tenant_id", "facility_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "goods_receipts_tenant_id_facility_id_receipt_number_key" ON "multitenant"."goods_receipts"("tenant_id", "facility_id", "receipt_number");

-- CreateIndex
CREATE INDEX "idx_grnl_receipt" ON "multitenant"."goods_receipt_lines"("tenant_id", "receipt_id");

-- CreateIndex
CREATE INDEX "idx_lpn_status" ON "multitenant"."license_plate_numbers"("tenant_id", "facility_id", "status");

-- CreateIndex
CREATE INDEX "idx_lpn_location" ON "multitenant"."license_plate_numbers"("tenant_id", "location_id");

-- CreateIndex
CREATE UNIQUE INDEX "license_plate_numbers_tenant_id_lpn_number_key" ON "multitenant"."license_plate_numbers"("tenant_id", "lpn_number");

-- CreateIndex
CREATE INDEX "idx_put_status" ON "multitenant"."putaway_tasks"("tenant_id", "facility_id", "status");

-- CreateIndex
CREATE INDEX "idx_put_assignee" ON "multitenant"."putaway_tasks"("tenant_id", "assigned_to_user_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "putaway_tasks_tenant_id_task_number_key" ON "multitenant"."putaway_tasks"("tenant_id", "task_number");

-- CreateIndex
CREATE INDEX "idx_so_status" ON "multitenant"."sales_orders"("tenant_id", "facility_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "sales_orders_tenant_id_facility_id_order_number_key" ON "multitenant"."sales_orders"("tenant_id", "facility_id", "order_number");

-- CreateIndex
CREATE INDEX "idx_sol_order" ON "multitenant"."sales_order_lines"("tenant_id", "order_id");

-- CreateIndex
CREATE INDEX "idx_alloc_product_status" ON "multitenant"."inventory_allocations"("tenant_id", "facility_id", "product_id", "status");

-- CreateIndex
CREATE INDEX "idx_alloc_order" ON "multitenant"."inventory_allocations"("tenant_id", "order_id", "order_line_id");

-- CreateIndex
CREATE INDEX "idx_wave_status" ON "multitenant"."picking_waves"("tenant_id", "facility_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "picking_waves_tenant_id_facility_id_wave_number_key" ON "multitenant"."picking_waves"("tenant_id", "facility_id", "wave_number");

-- CreateIndex
CREATE INDEX "idx_ptask_status" ON "multitenant"."picking_tasks"("tenant_id", "facility_id", "status");

-- CreateIndex
CREATE INDEX "idx_ptask_assignee" ON "multitenant"."picking_tasks"("tenant_id", "assigned_to_user_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "picking_tasks_tenant_id_task_number_key" ON "multitenant"."picking_tasks"("tenant_id", "task_number");

-- CreateIndex
CREATE INDEX "idx_psess_status" ON "multitenant"."packing_sessions"("tenant_id", "facility_id", "status");

-- CreateIndex
CREATE INDEX "idx_pcont_session" ON "multitenant"."packing_containers"("tenant_id", "session_id");

-- CreateIndex
CREATE UNIQUE INDEX "packing_containers_tenant_id_container_code_key" ON "multitenant"."packing_containers"("tenant_id", "container_code");

-- CreateIndex
CREATE INDEX "idx_oshp_status" ON "multitenant"."outbound_shipments"("tenant_id", "facility_id", "status");

-- CreateIndex
CREATE INDEX "idx_oshp_order" ON "multitenant"."outbound_shipments"("tenant_id", "order_id");

-- CreateIndex
CREATE UNIQUE INDEX "outbound_shipments_tenant_id_shipment_number_key" ON "multitenant"."outbound_shipments"("tenant_id", "shipment_number");

-- CreateIndex
CREATE INDEX "idx_trf_status" ON "multitenant"."inventory_transfers"("tenant_id", "facility_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_transfers_tenant_id_facility_id_transfer_number_key" ON "multitenant"."inventory_transfers"("tenant_id", "facility_id", "transfer_number");

-- CreateIndex
CREATE INDEX "idx_trfl_transfer" ON "multitenant"."inventory_transfer_lines"("tenant_id", "transfer_id");

-- CreateIndex
CREATE INDEX "idx_cc_status" ON "multitenant"."cycle_counts"("tenant_id", "facility_id", "status");

-- CreateIndex
CREATE INDEX "idx_cc_freq" ON "multitenant"."cycle_counts"("tenant_id", "facility_id", "frequency_type", "status");

-- CreateIndex
CREATE UNIQUE INDEX "cycle_counts_tenant_id_facility_id_count_number_key" ON "multitenant"."cycle_counts"("tenant_id", "facility_id", "count_number");

-- CreateIndex
CREATE INDEX "idx_ccl_count" ON "multitenant"."cycle_count_lines"("tenant_id", "count_id");

-- CreateIndex
CREATE INDEX "idx_ccl_product_status" ON "multitenant"."cycle_count_lines"("tenant_id", "facility_id", "product_id", "status");

-- CreateIndex
CREATE INDEX "idx_aa_status_level" ON "multitenant"."adjustment_approvals"("tenant_id", "facility_id", "status", "approval_level");

-- CreateIndex
CREATE INDEX "idx_threshold_active" ON "multitenant"."approval_threshold_configs"("tenant_id", "active");

-- CreateIndex
CREATE UNIQUE INDEX "approval_threshold_configs_tenant_id_version_key" ON "multitenant"."approval_threshold_configs"("tenant_id", "version");

-- CreateIndex
CREATE INDEX "idx_csm_run" ON "multitenant"."count_scheduler_metrics"("tenant_id", "run_at");

-- CreateIndex
CREATE INDEX "idx_ssh_key_time" ON "multitenant"."system_setting_histories"("tenant_id", "setting_key", "changed_at");

-- AddForeignKey
ALTER TABLE "multitenant"."warehouse_zones" ADD CONSTRAINT "warehouse_zones_facility_id_fkey" FOREIGN KEY ("facility_id") REFERENCES "multitenant"."warehouse_facilities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "multitenant"."storage_locations" ADD CONSTRAINT "storage_locations_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "multitenant"."storage_locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "multitenant"."storage_locations" ADD CONSTRAINT "storage_locations_zone_id_fkey" FOREIGN KEY ("zone_id") REFERENCES "multitenant"."warehouse_zones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "multitenant"."product_categories" ADD CONSTRAINT "product_categories_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "multitenant"."product_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "multitenant"."products" ADD CONSTRAINT "products_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "multitenant"."product_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "multitenant"."products" ADD CONSTRAINT "products_base_uom_id_fkey" FOREIGN KEY ("base_uom_id") REFERENCES "multitenant"."units_of_measure"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "multitenant"."product_barcodes" ADD CONSTRAINT "product_barcodes_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "multitenant"."products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "multitenant"."product_attributes" ADD CONSTRAINT "product_attributes_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "multitenant"."products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "multitenant"."product_import_results" ADD CONSTRAINT "product_import_results_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "multitenant"."product_import_jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "multitenant"."inventory_on_hand" ADD CONSTRAINT "inventory_on_hand_lot_id_fkey" FOREIGN KEY ("lot_id") REFERENCES "multitenant"."inventory_lots"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "multitenant"."inventory_adjustment_lines" ADD CONSTRAINT "inventory_adjustment_lines_adjustment_id_fkey" FOREIGN KEY ("adjustment_id") REFERENCES "multitenant"."inventory_adjustments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "multitenant"."asn_lines" ADD CONSTRAINT "asn_lines_asn_id_fkey" FOREIGN KEY ("asn_id") REFERENCES "multitenant"."advance_ship_notices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "multitenant"."goods_receipt_lines" ADD CONSTRAINT "goods_receipt_lines_receipt_id_fkey" FOREIGN KEY ("receipt_id") REFERENCES "multitenant"."goods_receipts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "multitenant"."license_plate_numbers" ADD CONSTRAINT "license_plate_numbers_grn_line_id_fkey" FOREIGN KEY ("grn_line_id") REFERENCES "multitenant"."goods_receipt_lines"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "multitenant"."license_plate_numbers" ADD CONSTRAINT "license_plate_numbers_parent_lpn_id_fkey" FOREIGN KEY ("parent_lpn_id") REFERENCES "multitenant"."license_plate_numbers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "multitenant"."sales_order_lines" ADD CONSTRAINT "sales_order_lines_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "multitenant"."sales_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "multitenant"."inventory_allocations" ADD CONSTRAINT "inventory_allocations_order_line_id_fkey" FOREIGN KEY ("order_line_id") REFERENCES "multitenant"."sales_order_lines"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "multitenant"."picking_tasks" ADD CONSTRAINT "picking_tasks_wave_id_fkey" FOREIGN KEY ("wave_id") REFERENCES "multitenant"."picking_waves"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "multitenant"."picking_tasks" ADD CONSTRAINT "picking_tasks_order_line_id_fkey" FOREIGN KEY ("order_line_id") REFERENCES "multitenant"."sales_order_lines"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "multitenant"."packing_containers" ADD CONSTRAINT "packing_containers_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "multitenant"."packing_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "multitenant"."inventory_transfer_lines" ADD CONSTRAINT "inventory_transfer_lines_transfer_id_fkey" FOREIGN KEY ("transfer_id") REFERENCES "multitenant"."inventory_transfers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "multitenant"."cycle_count_lines" ADD CONSTRAINT "cycle_count_lines_count_id_fkey" FOREIGN KEY ("count_id") REFERENCES "multitenant"."cycle_counts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


ALTER TABLE "multitenant"."inventory_transfer_lines" ADD CONSTRAINT "inventory_transfer_lines_transfer_id_fkey" FOREIGN KEY ("transfer_id") REFERENCES "multitenant"."inventory_transfers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "multitenant"."cycle_count_lines" ADD CONSTRAINT "cycle_count_lines_count_id_fkey" FOREIGN KEY ("count_id") REFERENCES "multitenant"."cycle_counts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Enable RLS
ALTER TABLE multitenant.inventory_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE multitenant.inventory_transfer_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE multitenant.cycle_counts ENABLE ROW LEVEL SECURITY;
ALTER TABLE multitenant.cycle_count_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE multitenant.adjustment_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE multitenant.approval_threshold_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE multitenant.count_scheduler_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE multitenant.system_setting_histories ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_trf_tenant ON multitenant.inventory_transfers (tenant_id);
CREATE INDEX IF NOT EXISTS idx_trfl_tenant ON multitenant.inventory_transfer_lines (tenant_id);
CREATE INDEX IF NOT EXISTS idx_cc_tenant ON multitenant.cycle_counts (tenant_id);
CREATE INDEX IF NOT EXISTS idx_ccl_tenant ON multitenant.cycle_count_lines (tenant_id);
CREATE INDEX IF NOT EXISTS idx_aa_tenant ON multitenant.adjustment_approvals (tenant_id);
CREATE INDEX IF NOT EXISTS idx_atc_tenant ON multitenant.approval_threshold_configs (tenant_id);
CREATE INDEX IF NOT EXISTS idx_csm_tenant ON multitenant.count_scheduler_metrics (tenant_id);
CREATE INDEX IF NOT EXISTS idx_ssh_tenant ON multitenant.system_setting_histories (tenant_id);

-- Policies
DO $$
DECLARE
  tables text[] := ARRAY['inventory_transfers', 'inventory_transfer_lines', 'cycle_counts', 'cycle_count_lines', 'adjustment_approvals', 'approval_threshold_configs', 'count_scheduler_metrics', 'system_setting_histories'];
  tbl text;
BEGIN
  FOREACH tbl IN ARRAY tables
  LOOP
    EXECUTE format('CREATE POLICY tenant_isolation_%1$s ON multitenant.%1$s FOR ALL USING (tenant_id = current_setting(''app.tenant_id'')::uuid);', tbl);
    EXECUTE format('CREATE POLICY tenant_insert_%1$s ON multitenant.%1$s FOR INSERT WITH CHECK (tenant_id = current_setting(''app.tenant_id'')::uuid);', tbl);
    EXECUTE format('CREATE POLICY tenant_update_%1$s ON multitenant.%1$s FOR UPDATE USING (tenant_id = current_setting(''app.tenant_id'')::uuid) WITH CHECK (tenant_id = current_setting(''app.tenant_id'')::uuid);', tbl);
    EXECUTE format('CREATE POLICY tenant_delete_%1$s ON multitenant.%1$s FOR DELETE USING (tenant_id = current_setting(''app.tenant_id'')::uuid);', tbl);
  END LOOP;
END $$;
