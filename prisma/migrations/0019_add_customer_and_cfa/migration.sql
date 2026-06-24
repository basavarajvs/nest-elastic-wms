-- Create customers table
CREATE TABLE IF NOT EXISTS "multitenant"."customers" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "customer_code" VARCHAR(50) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "customer_type" VARCHAR(50),
    "primary_contact_name" VARCHAR(255),
    "primary_email" VARCHAR(255),
    "primary_phone" VARCHAR(50),
    "billing_address_line_1" VARCHAR(255),
    "billing_address_line_2" VARCHAR(255),
    "billing_city" VARCHAR(100),
    "billing_state" VARCHAR(100),
    "billing_postal_code" VARCHAR(20),
    "billing_country" VARCHAR(100),
    "shipping_address_line_1" VARCHAR(255),
    "shipping_address_line_2" VARCHAR(255),
    "shipping_city" VARCHAR(100),
    "shipping_state" VARCHAR(100),
    "shipping_postal_code" VARCHAR(20),
    "shipping_country" VARCHAR(100),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT "customers_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "customers_code_uq" UNIQUE ("tenant_id", "customer_code")
);
CREATE INDEX IF NOT EXISTS "idx_cust_tenant_active" ON "multitenant"."customers" ("tenant_id", "is_active");

-- Create client_facility_assignments table
CREATE TABLE IF NOT EXISTS "multitenant"."client_facility_assignments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "client_id" UUID NOT NULL,
    "facility_id" UUID NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "effective_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "expires_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT "client_facility_assignments_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "client_facility_assignments_uq" UNIQUE ("tenant_id", "client_id", "facility_id")
);
CREATE INDEX IF NOT EXISTS "idx_cfa_facility" ON "multitenant"."client_facility_assignments" ("tenant_id", "facility_id");

-- Add customer_id column to sales_orders
ALTER TABLE "multitenant"."sales_orders" ADD COLUMN IF NOT EXISTS "customer_id" UUID;
