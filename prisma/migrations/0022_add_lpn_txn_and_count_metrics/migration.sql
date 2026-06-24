-- Create lpn_transactions table
CREATE TABLE IF NOT EXISTS "multitenant"."lpn_transactions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "facility_id" UUID NOT NULL,
    "lpn_id" UUID NOT NULL,
    "transaction_type" VARCHAR(50) NOT NULL,
    "from_location_id" UUID,
    "to_location_id" UUID,
    "quantity_before" REAL,
    "quantity_after" REAL,
    "quantity_change" REAL,
    "reference_type" VARCHAR(50),
    "reference_id" VARCHAR(100),
    "performed_by_user_id" UUID,
    "metadata" JSONB,
    "transaction_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT "lpn_transactions_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "idx_lpn_txn_lpn_time" ON "multitenant"."lpn_transactions" ("tenant_id", "lpn_id", "transaction_at");
CREATE INDEX IF NOT EXISTS "idx_lpn_txn_reference" ON "multitenant"."lpn_transactions" ("tenant_id", "reference_type", "reference_id");

-- Create count_accuracy_histories table
CREATE TABLE IF NOT EXISTS "multitenant"."count_accuracy_histories" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "facility_id" UUID NOT NULL,
    "count_id" UUID NOT NULL,
    "line_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "location_id" UUID NOT NULL,
    "system_quantity" REAL NOT NULL,
    "counted_quantity" REAL NOT NULL,
    "variance" REAL NOT NULL,
    "variance_percent" REAL,
    "accuracy_score" REAL,
    "adjustment_id" UUID,
    "recorded_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT "count_accuracy_histories_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "idx_cah_product" ON "multitenant"."count_accuracy_histories" ("tenant_id", "facility_id", "product_id");
CREATE INDEX IF NOT EXISTS "idx_cah_count" ON "multitenant"."count_accuracy_histories" ("tenant_id", "count_id");
CREATE INDEX IF NOT EXISTS "idx_cah_recorded" ON "multitenant"."count_accuracy_histories" ("tenant_id", "recorded_at");

-- Create cycle_count_metrics table
CREATE TABLE IF NOT EXISTS "multitenant"."cycle_count_metrics" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "facility_id" UUID NOT NULL,
    "count_id" UUID NOT NULL,
    "total_lines" INTEGER NOT NULL,
    "counted_lines" INTEGER NOT NULL,
    "zero_variance_lines" INTEGER NOT NULL,
    "positive_variance_lines" INTEGER NOT NULL,
    "negative_variance_lines" INTEGER NOT NULL,
    "total_variance" REAL NOT NULL,
    "accuracy_rate" REAL,
    "duration_minutes" INTEGER,
    "recorded_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT "cycle_count_metrics_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "cycle_count_metrics_count_uq" UNIQUE ("tenant_id", "count_id")
);
CREATE INDEX IF NOT EXISTS "idx_ccm_recorded" ON "multitenant"."cycle_count_metrics" ("tenant_id", "facility_id", "recorded_at");
