-- CreateEnum
CREATE TYPE "multitenant"."CategoryStatus" AS ENUM ('ACTIVE', 'INACTIVE');
CREATE TYPE "multitenant"."BarcodeType" AS ENUM ('CODE128', 'EAN13', 'UPC_A', 'GS1_128', 'QR_CODE', 'INTERNAL');

-- CreateTable product_categories
CREATE TABLE "multitenant"."product_categories" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "parent_id" UUID,
    "category_code" VARCHAR(50) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "status" "multitenant"."CategoryStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    CONSTRAINT "product_categories_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "product_categories_code_uq" ON "multitenant"."product_categories"("tenant_id", "category_code");
CREATE INDEX "idx_pc_tenant_status" ON "multitenant"."product_categories"("tenant_id", "status");
ALTER TABLE "multitenant"."product_categories" ADD CONSTRAINT "product_categories_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "multitenant"."product_categories"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- CreateTable units_of_measure
CREATE TABLE "multitenant"."units_of_measure" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "code" VARCHAR(10) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "is_base" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    CONSTRAINT "units_of_measure_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "units_of_measure_code_uq" ON "multitenant"."units_of_measure"("tenant_id", "code");

-- CreateTable products
CREATE TABLE "multitenant"."products" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "category_id" UUID NOT NULL,
    "base_uom_id" UUID NOT NULL,
    "product_code" VARCHAR(100) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "track_lot" BOOLEAN NOT NULL DEFAULT false,
    "track_serial" BOOLEAN NOT NULL DEFAULT false,
    "track_expiry" BOOLEAN NOT NULL DEFAULT false,
    "shelf_life_days" INTEGER,
    "velocity_class" VARCHAR(1),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "products_code_uq" ON "multitenant"."products"("tenant_id", "product_code");
CREATE INDEX "idx_prod_tenant_active" ON "multitenant"."products"("tenant_id", "is_active");
CREATE INDEX "idx_prod_velocity" ON "multitenant"."products"("tenant_id", "velocity_class");
ALTER TABLE "multitenant"."products" ADD CONSTRAINT "products_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "multitenant"."product_categories"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;
ALTER TABLE "multitenant"."products" ADD CONSTRAINT "products_base_uom_id_fkey" FOREIGN KEY ("base_uom_id") REFERENCES "multitenant"."units_of_measure"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- CreateTable product_barcodes
CREATE TABLE "multitenant"."product_barcodes" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "barcode_value" VARCHAR(200) NOT NULL,
    "type" "multitenant"."BarcodeType" NOT NULL DEFAULT 'CODE128',
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "quantity_per_scan" INTEGER DEFAULT 1,
    "child_uom_code" VARCHAR(10),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    CONSTRAINT "product_barcodes_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "product_barcodes_barcode_value_key" ON "multitenant"."product_barcodes"("barcode_value");
CREATE INDEX "idx_pb_barcode_tenant" ON "multitenant"."product_barcodes"("barcode_value", "tenant_id");
CREATE INDEX "idx_pb_tenant_active" ON "multitenant"."product_barcodes"("tenant_id", "is_active");
ALTER TABLE "multitenant"."product_barcodes" ADD CONSTRAINT "product_barcodes_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "multitenant"."products"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- CreateTable product_attributes
CREATE TABLE "multitenant"."product_attributes" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "key" VARCHAR(100) NOT NULL,
    "value" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    CONSTRAINT "product_attributes_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "product_attributes_uq" ON "multitenant"."product_attributes"("tenant_id", "product_id", "key");
ALTER TABLE "multitenant"."product_attributes" ADD CONSTRAINT "product_attributes_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "multitenant"."products"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- CreateTable product_import_jobs
CREATE TABLE "multitenant"."product_import_jobs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "file_name" VARCHAR(255) NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    "total_rows" INTEGER NOT NULL DEFAULT 0,
    "processed_rows" INTEGER NOT NULL DEFAULT 0,
    "success_rows" INTEGER NOT NULL DEFAULT 0,
    "failed_rows" INTEGER NOT NULL DEFAULT 0,
    "error_summary" TEXT,
    "completed_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    CONSTRAINT "product_import_jobs_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "idx_pij_tenant_status" ON "multitenant"."product_import_jobs"("tenant_id", "status");

-- CreateTable product_import_results
CREATE TABLE "multitenant"."product_import_results" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "job_id" UUID NOT NULL,
    "row_num" INTEGER NOT NULL,
    "product_code" VARCHAR(100),
    "status" VARCHAR(20) NOT NULL,
    "error_message" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "product_import_results_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "idx_pir_job_status" ON "multitenant"."product_import_results"("tenant_id", "job_id", "status");
ALTER TABLE "multitenant"."product_import_results" ADD CONSTRAINT "product_import_results_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "multitenant"."product_import_jobs"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
