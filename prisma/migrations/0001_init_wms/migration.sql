-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "multitenant";

-- CreateEnum
CREATE TYPE "multitenant"."FacilityType" AS ENUM ('WAREHOUSE', 'DISTRIBUTION_CENTER', 'CROSS_DOCK', 'FULFILLMENT_CENTER');

-- CreateEnum
CREATE TYPE "multitenant"."ZoneType" AS ENUM ('BULK', 'PICKING', 'RECEIVING', 'SHIPPING', 'PACKING', 'STAGING', 'QC', 'HOLD', 'YARD');

-- CreateEnum
CREATE TYPE "multitenant"."LocationType" AS ENUM ('PALLET', 'CASE', 'EACH', 'FLOOR', 'STAGING', 'DOCK', 'TEMP');

-- CreateTable resource_quotas
CREATE TABLE "multitenant"."resource_quotas" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "resource_type" VARCHAR(100) NOT NULL,
    "limit_amount" INTEGER NOT NULL,
    "current_usage" INTEGER NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "resource_quotas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "resource_quotas_type_uq" ON "multitenant"."resource_quotas"("tenant_id", "resource_type");

-- CreateTable warehouse_facilities
CREATE TABLE "multitenant"."warehouse_facilities" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "facility_code" VARCHAR(50) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "facility_type" "multitenant"."FacilityType" NOT NULL DEFAULT 'WAREHOUSE',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "attributes" JSONB,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "warehouse_facilities_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "warehouse_facilities_code_uq" ON "multitenant"."warehouse_facilities"("tenant_id", "facility_code");

-- CreateTable warehouse_zones
CREATE TABLE "multitenant"."warehouse_zones" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "facility_id" UUID NOT NULL,
    "zone_code" VARCHAR(50) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "zone_type" "multitenant"."ZoneType" NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "attributes" JSONB,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "warehouse_zones_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "warehouse_zones_code_uq" ON "multitenant"."warehouse_zones"("tenant_id", "facility_id", "zone_code");

-- AddForeignKey
ALTER TABLE "multitenant"."warehouse_zones" ADD CONSTRAINT "warehouse_zones_facility_id_fkey" FOREIGN KEY ("facility_id") REFERENCES "multitenant"."warehouse_facilities"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- CreateTable storage_locations
CREATE TABLE "multitenant"."storage_locations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "facility_id" UUID NOT NULL,
    "zone_id" UUID NOT NULL,
    "parent_id" UUID,
    "location_code" VARCHAR(100) NOT NULL,
    "location_type" "multitenant"."LocationType" NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_blocked" BOOLEAN NOT NULL DEFAULT false,
    "attributes" JSONB,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "storage_locations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "storage_locations_code_uq" ON "multitenant"."storage_locations"("tenant_id", "facility_id", "location_code");

-- CreateIndex
CREATE INDEX "idx_sl_tenant_facility_zone" ON "multitenant"."storage_locations"("tenant_id", "facility_id", "zone_id");

-- AddForeignKey
ALTER TABLE "multitenant"."storage_locations" ADD CONSTRAINT "storage_locations_zone_id_fkey" FOREIGN KEY ("zone_id") REFERENCES "multitenant"."warehouse_zones"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey (self-referencing for hierarchy)
ALTER TABLE "multitenant"."storage_locations" ADD CONSTRAINT "storage_locations_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "multitenant"."storage_locations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
