-- Phase 8: Dock & Yard Management
-- Creates dock_appointments and yard_vehicles tables

CREATE TABLE IF NOT EXISTS "multitenant"."dock_appointments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "facility_id" UUID NOT NULL,
    "dock_id" UUID NOT NULL,
    "appointment_number" VARCHAR(50) NOT NULL,
    "appointment_type" VARCHAR(20) NOT NULL,
    "carrier_name" VARCHAR(255),
    "carrier_code" VARCHAR(50),
    "driver_name" VARCHAR(255),
    "driver_phone" VARCHAR(50),
    "vehicle_plate" VARCHAR(50),
    "trailer_id" VARCHAR(50),
    "reference_type" VARCHAR(50),
    "reference_number" VARCHAR(100),
    "scheduled_start" TIMESTAMPTZ NOT NULL,
    "scheduled_end" TIMESTAMPTZ NOT NULL,
    "actual_arrival" TIMESTAMPTZ,
    "actual_departure" TIMESTAMPTZ,
    "status" VARCHAR(20) NOT NULL DEFAULT 'SCHEDULED',
    "notes" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT "dock_appointments_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "dock_appointments_number_uq" ON "multitenant"."dock_appointments"("tenant_id", "facility_id", "appointment_number");
CREATE INDEX IF NOT EXISTS "idx_da_dock_time" ON "multitenant"."dock_appointments"("tenant_id", "dock_id", "scheduled_start");
CREATE INDEX IF NOT EXISTS "idx_da_status" ON "multitenant"."dock_appointments"("tenant_id", "status");

CREATE TABLE IF NOT EXISTS "multitenant"."yard_vehicles" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "facility_id" UUID NOT NULL,
    "vehicle_type" VARCHAR(20) NOT NULL,
    "vehicle_plate" VARCHAR(50) NOT NULL,
    "carrier_code" VARCHAR(50),
    "driver_name" VARCHAR(255),
    "driver_phone" VARCHAR(50),
    "seal_number" VARCHAR(50),
    "yard_location" VARCHAR(100),
    "status" VARCHAR(20) NOT NULL DEFAULT 'EXPECTED',
    "arrived_at" TIMESTAMPTZ,
    "dock_assigned_at" TIMESTAMPTZ,
    "departed_at" TIMESTAMPTZ,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT "yard_vehicles_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "yard_vehicles_plate_uq" ON "multitenant"."yard_vehicles"("tenant_id", "facility_id", "vehicle_plate");
CREATE INDEX IF NOT EXISTS "idx_yv_status" ON "multitenant"."yard_vehicles"("tenant_id", "status");
