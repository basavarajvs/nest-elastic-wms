-- Add service_id and client_id to existing vas_execution_tasks
ALTER TABLE "multitenant"."vas_execution_tasks" ADD COLUMN IF NOT EXISTS "service_id" UUID;
ALTER TABLE "multitenant"."vas_execution_tasks" ADD COLUMN IF NOT EXISTS "client_id" UUID;

-- Create vas_services table
CREATE TABLE IF NOT EXISTS "multitenant"."vas_services" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "service_code" VARCHAR(50) NOT NULL,
    "service_name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "category" VARCHAR(50),
    "default_rate" DECIMAL(12,4),
    "uom_id" UUID,
    "estimated_time_minutes" INTEGER,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT "vas_services_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "vas_services_code_uq" ON "multitenant"."vas_services"("tenant_id", "service_code");

-- Create vas_service_client_rates table
CREATE TABLE IF NOT EXISTS "multitenant"."vas_service_client_rates" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "service_id" UUID NOT NULL,
    "client_id" UUID NOT NULL,
    "rate_per_unit" DECIMAL(12,4) NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'USD',
    "min_charge" DECIMAL(12,4),
    "effective_date" DATE NOT NULL DEFAULT now(),
    "expiry_date" DATE,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT "vas_service_client_rates_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "vas_client_rates_uq" ON "multitenant"."vas_service_client_rates"("tenant_id", "service_id", "client_id", "effective_date");

-- Create vas_workstations table
CREATE TABLE IF NOT EXISTS "multitenant"."vas_workstations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "facility_id" UUID NOT NULL,
    "workstation_code" VARCHAR(50) NOT NULL,
    "workstation_name" VARCHAR(255) NOT NULL,
    "station_type" VARCHAR(50) NOT NULL,
    "location_id" UUID,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_available" BOOLEAN NOT NULL DEFAULT true,
    "capabilities" JSONB,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT "vas_workstations_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "vas_workstations_code_uq" ON "multitenant"."vas_workstations"("tenant_id", "facility_id", "workstation_code");

-- Add foreign keys
ALTER TABLE "multitenant"."vas_service_client_rates" ADD CONSTRAINT "vscr_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "multitenant"."vas_services"("id") ON DELETE CASCADE ON UPDATE CASCADE;
