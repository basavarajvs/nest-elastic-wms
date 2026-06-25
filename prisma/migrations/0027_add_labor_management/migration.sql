-- Phase 9: Labor Management
-- Creates labor_shifts, labor_shift_assignments, labor_time_logs, labor_performance_metrics

CREATE TABLE IF NOT EXISTS "multitenant"."labor_shifts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "facility_id" UUID NOT NULL,
    "shift_code" VARCHAR(50) NOT NULL,
    "shift_name" VARCHAR(255) NOT NULL,
    "start_time" VARCHAR(5) NOT NULL,
    "end_time" VARCHAR(5) NOT NULL,
    "timezone" VARCHAR(50) DEFAULT 'UTC',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT "labor_shifts_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "labor_shifts_code_uq" ON "multitenant"."labor_shifts"("tenant_id", "facility_id", "shift_code");

CREATE TABLE IF NOT EXISTS "multitenant"."labor_shift_assignments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "facility_id" UUID NOT NULL,
    "shift_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "effective_date" DATE NOT NULL,
    "expiry_date" DATE,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT "labor_shift_assignments_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "labor_shift_assignments_uq" ON "multitenant"."labor_shift_assignments"("tenant_id", "shift_id", "user_id", "effective_date");
CREATE INDEX IF NOT EXISTS "idx_lsa_user" ON "multitenant"."labor_shift_assignments"("tenant_id", "user_id");
ALTER TABLE "multitenant"."labor_shift_assignments" ADD CONSTRAINT "lsa_shift_id_fkey" FOREIGN KEY ("shift_id") REFERENCES "multitenant"."labor_shifts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "multitenant"."labor_time_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "facility_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "shift_id" UUID,
    "clock_in" TIMESTAMPTZ NOT NULL,
    "clock_out" TIMESTAMPTZ,
    "break_duration_minutes" INTEGER DEFAULT 0,
    "total_minutes" INTEGER,
    "overtime_minutes" INTEGER DEFAULT 0,
    "status" VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT "labor_time_logs_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "idx_ltl_user_time" ON "multitenant"."labor_time_logs"("tenant_id", "user_id", "clock_in");
CREATE INDEX IF NOT EXISTS "idx_ltl_facility_time" ON "multitenant"."labor_time_logs"("tenant_id", "facility_id", "clock_in");

CREATE TABLE IF NOT EXISTS "multitenant"."labor_performance_metrics" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "facility_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "metric_date" DATE NOT NULL,
    "total_picks" INTEGER DEFAULT 0,
    "picks_per_hour" REAL,
    "total_packs" INTEGER DEFAULT 0,
    "packs_per_hour" REAL,
    "total_receives" INTEGER DEFAULT 0,
    "total_putaways" INTEGER DEFAULT 0,
    "total_lines_counted" INTEGER DEFAULT 0,
    "accuracy_rate" REAL,
    "idle_minutes" INTEGER DEFAULT 0,
    "productive_minutes" INTEGER DEFAULT 0,
    "score" REAL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT "labor_performance_metrics_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "labor_perf_metrics_uq" ON "multitenant"."labor_performance_metrics"("tenant_id", "user_id", "metric_date");
CREATE INDEX IF NOT EXISTS "idx_lpm_date" ON "multitenant"."labor_performance_metrics"("tenant_id", "facility_id", "metric_date");
