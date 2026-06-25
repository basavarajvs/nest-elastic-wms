-- Phase 12: Work Orders
-- Creates work_orders, work_order_operations, work_order_components

-- CreateTable
CREATE TABLE "multitenant"."work_orders" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "facility_id" UUID NOT NULL,
    "work_order_number" VARCHAR(50) NOT NULL,
    "work_order_type" VARCHAR(50) NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    "priority" VARCHAR(10) NOT NULL DEFAULT 'MEDIUM',
    "product_id" UUID,
    "quantity" REAL,
    "uom_id" UUID,
    "client_id" UUID,
    "requested_by_user_id" UUID,
    "assigned_to_user_id" UUID,
    "scheduled_date" TIMESTAMPTZ,
    "started_at" TIMESTAMPTZ,
    "completed_at" TIMESTAMPTZ,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "work_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "multitenant"."work_order_operations" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "work_order_id" UUID NOT NULL,
    "sequence_number" INTEGER NOT NULL,
    "operation_name" VARCHAR(255) NOT NULL,
    "operation_type" VARCHAR(50) NOT NULL,
    "assigned_to_user_id" UUID,
    "estimated_minutes" INTEGER,
    "actual_minutes" INTEGER,
    "status" VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    "started_at" TIMESTAMPTZ,
    "completed_at" TIMESTAMPTZ,
    "notes" TEXT,

    CONSTRAINT "work_order_operations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "multitenant"."work_order_components" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "work_order_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "lot_id" UUID,
    "quantity_required" REAL NOT NULL,
    "quantity_consumed" REAL NOT NULL DEFAULT 0,
    "uom_id" UUID NOT NULL,
    "notes" TEXT,

    CONSTRAINT "work_order_components_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "work_orders_tenant_id_facility_id_work_order_number_key" ON "multitenant"."work_orders"("tenant_id", "facility_id", "work_order_number");

-- CreateIndex
CREATE INDEX "idx_wo_status" ON "multitenant"."work_orders"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "idx_woo_order_seq" ON "multitenant"."work_order_operations"("tenant_id", "work_order_id", "sequence_number");

-- CreateIndex
CREATE INDEX "idx_woc_order" ON "multitenant"."work_order_components"("tenant_id", "work_order_id");

-- AddForeignKey
ALTER TABLE "multitenant"."work_order_operations" ADD CONSTRAINT "work_order_operations_work_order_id_fkey" FOREIGN KEY ("work_order_id") REFERENCES "multitenant"."work_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "multitenant"."work_order_components" ADD CONSTRAINT "work_order_components_work_order_id_fkey" FOREIGN KEY ("work_order_id") REFERENCES "multitenant"."work_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
