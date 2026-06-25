-- Phase 10: Equipment Management
-- Creates warehouse_equipment, equipment_maintenance

CREATE TABLE IF NOT EXISTS "multitenant"."warehouse_equipment" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "facility_id" UUID NOT NULL,
    "equipment_code" VARCHAR(50) NOT NULL,
    "equipment_name" VARCHAR(255) NOT NULL,
    "equipment_type" VARCHAR(50) NOT NULL,
    "manufacturer" VARCHAR(255),
    "model" VARCHAR(255),
    "serial_number" VARCHAR(100),
    "year" INTEGER,
    "status" VARCHAR(20) NOT NULL DEFAULT 'AVAILABLE',
    "last_maintenance_at" TIMESTAMPTZ,
    "next_maintenance_due" TIMESTAMPTZ,
    "location_id" UUID,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT "warehouse_equipment_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "warehouse_equipment_code_uq" ON "multitenant"."warehouse_equipment"("tenant_id", "facility_id", "equipment_code");
CREATE INDEX IF NOT EXISTS "idx_we_status" ON "multitenant"."warehouse_equipment"("tenant_id", "status");

CREATE TABLE IF NOT EXISTS "multitenant"."equipment_maintenance" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "facility_id" UUID NOT NULL,
    "equipment_id" UUID NOT NULL,
    "maintenance_number" VARCHAR(50) NOT NULL,
    "maintenance_type" VARCHAR(20) NOT NULL,
    "priority" VARCHAR(10) NOT NULL DEFAULT 'MEDIUM',
    "status" VARCHAR(20) NOT NULL DEFAULT 'OPEN',
    "description" TEXT,
    "performed_by_user_id" UUID,
    "cost" DECIMAL(12, 2),
    "downtime_minutes" INTEGER,
    "completed_at" TIMESTAMPTZ,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT "equipment_maintenance_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "equipment_maintenance_number_uq" ON "multitenant"."equipment_maintenance"("tenant_id", "maintenance_number");
CREATE INDEX IF NOT EXISTS "idx_em_equipment" ON "multitenant"."equipment_maintenance"("tenant_id", "equipment_id");
ALTER TABLE "multitenant"."equipment_maintenance" ADD CONSTRAINT "em_equipment_id_fkey" FOREIGN KEY ("equipment_id") REFERENCES "multitenant"."warehouse_equipment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
