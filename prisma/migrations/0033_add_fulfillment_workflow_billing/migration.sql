-- CreateTable: fulfillment_workflow_events
CREATE TABLE "multitenant"."fulfillment_workflow_events" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "instance_id" UUID NOT NULL,
    "event_type" VARCHAR(100) NOT NULL,
    "event_payload" JSONB,
    "recorded_by" UUID,
    "recorded_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "fulfillment_workflow_events_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "idx_fwe_instance" ON "multitenant"."fulfillment_workflow_events" ("tenant_id", "instance_id");

-- CreateTable: fulfillment_workflow_transitions
CREATE TABLE "multitenant"."fulfillment_workflow_transitions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "instance_id" UUID NOT NULL,
    "from_state" VARCHAR(200),
    "to_state" VARCHAR(200) NOT NULL,
    "transition" VARCHAR(100) NOT NULL,
    "context" JSONB,
    "triggered_by" VARCHAR(100),
    "triggered_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "fulfillment_workflow_transitions_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "idx_fwt_instance" ON "multitenant"."fulfillment_workflow_transitions" ("tenant_id", "instance_id");

-- CreateTable: fulfillment_billing_runs
CREATE TABLE "multitenant"."fulfillment_billing_runs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "facility_id" UUID NOT NULL,
    "run_number" VARCHAR(50) NOT NULL,
    "run_type" VARCHAR(30) NOT NULL,
    "period_start" DATE NOT NULL,
    "period_end" DATE NOT NULL,
    "total_transactions" INTEGER NOT NULL DEFAULT 0,
    "total_amount" DECIMAL(14, 2) NOT NULL DEFAULT 0,
    "status" VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    "executed_at" TIMESTAMPTZ,
    "error_details" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "fulfillment_billing_runs_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "fulfillment_billing_runs_number_uq" ON "multitenant"."fulfillment_billing_runs" ("tenant_id", "run_number");

-- CreateTable: fulfillment_billing_events
CREATE TABLE "multitenant"."fulfillment_billing_events" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "run_id" UUID NOT NULL,
    "entity_type" VARCHAR(50) NOT NULL,
    "entity_id" VARCHAR(100) NOT NULL,
    "event_type" VARCHAR(50) NOT NULL,
    "quantity" REAL,
    "unit_price" DECIMAL(12, 4),
    "line_total" DECIMAL(14, 2),
    "event_date" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "fulfillment_billing_events_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "idx_fbe_run" ON "multitenant"."fulfillment_billing_events" ("tenant_id", "run_id");

-- AddForeignKey: fulfillment_billing_events -> fulfillment_billing_runs
ALTER TABLE "multitenant"."fulfillment_billing_events" ADD CONSTRAINT "fulfillment_billing_events_run_id_fkey"
    FOREIGN KEY ("run_id") REFERENCES "multitenant"."fulfillment_billing_runs"("id") ON DELETE CASCADE;
