-- CreateTable
CREATE TABLE "multitenant"."advance_ship_notices" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "facility_id" UUID NOT NULL,
    "asn_number" VARCHAR(50) NOT NULL,
    "vendor_id" UUID,
    "po_number" VARCHAR(50),
    "status" "multitenant"."AsnStatus" NOT NULL DEFAULT 'CREATED',
    "carrier_name" VARCHAR(100),
    "tracking_number" VARCHAR(100),
    "expected_arrival_date" TIMESTAMPTZ,
    "actual_arrival_date" TIMESTAMPTZ,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "advance_ship_notices_pkey" PRIMARY KEY ("id")
);


-- CreateTable
CREATE TABLE "multitenant"."asn_lines" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "facility_id" UUID NOT NULL,
    "asn_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "expected_quantity" DOUBLE PRECISION NOT NULL,
    "received_quantity" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "uom_id" UUID NOT NULL,
    "lot_number" VARCHAR(100),
    "expiry_date" DATE,
    "status" VARCHAR(20) NOT NULL DEFAULT 'OPEN',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "asn_lines_pkey" PRIMARY KEY ("id")
);


-- CreateTable
CREATE TABLE "multitenant"."goods_receipts" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "facility_id" UUID NOT NULL,
    "receipt_number" VARCHAR(50) NOT NULL,
    "asn_number" VARCHAR(50),
    "po_number" VARCHAR(50),
    "vendor_id" UUID,
    "status" "multitenant"."GrnStatus" NOT NULL DEFAULT 'CREATED',
    "qc_required" BOOLEAN NOT NULL DEFAULT false,
    "qc_result" VARCHAR(20),
    "received_by_user_id" UUID,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "goods_receipts_pkey" PRIMARY KEY ("id")
);


-- CreateTable
CREATE TABLE "multitenant"."goods_receipt_lines" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "facility_id" UUID NOT NULL,
    "receipt_id" UUID NOT NULL,
    "asn_line_id" UUID,
    "product_id" UUID NOT NULL,
    "expected_quantity" DOUBLE PRECISION NOT NULL,
    "received_quantity" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "damaged_quantity" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "uom_id" UUID NOT NULL,
    "lot_number" VARCHAR(100),
    "expiry_date" DATE,
    "status" "multitenant"."GrnLineStatus" NOT NULL DEFAULT 'OPEN',
    "disposition" "multitenant"."DispositionAction" NOT NULL DEFAULT 'ACCEPT',
    "qc_result" VARCHAR(20),
    "line_lots" JSON,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "goods_receipt_lines_pkey" PRIMARY KEY ("id")
);


-- CreateTable
CREATE TABLE "multitenant"."license_plate_numbers" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "facility_id" UUID NOT NULL,
    "lpn_number" VARCHAR(100) NOT NULL,
    "lpn_type" "multitenant"."LpnType" NOT NULL DEFAULT 'PALLET',
    "status" "multitenant"."LpnStatus" NOT NULL DEFAULT 'RECEIVED',
    "location_id" UUID NOT NULL,
    "product_id" UUID,
    "lot_number" VARCHAR(100),
    "expiry_date" DATE,
    "quantity" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "uom_id" UUID NOT NULL,
    "grn_line_id" UUID,
    "parent_lpn_id" UUID,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "license_plate_numbers_pkey" PRIMARY KEY ("id")
);


-- CreateTable
CREATE TABLE "multitenant"."putaway_tasks" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "facility_id" UUID NOT NULL,
    "task_number" VARCHAR(50) NOT NULL,
    "grn_line_id" UUID,
    "lpn_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "uom_id" UUID NOT NULL,
    "suggested_location_id" UUID,
    "assigned_location_id" UUID,
    "assigned_to_user_id" UUID,
    "status" VARCHAR(20) NOT NULL DEFAULT 'CREATED',
    "priority" INTEGER NOT NULL DEFAULT 5,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "putaway_tasks_pkey" PRIMARY KEY ("id")
);


ALTER TABLE "multitenant"."asn_lines" ADD CONSTRAINT "asn_lines_asn_id_fkey" FOREIGN KEY ("asn_id") REFERENCES "multitenant"."advance_ship_notices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "multitenant"."goods_receipt_lines" ADD CONSTRAINT "goods_receipt_lines_receipt_id_fkey" FOREIGN KEY ("receipt_id") REFERENCES "multitenant"."goods_receipts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "multitenant"."license_plate_numbers" ADD CONSTRAINT "license_plate_numbers_grn_line_id_fkey" FOREIGN KEY ("grn_line_id") REFERENCES "multitenant"."goods_receipt_lines"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "multitenant"."license_plate_numbers" ADD CONSTRAINT "license_plate_numbers_parent_lpn_id_fkey" FOREIGN KEY ("parent_lpn_id") REFERENCES "multitenant"."license_plate_numbers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Enable RLS
ALTER TABLE multitenant.advance_ship_notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE multitenant.asn_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE multitenant.goods_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE multitenant.goods_receipt_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE multitenant.license_plate_numbers ENABLE ROW LEVEL SECURITY;
ALTER TABLE multitenant.putaway_tasks ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_asn_tenant ON multitenant.advance_ship_notices (tenant_id);
CREATE INDEX IF NOT EXISTS idx_asnl_tenant ON multitenant.asn_lines (tenant_id);
CREATE INDEX IF NOT EXISTS idx_grn_tenant ON multitenant.goods_receipts (tenant_id);
CREATE INDEX IF NOT EXISTS idx_grnl_tenant ON multitenant.goods_receipt_lines (tenant_id);
CREATE INDEX IF NOT EXISTS idx_lpn_tenant ON multitenant.license_plate_numbers (tenant_id);
CREATE INDEX IF NOT EXISTS idx_put_tenant ON multitenant.putaway_tasks (tenant_id);

