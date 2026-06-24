-- Create inventory_allocation_rules table
CREATE TABLE IF NOT EXISTS "multitenant"."inventory_allocation_rules" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "facility_id" UUID NOT NULL,
    "rule_name" VARCHAR(100) NOT NULL,
    "rule_type" VARCHAR(50) NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 100,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "effective_date" DATE NOT NULL DEFAULT now(),
    "expiry_date" DATE,
    "description" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT "inventory_allocation_rules_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "allocation_rules_name_uq" UNIQUE ("tenant_id", "facility_id", "rule_name")
);
CREATE INDEX IF NOT EXISTS "idx_alloc_rules_active" ON "multitenant"."inventory_allocation_rules" ("tenant_id", "facility_id", "is_active");

-- Create inventory_allocation_rule_constraints table
CREATE TABLE IF NOT EXISTS "multitenant"."inventory_allocation_rule_constraints" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "rule_id" UUID NOT NULL,
    "constraint_field" VARCHAR(50) NOT NULL,
    "constraint_operator" VARCHAR(20) NOT NULL,
    "constraint_value" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT "inventory_allocation_rule_constraints_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "alloc_rule_constraints_rule_fkey" FOREIGN KEY ("rule_id") REFERENCES "multitenant"."inventory_allocation_rules"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "idx_alloc_rule_constraints_rule" ON "multitenant"."inventory_allocation_rule_constraints" ("tenant_id", "rule_id");

-- Create inventory_allocation_rule_locations table
CREATE TABLE IF NOT EXISTS "multitenant"."inventory_allocation_rule_locations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "rule_id" UUID NOT NULL,
    "location_id" UUID NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 100,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT "inventory_allocation_rule_locations_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "alloc_rule_locations_rule_fkey" FOREIGN KEY ("rule_id") REFERENCES "multitenant"."inventory_allocation_rules"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "idx_alloc_rule_locations_rule" ON "multitenant"."inventory_allocation_rule_locations" ("tenant_id", "rule_id");
