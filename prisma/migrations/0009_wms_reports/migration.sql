-- CreateEnum
CREATE TYPE "multitenant"."ReportType" AS ENUM ('STOCK_ON_HAND', 'MOVEMENT_HISTORY', 'VELOCITY_ABC', 'AGING_ANALYSIS', 'DAILY_KPI', 'LOCATION_UTILIZATION');

-- CreateEnum
CREATE TYPE "multitenant"."ReportStatus" AS ENUM ('PENDING', 'GENERATING', 'COMPLETED', 'FAILED', 'EXPIRED');

-- CreateTable
CREATE TABLE "multitenant"."wms_report_jobs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "report_type" "multitenant"."ReportType" NOT NULL,
    "status" "multitenant"."ReportStatus" NOT NULL DEFAULT 'PENDING',
    "parameters" JSONB NOT NULL DEFAULT '{}',
    "row_count" INTEGER DEFAULT 0,
    "file_size_bytes" INTEGER,
    "download_url" VARCHAR(500),
    "expires_at" TIMESTAMPTZ,
    "error_message" TEXT,
    "created_by_user_id" UUID,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMPTZ,

    CONSTRAINT "wms_report_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_wrj_tenant_status_time" ON "multitenant"."wms_report_jobs"("tenant_id", "status", "created_at" DESC);