-- Policies
DO $$
DECLARE
  tables text[] := ARRAY['advance_ship_notices', 'asn_lines', 'goods_receipts', 'goods_receipt_lines', 'license_plate_numbers', 'putaway_tasks'];
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

-- CreateTable inspection
CREATE TABLE "multitenant"."inspections" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "facility_id" UUID NOT NULL,
    "grn_line_id" UUID NOT NULL,
    "lpn_id" UUID,
    "inspector_user_id" VARCHAR(100) NOT NULL,
    "result" VARCHAR(20) NOT NULL,
    "notes" TEXT,
    "inspected_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "inspections_pkey" PRIMARY KEY ("id")
);

-- CreateTable qc_dispositions
CREATE TABLE "multitenant"."qc_dispositions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "facility_id" UUID NOT NULL,
    "grn_line_id" UUID NOT NULL,
    "lpn_id" UUID,
    "action" "multitenant"."DispositionAction" NOT NULL,
    "notes" TEXT,
    "applied_by_user_id" VARCHAR(100) NOT NULL,
    "applied_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "qc_dispositions_pkey" PRIMARY KEY ("id")
);

-- Foreign keys
ALTER TABLE "multitenant"."inspections" ADD CONSTRAINT "inspections_grn_line_id_fkey" FOREIGN KEY ("grn_line_id") REFERENCES "multitenant"."goods_receipt_lines"("id") ON DELETE CASCADE;
ALTER TABLE "multitenant"."inspections" ADD CONSTRAINT "inspections_lpn_id_fkey" FOREIGN KEY ("lpn_id") REFERENCES "multitenant"."license_plate_numbers"("id") ON DELETE SET NULL;
ALTER TABLE "multitenant"."qc_dispositions" ADD CONSTRAINT "qc_dispositions_grn_line_id_fkey" FOREIGN KEY ("grn_line_id") REFERENCES "multitenant"."goods_receipt_lines"("id") ON DELETE CASCADE;
ALTER TABLE "multitenant"."qc_dispositions" ADD CONSTRAINT "qc_dispositions_lpn_id_fkey" FOREIGN KEY ("lpn_id") REFERENCES "multitenant"."license_plate_numbers"("id") ON DELETE SET NULL;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_insp_tenant ON multitenant.inspections (tenant_id, grn_line_id);
CREATE INDEX IF NOT EXISTS idx_qcd_tenant ON multitenant.qc_dispositions (tenant_id, grn_line_id);

-- Enable RLS
ALTER TABLE multitenant.inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE multitenant.qc_dispositions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY tenant_isolation_inspections ON multitenant.inspections FOR ALL USING (tenant_id = current_setting('app.tenant_id')::uuid);
CREATE POLICY tenant_insert_inspections ON multitenant.inspections FOR INSERT WITH CHECK (tenant_id = current_setting('app.tenant_id')::uuid);
CREATE POLICY tenant_update_inspections ON multitenant.inspections FOR UPDATE USING (tenant_id = current_setting('app.tenant_id')::uuid) WITH CHECK (tenant_id = current_setting('app.tenant_id')::uuid);
CREATE POLICY tenant_delete_inspections ON multitenant.inspections FOR DELETE USING (tenant_id = current_setting('app.tenant_id')::uuid);

CREATE POLICY tenant_isolation_qc_dispositions ON multitenant.qc_dispositions FOR ALL USING (tenant_id = current_setting('app.tenant_id')::uuid);
CREATE POLICY tenant_insert_qc_dispositions ON multitenant.qc_dispositions FOR INSERT WITH CHECK (tenant_id = current_setting('app.tenant_id')::uuid);
CREATE POLICY tenant_update_qc_dispositions ON multitenant.qc_dispositions FOR UPDATE USING (tenant_id = current_setting('app.tenant_id')::uuid) WITH CHECK (tenant_id = current_setting('app.tenant_id')::uuid);
CREATE POLICY tenant_delete_qc_dispositions ON multitenant.qc_dispositions FOR DELETE USING (tenant_id = current_setting('app.tenant_id')::uuid);
