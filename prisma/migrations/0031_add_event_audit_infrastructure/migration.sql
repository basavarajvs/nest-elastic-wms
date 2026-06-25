-- CreateTable: warehouse_events
CREATE TABLE "multitenant"."warehouse_events" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "facility_id" UUID,
    "event_type" VARCHAR(100) NOT NULL,
    "entity_type" VARCHAR(50) NOT NULL,
    "entity_id" VARCHAR(100) NOT NULL,
    "event_data" JSONB,
    "source" VARCHAR(50),
    "performed_by_user_id" UUID,
    "occurred_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "warehouse_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: idx_we_entity
CREATE INDEX "idx_we_entity" ON "multitenant"."warehouse_events" ("tenant_id", "entity_type", "entity_id");

-- CreateIndex: idx_we_type_time
CREATE INDEX "idx_we_type_time" ON "multitenant"."warehouse_events" ("tenant_id", "event_type", "occurred_at");

-- CreateIndex: idx_we_facility_time
CREATE INDEX "idx_we_facility_time" ON "multitenant"."warehouse_events" ("tenant_id", "facility_id", "occurred_at");

-- CreateTable: system_audit_logs
CREATE TABLE "multitenant"."system_audit_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "facility_id" UUID,
    "action" VARCHAR(100) NOT NULL,
    "entity_type" VARCHAR(50) NOT NULL,
    "entity_id" VARCHAR(100) NOT NULL,
    "old_value" JSONB,
    "new_value" JSONB,
    "changed_by_user_id" UUID,
    "ip_address" VARCHAR(50),
    "user_agent" VARCHAR(500),
    "occurred_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "system_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: idx_sal_entity
CREATE INDEX "idx_sal_entity" ON "multitenant"."system_audit_logs" ("tenant_id", "entity_type", "entity_id", "occurred_at");

-- CreateIndex: idx_sal_action_time
CREATE INDEX "idx_sal_action_time" ON "multitenant"."system_audit_logs" ("tenant_id", "action", "occurred_at");

-- CreateIndex: idx_sal_user_time
CREATE INDEX "idx_sal_user_time" ON "multitenant"."system_audit_logs" ("tenant_id", "changed_by_user_id", "occurred_at");
