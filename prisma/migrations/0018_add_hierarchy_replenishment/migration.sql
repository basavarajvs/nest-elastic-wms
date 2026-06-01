-- Add new HoldType enum values
ALTER TYPE "multitenant"."HoldType" ADD VALUE IF NOT EXISTS 'QA';
ALTER TYPE "multitenant"."HoldType" ADD VALUE IF NOT EXISTS 'DISPUTE';
ALTER TYPE "multitenant"."HoldType" ADD VALUE IF NOT EXISTS 'OTHER';
ALTER TYPE "multitenant"."HoldType" ADD VALUE IF NOT EXISTS 'CUSTOMER_HOLD';

-- Add quantity and notes columns to inventory_holds
ALTER TABLE "multitenant"."inventory_holds" ADD COLUMN IF NOT EXISTS "quantity" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "multitenant"."inventory_holds" ADD COLUMN IF NOT EXISTS "notes" TEXT;

-- Add replenishment fields to products
ALTER TABLE "multitenant"."products" ADD COLUMN IF NOT EXISTS "replenishment_min_qty" REAL;
ALTER TABLE "multitenant"."products" ADD COLUMN IF NOT EXISTS "replenishment_max_qty" REAL;

-- Add is_pick_location to storage_locations
ALTER TABLE "multitenant"."storage_locations" ADD COLUMN IF NOT EXISTS "is_pick_location" BOOLEAN NOT NULL DEFAULT false;

-- ── Warehouse Hierarchy: Aisle ──
CREATE TABLE IF NOT EXISTS "multitenant"."warehouse_aisles" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "facility_id" UUID NOT NULL,
    "zone_id" UUID NOT NULL,
    "aisle_code" VARCHAR(20) NOT NULL,
    "name" VARCHAR(255),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT "aisles_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "aisles_uq" UNIQUE ("tenant_id", "facility_id", "zone_id", "aisle_code")
);
CREATE INDEX IF NOT EXISTS "idx_aisles_zone" ON "multitenant"."warehouse_aisles" ("tenant_id", "facility_id", "zone_id");

-- ── Warehouse Hierarchy: Bay ──
CREATE TABLE IF NOT EXISTS "multitenant"."warehouse_bays" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "facility_id" UUID NOT NULL,
    "zone_id" UUID NOT NULL,
    "aisle_id" UUID NOT NULL,
    "bay_code" VARCHAR(20) NOT NULL,
    "name" VARCHAR(255),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT "bays_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "bays_uq" UNIQUE ("tenant_id", "facility_id", "zone_id", "aisle_id", "bay_code"),
    CONSTRAINT "bays_aisle_fkey" FOREIGN KEY ("aisle_id") REFERENCES "multitenant"."warehouse_aisles"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "idx_bays_aisle" ON "multitenant"."warehouse_bays" ("tenant_id", "facility_id", "aisle_id");

-- ── Warehouse Hierarchy: Rack ──
CREATE TABLE IF NOT EXISTS "multitenant"."warehouse_racks" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "facility_id" UUID NOT NULL,
    "zone_id" UUID NOT NULL,
    "aisle_id" UUID NOT NULL,
    "bay_id" UUID NOT NULL,
    "rack_code" VARCHAR(20) NOT NULL,
    "name" VARCHAR(255),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT "racks_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "racks_uq" UNIQUE ("tenant_id", "facility_id", "zone_id", "bay_id", "rack_code"),
    CONSTRAINT "racks_bay_fkey" FOREIGN KEY ("bay_id") REFERENCES "multitenant"."warehouse_bays"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "idx_racks_bay" ON "multitenant"."warehouse_racks" ("tenant_id", "facility_id", "bay_id");

