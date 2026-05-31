-- Create missing enums for customization engine
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid WHERE t.typname = 'EngineType' AND n.nspname = 'multitenant') THEN
    CREATE TYPE "multitenant"."EngineType" AS ENUM ('XSTATE_MACHINE', 'JDM_RULE', 'BPMN_PROCESS');
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid WHERE t.typname = 'ExecutionStatus' AND n.nspname = 'multitenant') THEN
    CREATE TYPE "multitenant"."ExecutionStatus" AS ENUM ('RUNNING', 'COMPLETED', 'ERROR', 'SUSPENDED', 'CANCELLED');
  END IF;
END$$;

-- Add SYSTEM_CORRECTION to TransactionType if not already present
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid JOIN pg_namespace n ON t.typnamespace = n.oid WHERE t.typname = 'TransactionType' AND n.nspname = 'multitenant' AND e.enumlabel = 'SYSTEM_CORRECTION') THEN
    ALTER TYPE "multitenant"."TransactionType" ADD VALUE 'SYSTEM_CORRECTION';
  END IF;
END$$;

-- Create inspections table
CREATE TABLE IF NOT EXISTS "multitenant"."inspections" (
    "id" UUID NOT NULL,
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

-- Create qc_dispositions table
CREATE TABLE IF NOT EXISTS "multitenant"."qc_dispositions" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "facility_id" UUID NOT NULL,
    "grn_line_id" UUID NOT NULL,
    "lpn_id" UUID,
    "action" VARCHAR(20) NOT NULL,
    "notes" TEXT,
    "applied_by_user_id" VARCHAR(100) NOT NULL,
    "applied_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "qc_dispositions_pkey" PRIMARY KEY ("id")
);

-- Create system_settings table
CREATE TABLE IF NOT EXISTS "multitenant"."system_settings" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "setting_key" VARCHAR(100) NOT NULL,
    "value" JSON NOT NULL,
    "description" VARCHAR(500),
    "updated_by" VARCHAR(100),
    "updated_at" TIMESTAMPTZ NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "system_settings_pkey" PRIMARY KEY ("id")
);

-- Create supervisor_pins table
CREATE TABLE IF NOT EXISTS "multitenant"."supervisor_pins" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "pin_hash" VARCHAR(64) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "expires_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "supervisor_pins_pkey" PRIMARY KEY ("id")
);

-- Create db_rf_sessions table
CREATE TABLE IF NOT EXISTS "multitenant"."db_rf_sessions" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "workflow_id" VARCHAR(200) NOT NULL,
    "workflow" VARCHAR(50) NOT NULL,
    "payload" JSON NOT NULL,
    "state" JSON NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'started',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "completed_at" TIMESTAMPTZ,
    CONSTRAINT "db_rf_sessions_pkey" PRIMARY KEY ("id")
);

-- Create wms_state_machines table
CREATE TABLE IF NOT EXISTS "multitenant"."wms_state_machines" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "entityType" VARCHAR(50) NOT NULL,
    "machine_key" VARCHAR(100) NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "definition_json" JSON NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    CONSTRAINT "wms_state_machines_pkey" PRIMARY KEY ("id")
);

-- Create wms_rules table
CREATE TABLE IF NOT EXISTS "multitenant"."wms_rules" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "rule_key" VARCHAR(100) NOT NULL,
    "rule_type" VARCHAR(50) NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "definition_json" JSON NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    CONSTRAINT "wms_rules_pkey" PRIMARY KEY ("id")
);

-- Create wms_bpmn_processes table
CREATE TABLE IF NOT EXISTS "multitenant"."wms_bpmn_processes" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "process_key" VARCHAR(100) NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "bpmn_xml" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    CONSTRAINT "wms_bpmn_processes_pkey" PRIMARY KEY ("id")
);

-- Create wms_execution_instances table
CREATE TABLE IF NOT EXISTS "multitenant"."wms_execution_instances" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "entity_type" VARCHAR(50) NOT NULL,
    "entity_id" VARCHAR(100) NOT NULL,
    "engine_type" "multitenant"."EngineType" NOT NULL,
    "engine_key" VARCHAR(100) NOT NULL,
    "engine_version" INTEGER NOT NULL DEFAULT 1,
    "current_state" VARCHAR(200),
    "context_json" JSON,
    "status" "multitenant"."ExecutionStatus" NOT NULL DEFAULT 'RUNNING',
    "started_by_user_id" UUID,
    "started_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMPTZ,
    "error_details" TEXT,
    CONSTRAINT "wms_execution_instances_pkey" PRIMARY KEY ("id")
);

