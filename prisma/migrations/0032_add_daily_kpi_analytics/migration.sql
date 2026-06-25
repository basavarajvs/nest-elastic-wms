-- CreateTable: daily_kpi_metrics
CREATE TABLE "multitenant"."daily_kpi_metrics" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "facility_id" UUID NOT NULL,
    "metric_date" DATE NOT NULL,
    "orders_created" INTEGER NOT NULL DEFAULT 0,
    "orders_shipped" INTEGER NOT NULL DEFAULT 0,
    "lines_shipped" INTEGER NOT NULL DEFAULT 0,
    "units_shipped" INTEGER NOT NULL DEFAULT 0,
    "receipts_created" INTEGER NOT NULL DEFAULT 0,
    "receipts_completed" INTEGER NOT NULL DEFAULT 0,
    "putaways_completed" INTEGER NOT NULL DEFAULT 0,
    "picks_completed" INTEGER NOT NULL DEFAULT 0,
    "packs_completed" INTEGER NOT NULL DEFAULT 0,
    "shipments_created" INTEGER NOT NULL DEFAULT 0,
    "shipments_loaded" INTEGER NOT NULL DEFAULT 0,
    "cycle_counts_completed" INTEGER NOT NULL DEFAULT 0,
    "adjustments_created" INTEGER NOT NULL DEFAULT 0,
    "exceptions_created" INTEGER NOT NULL DEFAULT 0,
    "exceptions_resolved" INTEGER NOT NULL DEFAULT 0,
    "active_users" INTEGER NOT NULL DEFAULT 0,
    "total_errors" INTEGER NOT NULL DEFAULT 0,
    "on_hand_value" DECIMAL(16, 2),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "daily_kpi_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateUnique: daily_kpi_metrics_uq
CREATE UNIQUE INDEX "daily_kpi_metrics_uq" ON "multitenant"."daily_kpi_metrics" ("tenant_id", "facility_id", "metric_date");

-- CreateIndex: idx_dkm_date
CREATE INDEX "idx_dkm_date" ON "multitenant"."daily_kpi_metrics" ("tenant_id", "facility_id", "metric_date");

-- CreateTable: location_pick_heatmaps
CREATE TABLE "multitenant"."location_pick_heatmaps" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "facility_id" UUID NOT NULL,
    "location_id" UUID NOT NULL,
    "metric_date" DATE NOT NULL,
    "pick_count" INTEGER NOT NULL DEFAULT 0,
    "pick_frequency" VARCHAR(10) NOT NULL,
    "last_picked_at" TIMESTAMPTZ,
    "travel_distance" REAL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "location_pick_heatmaps_pkey" PRIMARY KEY ("id")
);

-- CreateUnique: location_pick_heatmap_uq
CREATE UNIQUE INDEX "location_pick_heatmap_uq" ON "multitenant"."location_pick_heatmaps" ("tenant_id", "facility_id", "location_id", "metric_date");

-- CreateIndex: idx_lph_date_count
CREATE INDEX "idx_lph_date_count" ON "multitenant"."location_pick_heatmaps" ("tenant_id", "facility_id", "metric_date", "pick_count");