-- ── Warehouse Hierarchy: Level ──
CREATE TABLE IF NOT EXISTS "multitenant"."warehouse_levels" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "facility_id" UUID NOT NULL,
    "zone_id" UUID NOT NULL,
    "aisle_id" UUID NOT NULL,
    "bay_id" UUID NOT NULL,
    "rack_id" UUID NOT NULL,
    "level_code" VARCHAR(20) NOT NULL,
    "name" VARCHAR(255),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT "levels_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "levels_uq" UNIQUE ("tenant_id", "facility_id", "zone_id", "rack_id", "level_code"),
    CONSTRAINT "levels_rack_fkey" FOREIGN KEY ("rack_id") REFERENCES "multitenant"."warehouse_racks"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "idx_levels_rack" ON "multitenant"."warehouse_levels" ("tenant_id", "facility_id", "rack_id");

-- ── Replenishment Tasks ──
CREATE TABLE IF NOT EXISTS "multitenant"."replenishment_tasks" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "facility_id" UUID NOT NULL,
    "task_number" VARCHAR(50) NOT NULL,
    "product_id" UUID NOT NULL,
    "from_location_id" UUID NOT NULL,
    "to_location_id" UUID NOT NULL,
    "requested_quantity" DOUBLE PRECISION NOT NULL,
    "fulfilled_quantity" DOUBLE PRECISION DEFAULT 0,
    "status" VARCHAR(20) NOT NULL DEFAULT 'OPEN',
    "priority" VARCHAR(10) NOT NULL DEFAULT 'MEDIUM',
    "assigned_to_user_id" UUID,
    "notes" TEXT,
    "completed_at" TIMESTAMPTZ,
    "completed_by_user_id" UUID,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT "replen_tasks_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "replen_tasks_number_uq" UNIQUE ("tenant_id", "facility_id", "task_number")
);
CREATE INDEX IF NOT EXISTS "idx_replen_tasks_status" ON "multitenant"."replenishment_tasks" ("tenant_id", "facility_id", "status");

-- Enable RLS on new tables
ALTER TABLE "multitenant"."warehouse_aisles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "multitenant"."warehouse_bays" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "multitenant"."warehouse_racks" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "multitenant"."warehouse_levels" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "multitenant"."replenishment_tasks" ENABLE ROW LEVEL SECURITY;

-- RLS policies for new tables
CREATE POLICY tenant_isolation_warehouse_aisles ON "multitenant"."warehouse_aisles"
    USING (tenant_id = current_setting('app.tenant_id')::uuid);
CREATE POLICY tenant_insert_warehouse_aisles ON "multitenant"."warehouse_aisles"
    WITH CHECK (tenant_id = current_setting('app.tenant_id')::uuid);

CREATE POLICY tenant_isolation_warehouse_bays ON "multitenant"."warehouse_bays"
    USING (tenant_id = current_setting('app.tenant_id')::uuid);
CREATE POLICY tenant_insert_warehouse_bays ON "multitenant"."warehouse_bays"
    WITH CHECK (tenant_id = current_setting('app.tenant_id')::uuid);

CREATE POLICY tenant_isolation_warehouse_racks ON "multitenant"."warehouse_racks"
    USING (tenant_id = current_setting('app.tenant_id')::uuid);
CREATE POLICY tenant_insert_warehouse_racks ON "multitenant"."warehouse_racks"
    WITH CHECK (tenant_id = current_setting('app.tenant_id')::uuid);

CREATE POLICY tenant_isolation_warehouse_levels ON "multitenant"."warehouse_levels"
    USING (tenant_id = current_setting('app.tenant_id')::uuid);
CREATE POLICY tenant_insert_warehouse_levels ON "multitenant"."warehouse_levels"
    WITH CHECK (tenant_id = current_setting('app.tenant_id')::uuid);

CREATE POLICY tenant_isolation_replenishment_tasks ON "multitenant"."replenishment_tasks"
    USING (tenant_id = current_setting('app.tenant_id')::uuid);
CREATE POLICY tenant_insert_replenishment_tasks ON "multitenant"."replenishment_tasks"
    WITH CHECK (tenant_id = current_setting('app.tenant_id')::uuid);