-- Create indexes for new tables
CREATE INDEX IF NOT EXISTS "idx_insp_grnl" ON "multitenant"."inspections"("tenant_id", "grn_line_id");
CREATE INDEX IF NOT EXISTS "idx_qcd_grnl" ON "multitenant"."qc_dispositions"("tenant_id", "grn_line_id");
CREATE INDEX IF NOT EXISTS "idx_ss_tenant" ON "multitenant"."system_settings"("tenant_id");
CREATE UNIQUE INDEX IF NOT EXISTS "uq_tenant_setting_key" ON "multitenant"."system_settings"("tenant_id", "setting_key");
CREATE INDEX IF NOT EXISTS "idx_sp_user_active" ON "multitenant"."supervisor_pins"("user_id", "is_active");
CREATE UNIQUE INDEX IF NOT EXISTS "uq_supervisor_pin_user" ON "multitenant"."supervisor_pins"("tenant_id", "user_id");
CREATE INDEX IF NOT EXISTS "idx_dbrfs_user" ON "multitenant"."db_rf_sessions"("tenant_id", "user_id");
CREATE INDEX IF NOT EXISTS "idx_dbrfs_workflow" ON "multitenant"."db_rf_sessions"("workflow_id", "status");

-- Customization engine indexes
CREATE INDEX IF NOT EXISTS "idx_wsm_entity_active" ON "multitenant"."wms_state_machines"("tenant_id", "entityType", "is_active");
CREATE UNIQUE INDEX IF NOT EXISTS "uq_wsm_tenant_key_version" ON "multitenant"."wms_state_machines"("tenant_id", "machine_key", "version");
CREATE INDEX IF NOT EXISTS "idx_wr_type_active" ON "multitenant"."wms_rules"("tenant_id", "rule_type", "is_active");
CREATE UNIQUE INDEX IF NOT EXISTS "uq_wr_tenant_key_version" ON "multitenant"."wms_rules"("tenant_id", "rule_key", "version");
CREATE INDEX IF NOT EXISTS "idx_wbp_tenant_active" ON "multitenant"."wms_bpmn_processes"("tenant_id", "is_active");
CREATE UNIQUE INDEX IF NOT EXISTS "uq_wbp_tenant_key_version" ON "multitenant"."wms_bpmn_processes"("tenant_id", "process_key", "version");
CREATE INDEX IF NOT EXISTS "idx_wei_entity" ON "multitenant"."wms_execution_instances"("tenant_id", "entity_type", "entity_id");
CREATE INDEX IF NOT EXISTS "idx_wei_status_time" ON "multitenant"."wms_execution_instances"("tenant_id", "status", "started_at" DESC);

-- Enable RLS on new tenant-scoped tables
ALTER TABLE "multitenant"."system_settings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "multitenant"."supervisor_pins" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "multitenant"."db_rf_sessions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "multitenant"."wms_state_machines" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "multitenant"."wms_rules" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "multitenant"."wms_bpmn_processes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "multitenant"."wms_execution_instances" ENABLE ROW LEVEL SECURITY;

-- Create tenant isolation policies
DO $$
DECLARE tbl text; tables text[] := ARRAY['system_settings', 'supervisor_pins', 'db_rf_sessions', 'wms_state_machines', 'wms_rules', 'wms_bpmn_processes', 'wms_execution_instances'];
BEGIN
  FOREACH tbl IN ARRAY tables LOOP
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'multitenant' AND table_name = tbl) THEN
      EXECUTE format('DROP POLICY IF EXISTS tenant_isolation_%1$s ON multitenant.%1$s', tbl);
      EXECUTE format('CREATE POLICY tenant_isolation_%1$s ON multitenant.%1$s USING (tenant_id = current_setting(''app.tenant_id'')::uuid);', tbl);
      EXECUTE format('DROP POLICY IF EXISTS tenant_insert_%1$s ON multitenant.%1$s', tbl);
      EXECUTE format('CREATE POLICY tenant_insert_%1$s ON multitenant.%1$s WITH CHECK (tenant_id = current_setting(''app.tenant_id'')::uuid);', tbl);
    END IF;
  END LOOP;
END$$;

-- Add foreign keys for inspections and qc_dispositions
ALTER TABLE "multitenant"."inspections" ADD CONSTRAINT "fk_inspections_grn_line" FOREIGN KEY ("grn_line_id") REFERENCES "multitenant"."goods_receipt_lines"("id") ON DELETE CASCADE;
ALTER TABLE "multitenant"."inspections" ADD CONSTRAINT "fk_inspections_lpn" FOREIGN KEY ("lpn_id") REFERENCES "multitenant"."license_plate_numbers"("id") ON DELETE SET NULL;
ALTER TABLE "multitenant"."qc_dispositions" ADD CONSTRAINT "fk_qc_dispositions_grn_line" FOREIGN KEY ("grn_line_id") REFERENCES "multitenant"."goods_receipt_lines"("id") ON DELETE CASCADE;
ALTER TABLE "multitenant"."qc_dispositions" ADD CONSTRAINT "fk_qc_dispositions_lpn" FOREIGN KEY ("lpn_id") REFERENCES "multitenant"."license_plate_numbers"("id") ON DELETE SET NULL;
