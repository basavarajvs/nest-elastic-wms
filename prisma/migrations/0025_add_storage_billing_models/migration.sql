-- Phase 7: Storage Billing Engine
-- Creates storage_rate_master, storage_client_rates, billing_cycles,
-- storage_inventory_snapshots, storage_charges, client_invoices, client_invoice_lines

-- Storage Rate Master
CREATE TABLE IF NOT EXISTS "multitenant"."storage_rate_master" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "facility_id" UUID NOT NULL,
    "rate_code" VARCHAR(50) NOT NULL,
    "rate_name" VARCHAR(255) NOT NULL,
    "rate_type" VARCHAR(20) NOT NULL,
    "calculation_basis" VARCHAR(20) NOT NULL,
    "default_rate" DECIMAL(12,4) NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'USD',
    "min_charge" DECIMAL(12,4),
    "max_charge" DECIMAL(12,4),
    "effective_date" DATE NOT NULL DEFAULT now(),
    "expiry_date" DATE,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT "storage_rate_master_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "storage_rate_master_code_uq" ON "multitenant"."storage_rate_master"("tenant_id", "facility_id", "rate_code");

-- Storage Client Rates
CREATE TABLE IF NOT EXISTS "multitenant"."storage_client_rates" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "rate_master_id" UUID NOT NULL,
    "client_id" UUID NOT NULL,
    "negotiated_rate" DECIMAL(12,4) NOT NULL,
    "effective_date" DATE NOT NULL DEFAULT now(),
    "expiry_date" DATE,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT "storage_client_rates_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "storage_client_rates_uq" ON "multitenant"."storage_client_rates"("tenant_id", "rate_master_id", "client_id", "effective_date");

-- Billing Cycles
CREATE TABLE IF NOT EXISTS "multitenant"."billing_cycles" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "facility_id" UUID NOT NULL,
    "cycle_code" VARCHAR(50) NOT NULL,
    "cycle_name" VARCHAR(255) NOT NULL,
    "frequency" VARCHAR(20) NOT NULL,
    "billing_day" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT "billing_cycles_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "billing_cycles_code_uq" ON "multitenant"."billing_cycles"("tenant_id", "facility_id", "cycle_code");

-- Storage Inventory Snapshots
CREATE TABLE IF NOT EXISTS "multitenant"."storage_inventory_snapshots" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "facility_id" UUID NOT NULL,
    "snapshot_date" DATE NOT NULL,
    "client_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "location_id" UUID,
    "quantity" REAL NOT NULL,
    "pallet_count" INTEGER,
    "volume_cubic_ft" REAL,
    "days_stored" INTEGER NOT NULL,
    "rate_applied_id" UUID,
    "charge_amount" DECIMAL(12,4),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT "storage_inventory_snapshots_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "storage_snapshots_uq" ON "multitenant"."storage_inventory_snapshots"("tenant_id", "facility_id", "snapshot_date", "client_id", "product_id", "location_id");
CREATE INDEX IF NOT EXISTS "idx_ss_snapshot_date" ON "multitenant"."storage_inventory_snapshots"("tenant_id", "facility_id", "snapshot_date");

-- Storage Charges
CREATE TABLE IF NOT EXISTS "multitenant"."storage_charges" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "facility_id" UUID NOT NULL,
    "charge_number" VARCHAR(50) NOT NULL,
    "client_id" UUID NOT NULL,
    "charge_type" VARCHAR(30) NOT NULL,
    "cycle_id" UUID,
    "period_start" DATE NOT NULL,
    "period_end" DATE NOT NULL,
    "charge_date" DATE NOT NULL DEFAULT now(),
    "quantity" REAL NOT NULL,
    "rate_applied" DECIMAL(12,4) NOT NULL,
    "amount" DECIMAL(12,4) NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'USD',
    "status" VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    "invoice_id" UUID,
    "description" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT "storage_charges_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "storage_charges_number_uq" ON "multitenant"."storage_charges"("tenant_id", "charge_number");
CREATE INDEX IF NOT EXISTS "idx_sc_client_status" ON "multitenant"."storage_charges"("tenant_id", "facility_id", "client_id", "status");

-- Client Invoices
CREATE TABLE IF NOT EXISTS "multitenant"."client_invoices" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "facility_id" UUID NOT NULL,
    "invoice_number" VARCHAR(50) NOT NULL,
    "client_id" UUID NOT NULL,
    "invoice_date" DATE NOT NULL DEFAULT now(),
    "due_date" DATE NOT NULL,
    "period_start" DATE NOT NULL,
    "period_end" DATE NOT NULL,
    "subtotal" DECIMAL(14,2) NOT NULL,
    "tax_amount" DECIMAL(14,2) DEFAULT 0,
    "discount_amount" DECIMAL(14,2) DEFAULT 0,
    "total_amount" DECIMAL(14,2) NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'USD',
    "status" VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    "paid_at" TIMESTAMPTZ,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT "client_invoices_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "client_invoices_number_uq" ON "multitenant"."client_invoices"("tenant_id", "invoice_number");
CREATE INDEX IF NOT EXISTS "idx_ci_client_status" ON "multitenant"."client_invoices"("tenant_id", "client_id", "status");

-- Client Invoice Lines
CREATE TABLE IF NOT EXISTS "multitenant"."client_invoice_lines" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "invoice_id" UUID NOT NULL,
    "charge_id" UUID,
    "line_type" VARCHAR(30) NOT NULL,
    "description" TEXT,
    "quantity" REAL NOT NULL,
    "unit_price" DECIMAL(12,4) NOT NULL,
    "line_total" DECIMAL(14,2) NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT "client_invoice_lines_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "idx_cil_invoice" ON "multitenant"."client_invoice_lines"("tenant_id", "invoice_id");

-- Foreign keys
ALTER TABLE "multitenant"."storage_client_rates" ADD CONSTRAINT "scr_rate_master_id_fkey" FOREIGN KEY ("rate_master_id") REFERENCES "multitenant"."storage_rate_master"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "multitenant"."client_invoice_lines" ADD CONSTRAINT "cil_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "multitenant"."client_invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;
