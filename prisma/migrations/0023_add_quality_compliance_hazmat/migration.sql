-- Create quality_inspections table
CREATE TABLE IF NOT EXISTS "multitenant"."quality_inspections" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "facility_id" UUID NOT NULL,
    "inspection_number" VARCHAR(50) NOT NULL,
    "inspection_type" VARCHAR(50) NOT NULL,
    "reference_type" VARCHAR(50),
    "reference_id" VARCHAR(100),
    "product_id" UUID,
    "lot_id" UUID,
    "location_id" UUID,
    "assigned_to_user_id" UUID,
    "status" VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    "priority" VARCHAR(10) NOT NULL DEFAULT 'MEDIUM',
    "notes" TEXT,
    "scheduled_date" TIMESTAMPTZ,
    "completed_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT "quality_inspections_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "quality_inspections_number_uq" ON "multitenant"."quality_inspections"("tenant_id", "inspection_number");
CREATE INDEX IF NOT EXISTS "idx_qi_status" ON "multitenant"."quality_inspections"("tenant_id", "facility_id", "status");

-- Create quality_inspection_results table
CREATE TABLE IF NOT EXISTS "multitenant"."quality_inspection_results" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "inspection_id" UUID NOT NULL,
    "check_type" VARCHAR(50) NOT NULL,
    "result" VARCHAR(20) NOT NULL,
    "measured_value" REAL,
    "tolerance_min" REAL,
    "tolerance_max" REAL,
    "notes" TEXT,
    "media_url" VARCHAR(500),
    "checked_by_user_id" UUID,
    "checked_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT "quality_inspection_results_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "idx_qir_inspection" ON "multitenant"."quality_inspection_results"("tenant_id", "inspection_id");

-- Create quality_inspection_events table
CREATE TABLE IF NOT EXISTS "multitenant"."quality_inspection_events" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "inspection_id" UUID NOT NULL,
    "event_type" VARCHAR(50) NOT NULL,
    "event_data" JSONB,
    "performed_by" UUID,
    "performed_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT "quality_inspection_events_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "idx_qie_inspection" ON "multitenant"."quality_inspection_events"("tenant_id", "inspection_id");

-- Create compliance_requirements table
CREATE TABLE IF NOT EXISTS "multitenant"."compliance_requirements" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "facility_id" UUID NOT NULL,
    "compliance_type" VARCHAR(50) NOT NULL,
    "requirement_code" VARCHAR(100) NOT NULL,
    "description" TEXT NOT NULL,
    "applicable_entity" VARCHAR(50),
    "frequency_type" VARCHAR(20),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT "compliance_requirements_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "compliance_requirements_code_uq" ON "multitenant"."compliance_requirements"("tenant_id", "facility_id", "requirement_code");

-- Create compliance_audits table
CREATE TABLE IF NOT EXISTS "multitenant"."compliance_audits" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "facility_id" UUID NOT NULL,
    "requirement_id" UUID NOT NULL,
    "audit_number" VARCHAR(50) NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'SCHEDULED',
    "result" VARCHAR(20),
    "findings" JSONB,
    "corrective_actions" JSONB,
    "audited_by_user_id" UUID,
    "scheduled_date" TIMESTAMPTZ,
    "completed_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT "compliance_audits_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "compliance_audits_number_uq" ON "multitenant"."compliance_audits"("tenant_id", "audit_number");
CREATE INDEX IF NOT EXISTS "idx_ca_status" ON "multitenant"."compliance_audits"("tenant_id", "facility_id", "status");

-- Create hazmat_materials table
CREATE TABLE IF NOT EXISTS "multitenant"."hazmat_materials" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "facility_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "hazard_class" VARCHAR(10) NOT NULL,
    "division" VARCHAR(10),
    "un_number" VARCHAR(10) NOT NULL,
    "packing_group" VARCHAR(5),
    "proper_shipping_name" VARCHAR(255) NOT NULL,
    "flash_point" VARCHAR(20),
    "storage_group" VARCHAR(50),
    "emergency_contact" VARCHAR(255),
    "emergency_phone" VARCHAR(50),
    "msds_url" VARCHAR(500),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT "hazmat_materials_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "hazmat_materials_product_uq" ON "multitenant"."hazmat_materials"("tenant_id", "facility_id", "product_id");
CREATE INDEX IF NOT EXISTS "idx_hm_class" ON "multitenant"."hazmat_materials"("tenant_id", "hazard_class");

-- Add foreign keys
ALTER TABLE "multitenant"."quality_inspection_results" ADD CONSTRAINT "qir_inspection_id_fkey" FOREIGN KEY ("inspection_id") REFERENCES "multitenant"."quality_inspections"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "multitenant"."quality_inspection_events" ADD CONSTRAINT "qie_inspection_id_fkey" FOREIGN KEY ("inspection_id") REFERENCES "multitenant"."quality_inspections"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "multitenant"."compliance_audits" ADD CONSTRAINT "ca_requirement_id_fkey" FOREIGN KEY ("requirement_id") REFERENCES "multitenant"."compliance_requirements"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
