-- P2: Non-Conformance Reports
CREATE TABLE IF NOT EXISTS "multitenant"."non_conformance_reports" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "facility_id" UUID NOT NULL,
    "ncr_number" VARCHAR(100) NOT NULL,
    "ncr_name" VARCHAR(255),
    "description" TEXT,
    "reference_type" VARCHAR(50),
    "reference_id" VARCHAR(100),
    "product_id" UUID,
    "lot_id" UUID,
    "severity" VARCHAR(20) NOT NULL DEFAULT 'LOW',
    "status" VARCHAR(20) NOT NULL DEFAULT 'OPEN',
    "reported_by_user_id" UUID,
    "assigned_to_user_id" UUID,
    "reported_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved_at" TIMESTAMPTZ,
    "root_cause" TEXT,
    "resolution" TEXT,
    "corrective_action" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "non_conformance_reports_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "ncr_number_uq" UNIQUE ("tenant_id", "facility_id", "ncr_number")
);
CREATE INDEX IF NOT EXISTS "idx_ncr_tenant_facility" ON "multitenant"."non_conformance_reports"("tenant_id", "facility_id");
CREATE INDEX IF NOT EXISTS "idx_ncr_status" ON "multitenant"."non_conformance_reports"("tenant_id", "status");

-- P2: Exception Management
CREATE TABLE IF NOT EXISTS "multitenant"."exception_management" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "facility_id" UUID NOT NULL,
    "exception_number" VARCHAR(100) NOT NULL,
    "exception_type" VARCHAR(50) NOT NULL,
    "severity" VARCHAR(20) NOT NULL DEFAULT 'LOW',
    "status" VARCHAR(20) NOT NULL DEFAULT 'OPEN',
    "reference_type" VARCHAR(50),
    "reference_id" VARCHAR(100),
    "location_id" UUID,
    "product_id" UUID,
    "lot_id" UUID,
    "reported_by_user_id" UUID,
    "assigned_to_user_id" UUID,
    "reported_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acknowledged_at" TIMESTAMPTZ,
    "resolved_at" TIMESTAMPTZ,
    "resolution_description" TEXT,
    "root_cause" TEXT,
    "impact_level" VARCHAR(20),
    "financial_impact_amount" DECIMAL(12,2),
    "notes" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "exception_management_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "exception_number_uq" UNIQUE ("tenant_id", "facility_id", "exception_number")
);
CREATE INDEX IF NOT EXISTS "idx_exc_mgmt_tenant_facility" ON "multitenant"."exception_management"("tenant_id", "facility_id");
CREATE INDEX IF NOT EXISTS "idx_exc_mgmt_status" ON "multitenant"."exception_management"("tenant_id", "status");

-- P2: Loading Docks
CREATE TABLE IF NOT EXISTS "multitenant"."loading_docks" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "facility_id" UUID NOT NULL,
    "dock_code" VARCHAR(50) NOT NULL,
    "dock_name" VARCHAR(255),
    "dock_type" VARCHAR(20) NOT NULL DEFAULT 'BOTH',
    "description" TEXT,
    "location_id" UUID,
    "max_trailer_length" DECIMAL(8,2),
    "max_trailer_height" DECIMAL(8,2),
    "has_leveler" BOOLEAN DEFAULT false,
    "has_sealant" BOOLEAN DEFAULT false,
    "is_active" BOOLEAN DEFAULT true,
    "is_available" BOOLEAN DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "loading_docks_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "loading_docks_code_uq" UNIQUE ("tenant_id", "facility_id", "dock_code")
);
CREATE INDEX IF NOT EXISTS "idx_loading_docks_tenant" ON "multitenant"."loading_docks"("tenant_id", "facility_id");

-- P2: Packing Stations
CREATE TABLE IF NOT EXISTS "multitenant"."packing_stations" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "facility_id" UUID NOT NULL,
    "station_code" VARCHAR(50) NOT NULL,
    "station_name" VARCHAR(255),
    "description" TEXT,
    "location_id" UUID,
    "printer_type" VARCHAR(100),
    "scale_type" VARCHAR(100),
    "scanner_type" VARCHAR(100),
    "is_active" BOOLEAN DEFAULT true,
    "is_available" BOOLEAN DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "packing_stations_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "packing_stations_code_uq" UNIQUE ("tenant_id", "facility_id", "station_code")
);
CREATE INDEX IF NOT EXISTS "idx_packing_stations_tenant" ON "multitenant"."packing_stations"("tenant_id", "facility_id");

-- P2: Product Client Assignment
CREATE TABLE IF NOT EXISTS "multitenant"."product_client_assignments" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "facility_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "client_id" UUID NOT NULL,
    "is_active" BOOLEAN DEFAULT true,
    "effective_date" DATE,
    "expiry_date" DATE,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "product_client_assignments_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "product_client_assignments_uq" UNIQUE ("tenant_id", "facility_id", "product_id", "client_id")
);
CREATE INDEX IF NOT EXISTS "idx_pca_tenant" ON "multitenant"."product_client_assignments"("tenant_id", "facility_id");

-- P2: VAS Execution Tasks
CREATE TABLE IF NOT EXISTS "multitenant"."vas_execution_tasks" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "facility_id" UUID NOT NULL,
    "task_number" VARCHAR(100) NOT NULL,
    "task_type" VARCHAR(50) NOT NULL,
    "order_id" UUID,
    "shipment_id" UUID,
    "product_id" UUID,
    "quantity_required" REAL DEFAULT 0,
    "quantity_completed" REAL DEFAULT 0,
    "uom_id" UUID,
    "status" VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    "priority" INTEGER DEFAULT 5,
    "assigned_to_user_id" UUID,
    "started_at" TIMESTAMPTZ,
    "completed_at" TIMESTAMPTZ,
    "rate_per_unit" DECIMAL(12,4),
    "total_charge" DECIMAL(12,4),
    "notes" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "vas_execution_tasks_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "vas_exec_tasks_number_uq" UNIQUE ("tenant_id", "task_number")
);
CREATE INDEX IF NOT EXISTS "idx_vas_tasks_tenant" ON "multitenant"."vas_execution_tasks"("tenant_id", "facility_id");

-- P2: VAS Execution Charges
CREATE TABLE IF NOT EXISTS "multitenant"."vas_execution_charges" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "facility_id" UUID NOT NULL,
    "charge_number" VARCHAR(100) NOT NULL,
    "vas_task_id" UUID NOT NULL,
    "client_id" UUID,
    "service_code" VARCHAR(50),
    "service_name" VARCHAR(255),
    "quantity" REAL DEFAULT 0,
    "rate_per_unit" DECIMAL(12,4) DEFAULT 0,
    "line_total" DECIMAL(12,4) DEFAULT 0,
    "currency_code" VARCHAR(3) DEFAULT 'USD',
    "charge_status" VARCHAR(20) DEFAULT 'PENDING',
    "notes" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "vas_execution_charges_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "vas_exec_charges_number_uq" UNIQUE ("tenant_id", "charge_number")
);
CREATE INDEX IF NOT EXISTS "idx_vas_charges_tenant" ON "multitenant"."vas_execution_charges"("tenant_id", "facility_id");

-- P2: VAS Task Events
CREATE TABLE IF NOT EXISTS "multitenant"."vas_task_events" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "vas_task_id" UUID NOT NULL,
    "event_type" VARCHAR(50) NOT NULL,
    "event_payload" TEXT,
    "recorded_by" UUID,
    "recorded_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "vas_task_events_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "idx_vas_events_task" ON "multitenant"."vas_task_events"("vas_task_id");