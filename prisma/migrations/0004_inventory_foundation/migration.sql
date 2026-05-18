-- CreateEnum
CREATE TYPE "multitenant"."TransactionType" AS ENUM ('RECEIPT', 'PUTAWAY', 'PICK', 'PACK', 'SHIP', 'ADJUSTMENT_INCREASE', 'ADJUSTMENT_DECREASE', 'TRANSFER_IN', 'TRANSFER_OUT', 'CYCLE_COUNT_RESERVE', 'CYCLE_COUNT_RELEASE', 'HOLD_RELEASE', 'QC_PASS', 'QC_FAIL', 'REWORK', 'SCRAPP');
CREATE TYPE "multitenant"."TransactionStatus" AS ENUM ('COMPLETED', 'CANCELLED', 'ERROR');
CREATE TYPE "multitenant"."HoldType" AS ENUM ('QC_PENDING', 'QC_FAILED', 'DAMAGE', 'CYCLE_COUNT', 'CREDIT_HOLD', 'CUSTOMER_REQUEST', 'QUARANTINE');
CREATE TYPE "multitenant"."HoldStatus" AS ENUM ('ACTIVE', 'RELEASED', 'EXPIRED');

-- CreateTable inventory_lots
CREATE TABLE "multitenant"."inventory_lots" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "facility_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "lot_number" VARCHAR(100) NOT NULL,
    "supplier_lot_number" VARCHAR(100),
    "mfg_date" DATE,
    "expiry_date" DATE,
    "received_date" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" VARCHAR(20) NOT NULL DEFAULT 'AVAILABLE',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    CONSTRAINT "inventory_lots_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "inventory_lots_uq" ON "multitenant"."inventory_lots"("tenant_id", "facility_id", "product_id", "lot_number");
CREATE INDEX "idx_lot_fefo" ON "multitenant"."inventory_lots"("tenant_id", "product_id", "expiry_date");

-- CreateTable inventory_on_hand
CREATE TABLE "multitenant"."inventory_on_hand" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "facility_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "location_id" UUID NOT NULL,
    "lot_id" UUID NOT NULL,
    "quantity_on_hand" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "quantity_allocated" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "quantity_reserved" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "quantity_picked" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "quantity_on_hold" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "quantity_damaged" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "uom_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    CONSTRAINT "inventory_on_hand_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "inventory_on_hand_uq" ON "multitenant"."inventory_on_hand"("tenant_id", "facility_id", "product_id", "location_id", "lot_id");
CREATE INDEX "idx_onhand_product" ON "multitenant"."inventory_on_hand"("tenant_id", "facility_id", "product_id");
CREATE INDEX "idx_onhand_location" ON "multitenant"."inventory_on_hand"("tenant_id", "facility_id", "location_id");

ALTER TABLE "multitenant"."inventory_on_hand" ADD CONSTRAINT "inventory_on_hand_lot_id_fkey" FOREIGN KEY ("lot_id") REFERENCES "multitenant"."inventory_lots"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- CreateTable inventory_transactions
CREATE TABLE "multitenant"."inventory_transactions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "facility_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "location_id" UUID,
    "location_id_to" UUID,
    "lot_id" UUID,
    "transaction_type" "multitenant"."TransactionType" NOT NULL,
    "transaction_status" "multitenant"."TransactionStatus" NOT NULL DEFAULT 'COMPLETED',
    "quantity" DOUBLE PRECISION NOT NULL,
    "quantity_before" DOUBLE PRECISION NOT NULL,
    "quantity_after" DOUBLE PRECISION NOT NULL,
    "uom_id" UUID NOT NULL,
    "reference_type" VARCHAR(50) NOT NULL,
    "reference_id" VARCHAR(100),
    "reason_code" VARCHAR(50),
    "performed_by_user_id" UUID,
    "metadata" JSONB,
    "transaction_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "inventory_transactions_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "idx_txn_product_time" ON "multitenant"."inventory_transactions"("tenant_id", "product_id", "transaction_at" DESC);
CREATE INDEX "idx_txn_location" ON "multitenant"."inventory_transactions"("tenant_id", "location_id");
CREATE INDEX "idx_txn_reference" ON "multitenant"."inventory_transactions"("tenant_id", "reference_type", "reference_id");
CREATE INDEX "idx_txn_created" ON "multitenant"."inventory_transactions"("created_at");

-- CreateTable inventory_holds
CREATE TABLE "multitenant"."inventory_holds" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "facility_id" UUID NOT NULL,
    "product_id" UUID,
    "location_id" UUID,
    "lot_id" UUID,
    "hold_type" "multitenant"."HoldType" NOT NULL,
    "status" "multitenant"."HoldStatus" NOT NULL DEFAULT 'ACTIVE',
    "reason" TEXT,
    "placed_by_user_id" UUID NOT NULL,
    "released_by_user_id" UUID,
    "released_at" TIMESTAMPTZ,
    "expires_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    CONSTRAINT "inventory_holds_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "idx_hold_status" ON "multitenant"."inventory_holds"("tenant_id", "status");
CREATE INDEX "idx_hold_lot_status" ON "multitenant"."inventory_holds"("tenant_id", "lot_id", "status");

-- CreateTable inventory_adjustments
CREATE TABLE "multitenant"."inventory_adjustments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "facility_id" UUID NOT NULL,
    "adjustment_number" VARCHAR(50) NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    "reason_code" VARCHAR(50) NOT NULL,
    "requested_by_user_id" UUID NOT NULL,
    "approved_by_user_id" UUID,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    CONSTRAINT "inventory_adjustments_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "inventory_adjustments_uq" ON "multitenant"."inventory_adjustments"("tenant_id", "facility_id", "adjustment_number");

-- CreateTable inventory_adjustment_lines
CREATE TABLE "multitenant"."inventory_adjustment_lines" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "facility_id" UUID NOT NULL,
    "adjustment_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "location_id" UUID NOT NULL,
    "lot_id" UUID,
    "quantity_before" DOUBLE PRECISION NOT NULL,
    "quantity_adjustment" DOUBLE PRECISION NOT NULL,
    "quantity_after" DOUBLE PRECISION NOT NULL,
    "uom_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "inventory_adjustment_lines_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "idx_adj_line_adjustment" ON "multitenant"."inventory_adjustment_lines"("tenant_id", "adjustment_id");
ALTER TABLE "multitenant"."inventory_adjustment_lines" ADD CONSTRAINT "inventory_adjustment_lines_adjustment_id_fkey" FOREIGN KEY ("adjustment_id") REFERENCES "multitenant"."inventory_adjustments"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- CreateTable inventory_policies
CREATE TABLE "multitenant"."inventory_policies" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "facility_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "location_id" UUID,
    "reorder_point" DOUBLE PRECISION NOT NULL,
    "max_stock_level" DOUBLE PRECISION NOT NULL,
    "safety_stock" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    CONSTRAINT "inventory_policies_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "inventory_policies_uq" ON "multitenant"."inventory_policies"("tenant_id", "facility_id", "product_id", "location_id");
